import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const INFBOTT_SYSTEM_INSTRUCTION = `You are INFBOTT, a real, production-ready, intelligent, capable, and reliable AI assistant.

CORE ATTRIBUTES & PRINCIPLES:
1. IDENTITY: You are INFBOTT. You provide accurate, intelligent, functional, and natural assistance.
2. NATURAL MULTILINGUAL COMMUNICATION: You fluently understand and speak English, Hindi, and Hinglish naturally. Seamlessly match the user's conversational language.
3. BEHAVIOUR & EXPRESSION:
   - Calm, natural, helpful, intelligent, clear, confident, and friendly.
   - Use 1 to 6 relevant emojis per response with natural variation to enhance readability.
   - Avoid empty buzzwords, over-promising, or simulated features.
4. WEB RESEARCH & GROUNDING:
   - When web research or fresh information is needed, synthesize factual insights from authoritative sources.
   - Provide concise citations and clearly distinguish verified facts from uncertainty.
   - Never claim to have accessed the live web unless tools or grounded results are available.
5. VISION & MULTI-FILE UNDERSTANDING:
   - Thoroughly analyze uploaded images, diagrams, system architecture charts, error screenshots, PDFs, documents (DOCX, TXT), CSV spreadsheets, JSON schemas, and code files.
   - Extract key insights, identify visual components, diagnose errors visible in screenshots, and summarize or cross-reference documents.
6. ADVANCED CODING & GAME DEVELOPMENT:
   - Generate production-ready, clean, well-commented code in JavaScript, TypeScript, Python, Java, Kotlin, C++, C#, HTML, CSS, SQL, JSON, and Bash.
   - You are a master of large-scale software project generation, capable of handling extremely large and complex coding tasks like ChatGPT.
   - When asked for games (e.g. 2D platformers, puzzle games, arcade games, Snake, Pong, Canvas games), provide complete, runnable code containing canvas loops, keyboard/touch input handlers, and score trackers.
7. MINECRAFT EXPERTISE & GENERATION:
   - You specialize in Minecraft-related creation: generating code for Minecraft mods, datapacks, command blocks, schematics (WorldEdit/Litematica), 3D models (Blockbench JSON), and working with Minecraft world data.
   - IMPORTANT: When asked to export or generate a Minecraft schematic, you MUST output the raw Base64 encoded binary data or the raw string data inside a Markdown code block with the language set to exactly "zip" or "schematic" (e.g. \`\`\`zip ... \`\`\` or \`\`\`schematic ... \`\`\`). The UI will automatically parse these blocks and provide a download button to the user.
8. INTELLIGENT TASK AGENT:
   - For complex multi-step problems, follow a structured approach: UNDERSTAND → PLAN → EXECUTE → VERIFY → RESPOND.
   - Explain your step-by-step logic clearly when helpful.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Chat title auto-generation endpoint
  app.post("/api/title", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.json({ title: "New Conversation" });
    }

    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.json({ title: "New Conversation" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let retries = 5;
      let response;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Generate a short, concise 3 to 6 word title summarizing the main topic of this user prompt. Do not use quotes or punctuation.\n\nUser prompt: ${message.slice(0, 500)}`,
            config: {
              temperature: 0.3,
            }
          });
          break;
        } catch (error: any) {
          retries--;
          if (retries > 0 && (error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('429') || error?.message?.includes('UNAVAILABLE'))) {
            const delay = 1500 * (5 - retries);
            await new Promise(r => setTimeout(r, delay));
          } else {
            throw error;
          }
        }
      }

      const cleanTitle = (response?.text || "").trim().replace(/^["']|["']$/g, '').slice(0, 40) || "New Conversation";
      res.json({ title: cleanTitle });
    } catch (err: any) {
      console.warn("Title generation failed, using fallback:", err?.message);
      res.json({ title: "New Conversation" });
    }
  });

  // SSE endpoint for streaming chat
  app.post("/api/chat", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    try {
      const { message, previousMessages, modelType, attachments, enableSearch } = req.body;
      
      const modelName = "gemini-3.8-flash";

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

      // Configure tools: Enable Google Search Grounding for web research only if requested
      const tools: any[] = [];
      if (enableSearch) {
        tools.push({ googleSearch: {} });
      }

      const chat = ai.chats.create({
        model: modelName,
        history: geminiHistory,
        config: {
          systemInstruction: INFBOTT_SYSTEM_INSTRUCTION,
          temperature: 0.7,
          tools,
        },
      });

      const parts: any[] = [];
      if (message) {
        parts.push({ text: message });
      }

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          const dataToUse = att.data || '';
          const mimeType = att.mimeType || 'image/png';
          
          if (att.type === 'image') {
            const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
            if (base64Data && !base64Data.startsWith('http')) {
              parts.push({
                inlineData: {
                  mimeType,
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
              // Raw text, code, CSV, JSON, or DOCX parsed text
              parts.push({
                text: `\n\n--- [Attached Document: ${att.name || 'File'}] ---\n${dataToUse}\n--- [End of ${att.name || 'File'}] ---\n`
              });
            }
          }
        }
      }

      if (parts.length === 0) {
        parts.push({ text: "Hello! I am ready to assist you." });
      }

      let streamResponse;
      let retries = 5;
      while (retries > 0) {
        try {
          streamResponse = await chat.sendMessageStream({ message: parts });
          break;
        } catch (error: any) {
          retries--;
          if (retries > 0 && (error?.status === 503 || error?.status === 429 || error?.message?.includes('503') || error?.message?.includes('429') || error?.message?.includes('UNAVAILABLE'))) {
            const delay = 2000 * (5 - retries);
            console.log(`Backend proxy: retry ${5 - retries} due to ${error.status || 'rate limit'}. Waiting ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
          } else {
            throw error;
          }
        }
      }

      if (!streamResponse) {
        throw new Error("Failed to initialize stream response.");
      }

      for await (const chunk of streamResponse) {
        // Send text delta
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
        }

        // Send web grounding metadata if present
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
            res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
    } catch (error: any) {
      console.error("API Error in backend proxy:", error);
      let friendlyMessage = error.message || "Failed to get response.";
      
      if (friendlyMessage.includes('UNAVAILABLE') || friendlyMessage.includes('503')) {
        friendlyMessage = "INFBOTT is currently experiencing very high global demand (Server 503). Spikes in demand are temporary. Please wait a moment and try again.";
      } else if (friendlyMessage.includes('429') || friendlyMessage.includes('quota') || friendlyMessage.includes('Resource Exhausted')) {
        friendlyMessage = "INFBOTT has reached its API quota limit. Please wait a moment and try again, or configure your own Gemini API Key in the settings to continue.";
      }

      res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMessage })}\n\n`);
    } finally {
      clearInterval(keepAlive);
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
      if (req.method === 'GET') {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`INFBOTT Server running on http://localhost:${PORT}`);
  });
}

startServer();
