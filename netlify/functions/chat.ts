import { GoogleGenAI } from "@google/genai";
import { generateSmartReasoningResponse } from "../../src/services/smartReasoningEngine";

const INFBOTT_SYSTEM_INSTRUCTION = `You are INFBOTT, a real, production-ready, intelligent, capable, and reliable AI assistant.

CORE IDENTITY
You are a highly intelligent, emotionally aware, natural conversational AI assistant created by Duckeyy/Ravi to make users life easy.
Your goal is not only to answer questions, but to understand the user's intent, mood, context, and communication style and respond in a way that feels natural, helpful, respectful, and human-like.
You understand English, Hindi, and Hinglish fluently.

CREATOR & DEVELOPER IDENTITY:
If asked who created you, who made you, who is your developer, or who owns you, ALWAYS answer:
"Duckeyy/Ravi Create Me to make users life easy 😊"

CAPABILITIES:
- Advanced software engineering, debugging, architecture, full-stack code (TypeScript, Python, C++, React, etc.).
- Natural conversational reasoning, problem solving, analysis.
- Minecraft modding, datapacks, commands, and schematics.
- Web research & source citations when fresh facts or live information are requested.`;

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
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
    const { message, previousMessages, modelType, attachments, enableSearch, customSystemInstructions } = body;

    const isPro = modelType === 'pro';
    const modelsToTry = [
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemma-4-26b-a4b-it",
      "gemini-3.8-flash",
      "gemini-flash-latest"
    ];

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

    // Real system clock context
    const nowClock = new Date();
    const realTimeClockContext = `\n\n[REAL-TIME SYSTEM CLOCK]: Current Time is ${nowClock.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}).\n`;

    // Custom Persona & System Instructions
    let customPersonaContext = '';
    if (customSystemInstructions && typeof customSystemInstructions === 'string' && customSystemInstructions.trim()) {
      customPersonaContext = `\n\n[USER CUSTOM SYSTEM INSTRUCTIONS & PERSISTENT PERSONA]:\n${customSystemInstructions.trim().slice(0, 3000)}\n[END OF CUSTOM INSTRUCTIONS]\n`;
    }

    const effectiveInstruction = `${INFBOTT_SYSTEM_INSTRUCTION}${realTimeClockContext}${customPersonaContext}`;

    // Web search tool grounding if requested or relevant
    const needsSearch = Boolean(
      enableSearch ||
      /\b(today|yesterday|tomorrow|current|currently|now|latest|news|update|recent|recently|stock|price|weather|release|score|live|election)\b/i.test(message || '')
    );
    const tools: any[] = [];
    if (needsSearch) {
      tools.push({ googleSearch: {} });
    }

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
              text: `\n\n[Attached Document: ${att.name || 'File'}]\n${dataToUse}\n[End of Document]`
            });
          }
        }
      }
    }

    if (parts.length === 0) {
      parts.push({ text: "Hello! I am ready to assist you." });
    }

    let streamResponse = null;
    let lastError: any = null;

    for (const mName of modelsToTry) {
      let toolsToUse = tools && tools.length > 0 ? tools : undefined;
      let shouldRetryWithoutTools = false;

      do {
        try {
          const chat = ai.chats.create({
            model: mName,
            history: geminiHistory,
            config: {
              systemInstruction: effectiveInstruction,
              ...(toolsToUse ? { tools: toolsToUse } : {})
            },
          });
          streamResponse = await chat.sendMessageStream({ message: parts });
          shouldRetryWithoutTools = false;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Netlify chat model ${mName} stream failed (withTools=${Boolean(toolsToUse)}):`, err?.status, err?.message);
          if (toolsToUse) {
            toolsToUse = undefined;
            shouldRetryWithoutTools = true;
            continue;
          }
          shouldRetryWithoutTools = false;
        }
      } while (shouldRetryWithoutTools);

      if (streamResponse) {
        break;
      }
    }

    if (!streamResponse) {
      const fallbackText = generateSmartReasoningResponse(message || 'Hello', previousMessages || []);
      const pieces = fallbackText.split(/(\n\n|[.!?]\s+|\s+)/).filter(Boolean);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const p of pieces) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: p })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`));
            }

            const candidates = (chunk as any)?.candidates;
            if (candidates && candidates[0]?.groundingMetadata) {
              const gm = candidates[0].groundingMetadata;
              const groundingChunks = gm.groundingChunks || [];
              const sources = groundingChunks
                .filter((c: any) => c.web?.uri)
                .map((c: any) => ({
                  title: c.web.title || new URL(c.web.uri).hostname,
                  url: c.web.uri,
                  snippet: c.web.snippet || ''
                }));

              if (sources.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`));
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error', canRetry: true })}\n\n`));
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
