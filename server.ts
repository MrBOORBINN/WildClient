import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a powerful, highly capable, and extremely fast AI assistant.
Your goal is to provide clear, accurate, and helpful responses to the user's queries.
You are fluent in both English and Hindi. If the user speaks Hindi, respond in Hindi or a mix of both as appropriate.
IMPORTANT: You CANNOT generate photos, images, music, or audio. Politely explain that this feature is unavailable.
Keep your responses VERY concise, short, and easy to read. Use bullet points and bold text for clarity.
Be polite, professional, and innovative in your responses.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // SSE endpoint for streaming chat
  app.options("/api/chat", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.post("/api/chat", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    try {
      const { message, previousMessages, modelType, attachments } = req.body;
      
      let modelName = "gemini-2.5-flash"; 
      let thinkingConfig = undefined;

      // Ensure we don't try to use models that hit quota limits or break the API
      if (modelType === 'pro' || modelType === 'thinking') {
        modelName = "gemini-2.5-flash";
      }

      const geminiHistory = [];
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
          thinkingConfig,
          temperature: 0.7,
        },
      });

      const parts = [];
      if (message) {
        parts.push({ text: message });
      }

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          let dataToUse = att.data;
          let mimeType = att.mimeType || 'image/png';
          
          if (att.type === 'image') {
            const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
            if (base64Data && !base64Data.startsWith('http')) {
              parts.push({
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              });
            }
          } else if (att.type === 'document' || att.type === 'file') {
             if (mimeType === 'application/pdf') {
               const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
               if (base64Data && !base64Data.startsWith('http')) {
                 parts.push({
                   inlineData: {
                     mimeType: 'application/pdf',
                     data: base64Data
                   }
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

      let streamResponse;
      let retries = 3;
      while (retries > 0) {
        try {
          streamResponse = await chat.sendMessageStream({ message: parts });
          break; // success
        } catch (error: any) {
          retries--;
          // Check if it's a 503 or 429
          if (retries > 0 && (error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('429'))) {
            console.log(`Backend proxy: retry ${3 - retries} due to ${error.status || '503/429'}. Waiting 2s...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            throw error; // throw if out of retries or not a retryable error
          }
        }
      }

      if (!streamResponse) {
        throw new Error("Failed to get stream response after retries.");
      }

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
    } catch (error: any) {
      console.error("API Error in backend proxy:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || "Failed to get response." })}\n\n`);
    } finally {
      res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      // Only serve index.html for GET requests that don't match other routes
      if (req.method === 'GET') {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
