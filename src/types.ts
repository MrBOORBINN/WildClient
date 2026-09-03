export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  message_count: number;
}

export interface Session {
  id: string | number;
  title: string;
  created_at: string;
  user_id: number | string;
}

export interface Attachment {
  type: 'image' | 'document' | 'file';
  data: string;
  mimeType?: string;
  name: string;
}

export interface GroundingSource {
  title?: string;
  url?: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  reaction?: 'thumbs_up' | 'thumbs_down' | 'heart' | null;
}

export type SnippetColor = 'amber' | 'emerald' | 'sky' | 'purple' | 'rose';

export interface NotebookSnippet {
  id: string;
  userId: string;
  text: string;
  note?: string;
  color?: SnippetColor;
  tag?: string;
  messageId?: string;
  sessionId?: string;
  sessionTitle?: string;
  createdAt: number;
}

export type GameDevTask = 'brainstorm' | 'code' | 'debug' | 'level' | 'asset' | 'math' | 'planning' | 'marketing' | 'video' | 'map3d' | 'platform2d';

export interface TaskConfig {
  id: GameDevTask;
  label: string;
  icon: string;
  prompt: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
