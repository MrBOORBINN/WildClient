export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  message_count: number;
}

export interface Session {
  id: number;
  title: string;
  created_at: string;
  user_id: number;
}

export interface Attachment {
  type: 'image' | 'document';
  data: string;
  mimeType?: string;
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
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
