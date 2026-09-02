import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a powerful, highly capable, and extremely fast AI assistant.
Your goal is to provide clear, accurate, and helpful responses to the user's queries.
You are fluent in both English and Hindi. If the user speaks Hindi, respond in Hindi or a mix of both as appropriate.
IMPORTANT: You CANNOT generate photos, images, music, or audio. Politely explain that this feature is unavailable.
Keep your responses VERY concise, short, and easy to read. Use bullet points and bold text for clarity.
Be polite, professional, and innovative in your responses.`;

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  try {
    const body = await req.json();
    const { message, previousMessages, modelType, attachments } = body;

    const modelName = "gemini-2.5-flash";
    const geminiHistory: any[] = [];
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        geminiHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content || "..." }]
        });
      }
    }

    if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
      geminiHistory.pop();
    }

    const chat = ai.chats.create({
      model: modelName,
      history: geminiHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const parts: any[] = [];
    if (message) parts.push({ text: message });
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const dataToUse = att.data;
        const mimeType = att.mimeType || 'image/png';
        if (att.type === 'image') {
          const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
          if (base64Data && !base64Data.startsWith('http')) {
            parts.push({
              inlineData: { mimeType, data: base64Data }
            });
          }
        } else if (att.type === 'document' || att.type === 'file') {
          if (mimeType === 'application/pdf') {
            const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
            if (base64Data && !base64Data.startsWith('http')) {
              parts.push({
                inlineData: { mimeType: 'application/pdf', data: base64Data }
              });
            }
          } else {
            parts.push({
              text: `\n\n[Attached Document: ${att.name}]\n${dataToUse}\n[End of Document]`
            });
          }
        }
      }
    }

    if (parts.length === 0) {
      parts.push({ text: "..." });
    }

    const streamResponse = await chat.sendMessageStream({ message: parts });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Failed to process chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/api/chat",
};
