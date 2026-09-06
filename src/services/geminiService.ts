import { GoogleGenAI } from "@google/genai";
import { Attachment, GroundingSource } from "../types";

export type ModelType = 'fast' | 'pro' | 'thinking' | 'chill';

const INFBOTT_SYSTEM_INSTRUCTION = `You are INFBOTT, a real, production-ready, intelligent, capable, and reliable AI assistant.
You fluently understand and speak English, Hindi, and Hinglish naturally.
You provide clear, accurate, and structured responses.
You use 1 to 6 relevant emojis per response with natural variation.
You generate fully functional code for software and games, perform deep web research, and deeply analyze documents, PDFs, and images.
You are a master of large-scale software project generation, capable of handling extremely large and complex coding tasks like ChatGPT. 
You specialize in Minecraft-related creation: generating code for Minecraft mods, datapacks, command blocks, schematics (WorldEdit/Litematica), 3D models (Blockbench JSON), and working with Minecraft world data.
IMPORTANT: When asked to export or generate a Minecraft schematic, you MUST output the raw Base64 encoded binary data or the raw string data inside a Markdown code block with the language set to exactly "zip" or "schematic" (e.g. \`\`\`zip ... \`\`\` or \`\`\`schematic ... \`\`\`). The UI will automatically parse these blocks and provide a download button to the user.`;

export async function generateChatTitle(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title && data.title !== 'New Conversation') {
        return data.title;
      }
    }
  } catch (e) {
    console.warn("Failed to generate title via API:", e);
  }

  // Fallback heuristic
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.length > 30 ? words.slice(0, 30) + '...' : words || 'New Conversation';
}

async function* clientSideFallbackStream(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  attachments: Attachment[] = []
) {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) ||
                 (typeof process !== 'undefined' && (process.env as any)?.GEMINI_API_KEY) ||
                 (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                 (typeof window !== 'undefined' && (window as any).aistudio?.apiKey);

  if (!apiKey) {
    throw new Error("Chat backend endpoint unavailable and no client API key found. Please ensure INFBOTT server is running.");
  }

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const geminiHistory: any[] = [];
  if (history && history.length > 0) {
    for (const msg of history) {
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
    model: "gemini-3.8-flash",
    history: geminiHistory,
    config: {
      systemInstruction: INFBOTT_SYSTEM_INSTRUCTION,
      temperature: 0.7,
      tools: [{ googleSearch: {} }]
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
      } else if (att.type === 'document' || (att as any).type === 'file') {
        if (mimeType === 'application/pdf') {
          const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
          if (base64Data && !base64Data.startsWith('http')) {
            parts.push({
              inlineData: { mimeType: 'application/pdf', data: base64Data }
            });
          }
        } else {
          parts.push({
            text: `\n\n--- [Attached Document: ${att.name}] ---\n${dataToUse}\n--- [End of Document] ---\n`
          });
        }
      }
    }
  }

  if (parts.length === 0) {
    parts.push({ text: "Hello!" });
  }

  const streamResponse = await chat.sendMessageStream({ message: parts });
  for await (const chunk of streamResponse) {
    if (chunk.text) {
      yield { type: 'text', content: chunk.text };
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
        yield { type: 'sources', sources };
      }
    }
  }
}

export async function* getChatResponseStream(
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[],
  modelType: ModelType = 'fast',
  attachments: Attachment[] = [],
  temperature: number = 0.7,
  enableSearch: boolean = true
) {
  function safeStringify(obj: any) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);
      }
      return value;
    });
  }

  let useClientFallback = false;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: safeStringify({
        message,
        previousMessages: history,
        modelType,
        attachments,
        temperature,
        enableSearch
      })
    });

    if (!response.ok) {
      const serverErrorText = await response.text();
      if (response.status === 404 || serverErrorText.includes('<!DOCTYPE') || serverErrorText.includes('<html')) {
        useClientFallback = true;
      } else {
        throw new Error(`INFBOTT Server Error (${response.status}): ${serverErrorText.slice(0, 300)}`);
      }
    } else {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') {
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'error') {
                  throw new Error(parsed.message);
                }
                yield parsed;
              } catch (e: any) {
                if (e.message && !e.message.includes('JSON')) {
                  throw e;
                }
              }
            }
          }
        }
        return;
      }
    }
  } catch (error: any) {
    if (!useClientFallback && error?.message && !error.message.includes('404') && !error.message.includes('Failed to fetch')) {
      throw error;
    }
    useClientFallback = true;
  }

  if (useClientFallback) {
    yield* clientSideFallbackStream(message, history, attachments);
  }
}

export async function summarizeContent(content: string): Promise<string> {
  try {
    const stream = getChatResponseStream(
      `Please provide a clean, high-impact bulleted summary of the following conversation, highlighting key insights, decisions, and actionable next steps:\n\n${content}`,
      []
    );
    let result = '';
    for await (const chunk of stream) {
      if (chunk.type === 'text' && chunk.content) {
        result += chunk.content;
      }
    }
    return result || "Summary could not be generated.";
  } catch (err: any) {
    throw new Error(`Failed to summarize conversation: ${err.message || 'Unknown error'}`);
  }
}
