export interface User {
  id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  message_count: number;
  custom_system_instructions?: string;
}

export interface UserProfileData {
  fullName: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  customSystemInstructions?: string;
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
  generationTimeMs?: number;
  perfStartTime?: number;
  reaction?: 'thumbs_up' | 'thumbs_down' | 'heart' | null;
  isImageGenerationLoading?: boolean;
  imagePrompt?: string;
  isEdit?: boolean;
  imageUrl?: string;
  isError?: boolean;
  canRetry?: boolean;
}

export type SnippetColor = 'amber' | 'emerald' | 'sky' | 'purple' | 'rose';

export type MemoryCategory = 'preference' | 'project' | 'skill' | 'workflow' | 'other';

export interface Memory {
  id?: string;
  user_id: string;
  memory: string;
  category: MemoryCategory;
  importance: number;
  confidence: number;
  source: string;
  created_at: string;
  updated_at: string;
  relevanceScore?: number;
}

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

export interface UserSettings {
  account: {
    displayName: string;
    email: string;
    avatarUrl?: string;
    createdAt?: string;
    uid?: string;
  };
  workspace: {
    name: string;
    autosave: boolean;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    defaultExportFormat: 'json' | 'markdown' | 'pdf';
  };
  premium: {
    plan: 'free' | 'pro';
    status: 'active' | 'free';
    credits: number;
  };
  personalization: {
    aiStyle: 'concise' | 'balanced' | 'detailed' | 'coding';
    language: 'english' | 'hindi' | 'hinglish';
    responseLength: 'compact' | 'normal' | 'comprehensive';
    customInstructions: string;
    enableEmoji: boolean;
    codeFirst: boolean;
  };
  memory: {
    enabled: boolean;
    autoExtract: boolean;
  };
  plugins: {
    webGrounding: boolean;
    codeSandbox: boolean;
    documentVision: boolean;
    imageStudio: boolean;
    minecraftEngine: boolean;
  };
  codex: {
    defaultLanguage: string;
    autoRunCode: boolean;
    showLineNumbers: boolean;
    fontSize: number;
    tabSize: number;
  };
  general: {
    theme: 'pure-black' | 'liquid-oled' | 'high-contrast';
    soundEnabled: boolean;
    enterSendsMessage: boolean;
    fontSize: 'sm' | 'base' | 'lg';
    reduceMotion: boolean;
  };
  usage: {
    totalMessages: number;
    flashMessages: number;
    proMessages: number;
    imagesGenerated: number;
    storageUsedBytes: number;
  };
  notifications: {
    enabled: boolean;
    chatDone: boolean;
    securityAlerts: boolean;
    soundAlerts: boolean;
  };
  voice: {
    voiceName: string;
    speechRate: number;
    autoSpeakResponse: boolean;
    voiceInputEnabled: boolean;
  };
  safety: {
    filterLevel: 'standard' | 'strict';
    safeSearch: boolean;
    promptInjectionShield: boolean;
  };
}

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'audio' | 'code' | 'file';
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'paused' | 'error';
  previewUrl?: string;
  data?: string;
  error?: string;
}

export interface DynamicWidgetData {
  type: 'options' | 'action_buttons' | 'progress' | 'table' | 'palette' | 'card';
  title?: string;
  description?: string;
  options?: Array<{ label: string; value: string; description?: string; action?: string }>;
  progressPercent?: number;
  progressStep?: string;
  steps?: Array<{ label: string; status: 'completed' | 'current' | 'pending' }>;
  headers?: string[];
  rows?: Array<Array<string | number>>;
  colors?: Array<{ name: string; hex: string; role?: string }>;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

