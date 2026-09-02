import { GoogleGenAI } from "@google/genai";

export interface Attachment {
  type: 'image' | 'document' | 'file';
  data: string; // base64 for images, text content for documents, URL for files
  mimeType?: string;
  name: string;
}

export type ModelType = 'chill' | 'thinking' | 'pro' | 'fast';

const SYSTEM_INSTRUCTION = `You are a powerful, highly capable, and extremely fast AI assistant.
Your goal is to provide clear, accurate, and helpful responses to the user's queries.
You are fluent in both English and Hindi. If the user speaks Hindi, respond in Hindi or a mix of both as appropriate.
IMPORTANT: You CANNOT generate photos, images, music, or audio. Politely explain that this feature is unavailable.
Keep your responses VERY concise, short, and easy to read. Use bullet points and bold text for clarity.
Be polite, professional, and innovative in your responses.`;

function cleanErrorMessage(status: number, rawText: string): string {
  if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('Page not found')) {
    if (status === 404) {
      return "Backend endpoint /api/chat not found (404). If running as a static export or on Netlify, please verify that Netlify serverless functions or backend proxy is enabled.";
    }
    return `Server returned HTTP ${status} (HTML response). Please check your server or network connection.`;
  }
  return rawText.slice(0, 300);
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
    throw new Error("Chat backend returned 404 and no client-side Gemini API key is configured. Please ensure your backend is running or configure GEMINI_API_KEY.");
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
    model: "gemini-2.5-flash",
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
  for await (const chunk of streamResponse) {
    if (chunk.text) {
      yield { type: 'text', content: chunk.text };
    }
  }
}

export async function* getChatResponseStream(
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[],
  modelType: ModelType = 'chill',
  attachments: Attachment[] = [],
  temperature: number = 0.7
) {
  function safeStringify(obj: any) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return;
        }
        cache.add(value);
      }
      return value;
    });
  }

  let useClientFallback = false;
  let serverErrorStatus = 0;
  let serverErrorText = '';

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
        temperature
      })
    });

    if (!response.ok) {
      serverErrorStatus = response.status;
      serverErrorText = await response.text();
      // If 404 or HTML error, try client fallback
      if (response.status === 404 || serverErrorText.includes('<!DOCTYPE') || serverErrorText.includes('<html')) {
        useClientFallback = true;
      } else {
        throw new Error(`Server returned ${response.status}: ${cleanErrorMessage(response.status, serverErrorText)}`);
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
    if (error?.message && !error.message.includes('404') && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
      // Check if it was explicitly thrown as a standard server error
      if (!useClientFallback) {
        throw error;
      }
    }
    useClientFallback = true;
  }

  if (useClientFallback) {
    try {
      yield* clientSideFallbackStream(message, history, attachments);
    } catch (fallbackError: any) {
      if (serverErrorStatus === 404 || serverErrorText.includes('Page not found') || serverErrorText.includes('<!DOCTYPE')) {
        throw new Error(cleanErrorMessage(404, serverErrorText));
      }
      throw fallbackError;
    }
  }
}

// Stubs for removed features
export async function generateImage(prompt: string, aspectRatio: string = "1:1", style?: string): Promise<string> {
  throw new Error("Image generating features are removed.");
}
export async function generateMusic(prompt: string, genre: string, mood: string): Promise<string> {
  throw new Error("Music generating features are removed.");
}
export async function generateAudio(text: string, voiceName?: string, temperature?: number): Promise<string> {
  throw new Error("Audio generating features are removed.");
}
export async function transcribeAudio(base64Audio: string, mimeType?: string): Promise<string> {
  throw new Error("Audio generating features are removed.");
}
export async function summarizeContent(content: string): Promise<string> {
  try {
    const stream = getChatResponseStream(`Please provide a concise, well-structured bullet-point summary of the following conversation with key points and action items:\n\n${content}`, []);
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
