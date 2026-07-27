export interface Attachment {
  type: 'image' | 'document' | 'file';
  data: string; // base64 for images, text content for documents, URL for files
  mimeType?: string;
  name: string;
}

export type ModelType = 'chill' | 'thinking' | 'pro' | 'fast';

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
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.add(value);
      }
      return value;
    });
  }

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
    const errorText = await response.text();
    throw new Error(`Server returned ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // keep the last potentially incomplete part

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
          } catch (e) {
            // Ignored if not JSON and not [DONE]
          }
        }
      }
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
  throw new Error("Summarize features are removed.");
}
