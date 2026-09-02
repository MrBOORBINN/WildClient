import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Plus, 
  Image as ImageIcon, 
  Music, 
  Layout, 
  Search, 
  BookOpen, 
  SlidersHorizontal, 
  Mic, 
  Square,
  Sparkles, 
  X, 
  ChevronRight,
  Zap,
  Brain,
  Star,
  Check,
  Send,
  User,
  Bot,
  Trash2,
  Settings,
  LogOut,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Camera,
  FolderOpen,
  Cloud,
  Calendar as CalendarIcon,
  PenTool,
  GraduationCap,
  AudioLines,
  HelpCircle,
  Wind,
  Coffee,
  Waves as WavesIcon,
  Trees,
  Key,
  CloudRain,
  Volume2,
  Paperclip,
  ArrowUp,
  FileText,
  Copy,
  Youtube,
  Twitter,
  Instagram,
  Chrome,
  Wand2,
  MonitorPlay,
  ThumbsUp,
  ThumbsDown,
  Heart
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { getChatResponseStream, ModelType, generateImage, generateMusic, generateAudio, transcribeAudio, summarizeContent, Attachment } from './services/geminiService';
import { collection, doc, setDoc, getDoc, getDocs, getDocFromServer, query, where, orderBy, deleteDoc, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { googleSignInWithToken, setCachedAccessToken } from './services/authService';
import { fetchUpcomingEvents } from './services/calendarService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Removed throw to prevent app crashes from background listeners
}

// CRITICAL CONSTRAINT: Test Firestore connection at startup
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testFirestoreConnection();

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  reaction?: 'thumbs_up' | 'thumbs_down' | 'heart' | null;
}

// --- Components ---

const ModelSelector = ({ 
  currentModel, 
  onSelect, 
  isOpen, 
  onToggle 
}: { 
  currentModel: ModelType; 
  onSelect: (m: ModelType) => void; 
  isOpen: boolean; 
  onToggle: () => void;
}) => (
  <div className="relative">
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium">
      <span className="text-[#e3e3e3]">WILDCLEINT</span>
    </div>
  </div>
);

const DriveModal = ({ 
  isOpen, 
  onClose, 
  files, 
  isConnected, 
  onConnect, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  files: any[]; 
  isConnected: boolean; 
  onConnect: () => void;
  onSelect: (file: any) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-card p-6 rounded-[24px] border border-white/10 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cloud size={20} className="text-[#4285f4]" />
              Google Drive
            </h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></motion.button>
          </div>
          
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Cloud size={32} className="text-[#4285f4]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">Connect Google Drive</h3>
                <p className="text-sm text-[#8e918f]">Access your files directly from WILDSTAR</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                onClick={onConnect}
                className="px-6 py-2 bg-[#4285f4] hover:bg-[#4285f4]/80 rounded-full font-bold transition-colors"
              >
                Connect Now
              </motion.button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {(files?.length || 0) === 0 ? (
                <div className="text-center py-12 text-[#8e918f]">No files found in your Drive</div>
              ) : (
                files.map((file, idx) => (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    key={file.id ? `app-file-${file.id}` : `app-file-idx-${idx}`}
                    onClick={() => onSelect(file)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#4285f4]/20 transition-colors">
                      <FolderOpen size={18} className="text-[#4285f4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-[10px] text-[#8e918f]">{file.mimeType}</div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const CalendarModal = ({ 
  isOpen, 
  onClose, 
  events, 
  isConnected, 
  onConnect,
  onSelect
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  events: any[]; 
  isConnected: boolean; 
  onConnect: () => void;
  onSelect: (event: any) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-card p-6 rounded-[24px] border border-white/10 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#34a853]" />
              Google Calendar
            </h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></motion.button>
          </div>
          
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <CalendarIcon size={32} className="text-[#34a853]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">Connect Google Calendar</h3>
                <p className="text-sm text-[#8e918f]">View and manage your upcoming events</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                onClick={onConnect}
                className="px-6 py-2 bg-[#4285f4] hover:bg-[#4285f4]/80 rounded-full font-bold transition-colors flex items-center gap-2"
              >
                Sign in with Google
              </motion.button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-12 text-[#8e918f]">No upcoming events found</div>
              ) : (
                events.map((event, idx) => {
                  const startTime = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
                  const endTime = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date);
                  const isAllDay = !event.start.dateTime;
                  
                  return (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                      key={event.id ? `app-event-${event.id}` : `app-event-idx-${idx}`}
                      onClick={() => onSelect(event)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#34a853]/20 transition-colors">
                        <CalendarIcon size={18} className="text-[#34a853]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{event.summary || 'Untitled Event'}</div>
                        <div className="text-[10px] text-[#8e918f]">
                          {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} 
                          {!isAllDay && ` • ${startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Sidebar = ({ 
  isOpen,
  activeShortcut,
  onClose, 
  sessions, 
  currentSessionId, 
  onSwitchSession, 
  onNewChat,
  onDeleteSession,
  onOpenProfile,
  onOpenBackground,
  onOpenHelp,
  onOpenDrive,
  onOpenCalendar,
  onOpenVoiceSettings,
  onAction,
  user
}: { 
  isOpen: boolean;
  activeShortcut?: string | null;
  onClose: () => void; 
  sessions: any[]; 
  currentSessionId: string | null; 
  onSwitchSession: (id: string, closeSidebar?: boolean) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenProfile: () => void;
  onOpenBackground: () => void;
  onOpenHelp: () => void;
  onOpenDrive: () => void;
  onOpenCalendar: () => void;
  onOpenVoiceSettings: () => void;
  onAction: (action: string) => void;
  user: any;
}) => (
  <motion.div 
    initial={false}
    animate={{ x: isOpen ? 0 : -260 }}
    role="navigation"
    aria-label="Sidebar Navigation"
    aria-hidden={!isOpen}
    className={cn(
      "fixed lg:relative inset-y-0 left-0 w-[260px] bg-[#171717] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
      !isOpen && "lg:w-0 lg:opacity-0 lg:pointer-events-none"
    )}
  >
    <div className="p-3 flex flex-col h-full">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
        onClick={onNewChat}
        aria-label="New chat"
        className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium mb-4"
      >
        <Plus size={16} />
        <span>New chat</span>
      </motion.button>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        <div className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
          <span>Recent</span>
        </div>
            {sessions?.map((session, sIdx) => (
              <div 
                key={session.id ? `app-session-${session.id}` : `app-session-idx-${sIdx}`}
                role="button"
                tabIndex={0}
                aria-label={`Switch to chat ${session.title || 'New Conversation'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSwitchSession(session.id);
                  }
                }}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-sm",
                  currentSessionId === session.id 
                    ? (activeShortcut === 'prev-chat' || activeShortcut === 'next-chat') 
                      ? "bg-white/20 text-white ring-1 ring-[#4285f4]/50 shadow-[0_0_15px_rgba(66,133,244,0.3)] scale-[1.02]" 
                      : "bg-white/10 text-white" 
                    : "text-[#c4c7c5] hover:bg-white/5"
                )}
                onClick={() => onSwitchSession(session.id)}
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <Bot size={14} className={cn(currentSessionId === session.id ? "text-[#4285f4]" : "text-[#8e918f]")} />
                  <span className="truncate">{session.title || 'New Conversation'}</span>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  aria-label={`Delete chat ${session.title || 'New Conversation'}`}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all focus:opacity-100"
                >
                  <Trash2 size={12} />
                </motion.button>
              </div>
            ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
          onClick={onOpenBackground}
          aria-label="Background Settings"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <ImageIcon size={16} aria-hidden="true" />
          <span>Background</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
          onClick={onOpenHelp}
          aria-label="Help and FAQ"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <HelpCircle size={16} aria-hidden="true" />
          <span>Help & FAQ</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
          onClick={onOpenProfile}
          aria-label="Profile and Settings"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
            <div aria-hidden="true" className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-[10px] font-bold">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="truncate">{user?.full_name || user?.email || 'User'}</span>
          <Settings size={14} className="ml-auto opacity-50" aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (type: string, content: string) => void;
}) => {
  const [type, setType] = useState('Bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md glass-card p-6 md:p-8 rounded-[24px] md:rounded-[32px] relative"
        >
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 hover:bg-white/10 rounded-full">
            <X size={24} className="md:w-6 md:h-6" />
          </motion.button>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 pr-8">Feedback</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#8e918f] ml-1">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="glass-input w-full bg-[#1e1e1f]"
              >
                <option value="Bug">Bug Report</option>
                <option value="Feature">Feature Request</option>
                <option value="Feedback">General Feedback</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#8e918f] ml-1">Message</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="glass-input w-full min-h-[120px] resize-none"
                placeholder="Tell us what's on your mind..."
              />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={async () => {
                if (!content.trim()) return;
                setIsSubmitting(true);
                await onSubmit(type, content);
                setIsSubmitting(false);
                setContent('');
                onClose();
              }}
              disabled={isSubmitting || !content.trim()}
              className="w-full py-4 bg-[#4285f4] text-white font-bold rounded-2xl hover:bg-[#4285f4]/80 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Submit Feedback'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const LiquidBackground = ({ imageUrl }: { imageUrl?: string | null }) => (
  <div className="liquid-bg">
    {imageUrl ? (
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    ) : (
      <>
        <div className="liquid-gradient" />
        <div className="fluid-lines">
          {[...Array(8)].map((_, i) => (
            <div 
              key={`fluid-line-${i}`} 
              className="fluid-line" 
              style={{ 
                '--duration': `${Math.random() * 10 + 10}s`,
                '--y-start': `${Math.random() * 100}%`,
                '--y-end': `${Math.random() * 100}%`,
                '--opacity': Math.random() * 0.5 + 0.1,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              } as any} 
            />
          ))}
        </div>
      </>
    )}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
  </div>
);

const BackgroundSettingsModal = ({ 
  isOpen, 
  onClose, 
  currentBackground, 
  onSelect, 
  gallery 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentBackground: string | null; 
  onSelect: (url: string | null) => void;
  gallery: { name: string; url: string; }[];
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#1e1f20] rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Background Settings</h2>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </motion.button>
              </div>

              <div className="space-y-8">
                {/* Custom Upload */}
                <div>
                  <h3 className="text-sm font-medium text-[#8e918f] uppercase tracking-wider mb-4">Custom Background</h3>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                      <Camera size={24} className="text-[#4285f4]" />
                    </div>
                    <span className="text-sm text-[#8e918f]">Upload custom image</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <h3 className="text-sm font-medium text-[#8e918f] uppercase tracking-wider mb-4">Curated Gallery</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => onSelect(null)}
                      className={cn(
                        "relative aspect-video rounded-xl overflow-hidden border-2 transition-all",
                        currentBackground === null ? "border-[#4285f4]" : "border-transparent hover:border-white/20"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#131314] to-[#1e1f20] flex items-center justify-center">
                        <span className="text-xs font-medium">Default (Liquid)</span>
                      </div>
                    </motion.button>
                    {gallery.map((bg, bIdx) => (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        key={`app-gallery-bg-${bg.name || bIdx}-${bIdx}`}
                        onClick={() => onSelect(bg.url)}
                        className={cn(
                          "relative aspect-video rounded-xl overflow-hidden border-2 transition-all group",
                          currentBackground === bg.url ? "border-[#4285f4]" : "border-transparent hover:border-white/20"
                        )}
                      >
                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-[10px] font-medium bg-black/60 backdrop-blur-md px-2 py-1 rounded-md block truncate">
                            {bg.name}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const creatorVoices = [
  { id: 'creator_doorbin', name: 'Doorbin (Hindi Roast)', lang: 'hi-IN', pitch: 1.5, rate: 1.2 },
  { id: 'hindi_child_boy', name: 'Aarav (Child Boy) - Hindi', lang: 'hi-IN', pitch: 1.6, rate: 1.1, ttsOnly: true },
  { id: 'hindi_young_male', name: 'Kabir (Young Male) - Hindi', lang: 'hi-IN', pitch: 1.0, rate: 1.0, ttsOnly: true },
  { id: 'hindi_deep_male', name: 'Vikram (Deep Male) - Hindi', lang: 'hi-IN', pitch: 0.5, rate: 0.9, ttsOnly: true },
  { id: 'hindi_young_female', name: 'Ananya (Young Female) - Hindi', lang: 'hi-IN', pitch: 1.3, rate: 1.05, ttsOnly: true },
  { id: 'hindi_mature_female', name: 'Meera (Mature Female) - Hindi', lang: 'hi-IN', pitch: 0.8, rate: 0.95, ttsOnly: true }
];

const VoiceSettingsModal = ({ 
  isOpen, 
  onClose, 
  selectedVoice, 
  setSelectedVoice, 
  voiceVolume, 
  setVoiceVolume, 
  voiceDelay, 
  setVoiceDelay,
  voiceSpeed,
  setVoiceSpeed,
  voicePitch,
  setVoicePitch,
  voiceTemperature,
  setVoiceTemperature,
  availableVoices
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedVoice: string; 
  setSelectedVoice: (v: string) => void;
  voiceVolume: number;
  setVoiceVolume: (v: number) => void;
  voiceDelay: number;
  setVoiceDelay: (v: number) => void;
  voiceSpeed: number;
  setVoiceSpeed: (v: number) => void;
  voicePitch: number;
  setVoicePitch: (v: number) => void;
  voiceTemperature: number;
  setVoiceTemperature: (v: number) => void;
  availableVoices: SpeechSynthesisVoice[];
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass-card p-6 rounded-[24px] border border-white/10 max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AudioLines size={20} className="text-[#4285f4]" />
              Voice Settings
            </h2>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></motion.button>
          </div>
          <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Creator Voices (Natural)</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {creatorVoices.filter(v => !(v as any).ttsOnly).map((voice, vIdx) => (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    key={`app-creator-voice-${voice.id || vIdx}`}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setVoicePitch(voice.pitch);
                      setVoiceSpeed(voice.rate);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                      selectedVoice === voice.id 
                        ? "bg-[#4285f4]/10 border-[#4285f4] text-white" 
                        : "bg-white/5 border-transparent hover:bg-white/10 text-[#c4c7c5]"
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={cn(
                        "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                        selectedVoice === voice.id ? "bg-[#4285f4] text-white" : "bg-white/10 text-[#8e918f]"
                      )}>
                        {voice.name[0]}
                      </div>
                      <span className="font-medium truncate text-sm">{voice.name}</span>
                    </div>
                    {selectedVoice === voice.id && <Check size={16} className="text-[#4285f4] shrink-0" />}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Voice Speed</label>
                <span className="text-xs text-[#8e918f]">{voiceSpeed}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full accent-[#4285f4] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Voice Volume</label>
                <span className="text-xs text-[#8e918f]">{Math.round(voiceVolume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                className="w-full accent-[#4285f4] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Voice Pitch</label>
                <span className="text-xs text-[#8e918f]">{voicePitch}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                className="w-full accent-[#4285f4] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Voice Temperature</label>
                <span className="text-xs text-[#8e918f]">{voiceTemperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1" 
                value={voiceTemperature}
                onChange={(e) => setVoiceTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#4285f4] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">Response Delay</label>
                <span className="text-xs text-[#8e918f]">{voiceDelay}s</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                step="0.5" 
                value={voiceDelay}
                onChange={(e) => setVoiceDelay(parseFloat(e.target.value))}
                className="w-full accent-[#4285f4] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const faqs = [
    {
      question: "What is WILDSTAR?",
      answer: "WILDSTAR is your advanced AI companion designed for creativity, research, and productivity. It combines powerful language models with specialized tools for image generation, music composition, and deep research."
    },
    {
      question: "How do I create an image?",
      answer: "Click the 'Create image' button in the sidebar or type a prompt like 'Generate an image of...' in the chat. You can specify styles, colors, and details to get the perfect visual."
    },
    {
      question: "What is the Canvas?",
      answer: "The Canvas is a dedicated space for visual brainstorming and layout design. It allows you to organize ideas, images, and text in a free-form environment."
    },
    {
      question: "How does Deep Research work?",
      answer: "Deep Research uses advanced search grounding to provide comprehensive, fact-checked answers to complex queries. It's perfect for academic work, market analysis, or learning new topics in depth."
    },
    {
      question: "How do I change the background?",
      answer: "Use the 'Background' button in the sidebar to choose from our curated gallery or upload your own custom image. You can also toggle the default liquid animation."
    },
    {
      question: "What are Soundscapes?",
      answer: "Soundscapes are ambient background sounds (like Rain or Forest) designed to help you focus. You can enable them in the sidebar and adjust the volume to your preference."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#1e1f20] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#9b72cb]/20 rounded-xl">
                  <HelpCircle size={24} className="text-[#9b72cb]" />
                </div>
                <h2 className="text-2xl font-bold">Help & FAQ</h2>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {faqs.map((faq, index) => (
                <div key={`faq-${index}`} className="space-y-2">
                  <h3 className="text-lg font-semibold text-white flex items-start gap-3">
                    <span className="text-[#9b72cb] font-mono">0{index + 1}.</span>
                    {faq.question}
                  </h3>
                  <p className="text-[#8e918f] leading-relaxed pl-10">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 text-center shrink-0">
              <p className="text-sm text-[#8e918f]">
                Need more help? Contact us at <span className="text-[#4285f4]">infbuisness01@gmail.com</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appIcon, setAppIcon] = useState<string | null>(null);

  useEffect(() => {
    // Image generation is disabled, so we use a fallback icon
    setAppIcon('https://picsum.photos/seed/wildstar/200/200');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            createdAt: serverTimestamp(),
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userCredential.user.uid}`);
        }
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await googleSignInWithToken();
      if (!result) throw new Error('Sign in failed');
      
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email || '',
          fullName: result.user.displayName || '',
          avatarUrl: result.user.photoURL || '',
          createdAt: serverTimestamp(),
        }, { merge: true });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
      }
      onAuthSuccess(result.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#131314]">
      <LiquidBackground imageUrl={null} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 rounded-[32px] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center mb-4 shadow-2xl overflow-hidden border border-white/10">
            {appIcon ? (
              <img src={appIcon} alt="WILDSTAR Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Sparkles size={40} className="text-white animate-pulse" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">WILDSTAR</h1>
          <p className="text-sm text-[#8e918f] mt-2">Sign in to continue to WILDSTAR</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5] ml-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-12"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#c4c7c5] ml-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-12"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-xl">
              {error}
            </div>
          )}

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full glass-button bg-[#4285f4] hover:bg-[#4285f4]/80 text-white flex items-center justify-center gap-2 py-4 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full glass-button bg-white/10 text-white hover:bg-white/20 flex items-center justify-center gap-2 py-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>
        </div>

        <div className="mt-8 text-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#4285f4] hover:underline"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);
  const [modelType, setModelType] = useState<ModelType>('fast');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [appBackground, setAppBackground] = useState<string | null>(null);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isVoiceSettingsModalOpen, setIsVoiceSettingsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(false);
  const [activeSoundscape, setActiveSoundscape] = useState('Rain');
  const [ambientVolume, setAmbientVolume] = useState(0.5); // 50%
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const curatedBackgrounds = [
    { name: 'Cyberpunk City', url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1920' },
    { name: 'Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1920' },
    { name: 'Minimal Mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920' },
    { name: 'Abstract Flow', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920' },
    { name: 'Deep Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1920' },
  ];

  const soundscapes = [
    { name: 'Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-rain-on-the-window-loop-2451.mp3' },
    { name: 'Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
    { name: 'White Noise', url: 'https://assets.mixkit.co/sfx/preview/mixkit-white-noise-loop-2559.mp3' },
    { name: 'Deep Space', url: 'https://assets.mixkit.co/sfx/preview/mixkit-deep-space-ambience-944.mp3' },
  ];

  const playClickSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-selection-click-1109.mp3');
      audio.volume = 0.3;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('Click sound playback prevented:', e));
      }
    } catch (err) {
      console.error('Click sound error:', err);
    }
  };

  useEffect(() => {
    const handleAmbient = async () => {
      if (isAmbientEnabled) {
        const sound = soundscapes.find(s => s.name === activeSoundscape);
        if (sound) {
          if (!ambientAudioRef.current) {
            ambientAudioRef.current = new Audio(sound.url);
            ambientAudioRef.current.loop = true;
          } else if (ambientAudioRef.current.src !== sound.url) {
            ambientAudioRef.current.pause();
            ambientAudioRef.current.src = sound.url;
          }
          
          ambientAudioRef.current.volume = ambientVolume;
          try {
            await ambientAudioRef.current.play();
          } catch (e) {
            console.warn('Ambient sound playback prevented:', e);
          }
        }
      } else {
        if (ambientAudioRef.current) {
          ambientAudioRef.current.pause();
        }
      }
    };

    handleAmbient();
  }, [isAmbientEnabled, activeSoundscape, ambientVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isTextToVoiceModalOpen, setIsTextToVoiceModalOpen] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [ttsVoice, setTtsVoice] = useState<string>('creator_doorbin');
  const [ttsCustomPitch, setTtsCustomPitch] = useState<number>(1.0);
  const [ttsCustomTone, setTtsCustomTone] = useState<number>(0); // -1 (Dark) to 1 (Light)
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Lo-fi');
  const [selectedMood, setSelectedMood] = useState('Relaxing');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);


  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"1:1" | "16:9" | "4:3" | "9:16">('1:1');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
  const [voiceVolume, setVoiceVolume] = useState(0.5);
  const [voiceDelay, setVoiceDelay] = useState(0); // in seconds
  const [voiceSpeed, setVoiceSpeed] = useState(1); // 1x normal speed
  const [voicePitch, setVoicePitch] = useState(1); // 1x normal pitch
  const [voiceTemperature, setVoiceTemperature] = useState(1); // Voice temperature
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    avatar: '',
    avatarUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const activeName = userData?.fullName || user.displayName || '';
      const activeEmail = userData?.email || user.email || '';
      const activeAvatarUrl = userData?.avatarUrl || (user.photoURL && user.photoURL.startsWith('http') ? user.photoURL : '');
      const activeInitial = (activeName || activeEmail || 'U')[0]?.toUpperCase() || 'U';

      setProfileData({
        fullName: activeName,
        email: activeEmail,
        avatar: activeInitial,
        avatarUrl: activeAvatarUrl
      });
    }
  }, [user, userData]);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    const userDocPath = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email || '',
            credits: 150,
            lastRefill: serverTimestamp(),
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (err: any) {
          console.error("Failed to auto-create user Firestore document:", err);
        }
        return;
      }

      if (docSnap.metadata.hasPendingWrites) return;
      const data = docSnap.data();
      
      // Check for credit refill
      if (data.lastRefill) {
        const lastRefillDate = data.lastRefill?.toDate ? data.lastRefill.toDate() : new Date(data.lastRefill || Date.now());
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - lastRefillDate.getTime()) / 36e5;
        
        if (diffHours >= 24) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email || '',
            credits: 150,
            lastRefill: serverTimestamp()
          }, { merge: true });
          return; // onSnapshot will trigger again
        }
      } else {
        // Initialize credits if they don't exist
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || '',
          credits: 150,
          lastRefill: serverTimestamp()
        }, { merge: true });
        return;
      }

      setUserData(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userDocPath);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'sessions'), where('userId', '==', user.uid), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(sessionsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions');
    });
    return () => unsubscribe();
  }, [user]);

  const handleConnectDrive = async () => {
    // Drive integration removed
  };

  const fetchDriveFiles = async () => {
    // Drive integration removed
  };

  const handleConnectCalendar = async () => {
    try {
      const result = await googleSignInWithToken();
      if (result) {
        setIsCalendarConnected(true);
        fetchCalendarEvents();
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Calendar connect failed', err);
      }
      // fallback
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const events = await fetchUpcomingEvents();
      setCalendarEvents(events);
    } catch (err) {
      console.error('Failed to fetch calendar events', err);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSwitchSession = async (sessionId: string, closeSidebar = true) => {
    setCurrentSessionId(sessionId);
    if (closeSidebar && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    try {
      const q = query(collection(db, `sessions/${sessionId}/messages`), orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(messagesData);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: Cmd/Ctrl + B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
        setActiveShortcut('toggle-sidebar');
        setTimeout(() => setActiveShortcut(null), 300);
      }

      // Navigate chats: Alt + Up / Alt + Down
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        
        if (sessions.length === 0) return;
        
        const currentIndex = sessions.findIndex(s => s.id === currentSessionId);
        if (e.key === 'ArrowUp') {
          // Go to previous (newer) session
          if (currentIndex > 0) {
            handleSwitchSession(sessions[currentIndex - 1].id, false);
            setActiveShortcut('prev-chat');
            setTimeout(() => setActiveShortcut(null), 300);
          } else if (currentIndex === -1 && sessions.length > 0) {
            handleSwitchSession(sessions[sessions.length - 1].id, false);
            setActiveShortcut('prev-chat');
            setTimeout(() => setActiveShortcut(null), 300);
          }
        } else if (e.key === 'ArrowDown') {
          // Go to next (older) session
          if (currentIndex !== -1 && currentIndex < sessions.length - 1) {
            handleSwitchSession(sessions[currentIndex + 1].id, false);
            setActiveShortcut('next-chat');
            setTimeout(() => setActiveShortcut(null), 300);
          } else if (currentIndex !== -1 && currentIndex === sessions.length - 1) {
            handleNewChat();
            setActiveShortcut('next-chat');
            setTimeout(() => setActiveShortcut(null), 300);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, currentSessionId, isSidebarOpen]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleRegenerate = async () => {
    if ((messages?.length || 0) < 2 || isLoading) return;
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;
    
    let sessionId = currentSessionId;
    if (!sessionId) return;
    
    // Remove last assistant message if it's the last one
    if (messages[messages.length - 1].role === 'assistant') {
      try {
        await deleteDoc(doc(db, `sessions/${currentSessionId}/messages`, messages[messages.length - 1].id));
      } catch (err) {
        console.error('Failed to delete message', err);
      }
      setMessages(prev => prev.slice(0, -1));
    }
    
    setIsLoading(true);
    
    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      await setDoc(doc(db, 'sessions', sessionId), { updatedAt: serverTimestamp() }, { merge: true });
      
      let fullContent = '';
      const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const stream = getChatResponseStream(lastUserMessage.content, history, modelType, lastUserMessage.attachments, voiceTemperature);

      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
          );
        }
      }

      await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), { ...assistantMessage, content: fullContent });
      
      if (isVoiceEnabled) {
        playVoiceResponse(fullContent);
      }
    } catch (error: any) {
      console.error('Error in handleRegenerate:', error);
      const errorMessage = error.message || 'Sorry, I encountered an error.';
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, content: `⚠️ **Error:** ${errorMessage}\n\n*Please check your connection and try again.*` } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeChat = async () => {
    if (messages.length === 0) return;
    setIsSummarizing(true);
    try {
      const chatContent = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const summary = await summarizeContent(chatContent);
      
      const summaryMessage: Message = {
        id: 'summary-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: `### 📝 Conversation Summary\n\n${summary}`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error: any) {
      console.error("Summarization Error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarizeMessage = async (content: string) => {
    setIsSummarizing(true);
    try {
      const summary = await summarizeContent(content);
      const summaryMessage: Message = {
        id: 'summary-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: `### 📝 Message Summary\n\n${summary}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error: any) {
      console.error("Summarization Error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleReaction = async (messageId: string, reactionType: 'thumbs_up' | 'thumbs_down' | 'heart') => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const currentReaction = msg.reaction;
    const newReaction = currentReaction === reactionType ? null : reactionType;

    // Update local state instantly for snappy UI feedback
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reaction: newReaction } : m));

    if (currentSessionId && user) {
      const path = `sessions/${currentSessionId}/messages`;
      try {
        await setDoc(
          doc(db, path, messageId),
          { ...msg, reaction: newReaction },
          { merge: true }
        );
      } catch (error: any) {
        console.error('Failed to save message reaction to Firestore', error);
        const errInfo = {
          error: error instanceof Error ? error.message : String(error),
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData?.map(provider => ({
              providerId: provider.providerId,
              email: provider.email,
            })) || []
          },
          operationType: 'write',
          path: `${path}/${messageId}`
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        let type: 'image' | 'document' | 'file' = 'file';
        
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
          type = 'document';
        }
        
        try {
          // Upload base64 data URL to Firebase Storage
          const fileRef = ref(storage, `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`);
          // `base64` is a Data URL, e.g. "data:image/jpeg;base64,/9j/4AA..."
          await uploadString(fileRef, base64, 'data_url');
          const url = await getDownloadURL(fileRef);

          setAttachments(prev => [...prev, {
            type,
            data: url,
            mimeType: file.type,
            name: file.name
          }]);
        } catch (error) {
          console.error("Error uploading file:", error);
          alert("Failed to upload file.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImageToDataUrl = (file: File, maxWidth = 160, maxHeight = 160, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 160, 160, 0.85);
      setProfileData(prev => ({ ...prev, avatarUrl: compressedDataUrl }));

      try {
        if (storage) {
          const fileRef = ref(storage, `avatars/${user?.uid || 'user'}_${Date.now()}.jpg`);
          await uploadString(fileRef, compressedDataUrl, 'data_url');
          const url = await getDownloadURL(fileRef);
          if (url) {
            setProfileData(prev => ({ ...prev, avatarUrl: url }));
          }
        }
      } catch (error) {
        console.warn("Storage upload not available, using compressed avatar data:", error);
      }
    } catch (error) {
      console.error("Error processing avatar:", error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sessions/${sessionId}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const isHttpPhotoUrl = typeof profileData.avatarUrl === 'string' &&
                             profileData.avatarUrl.startsWith('http') &&
                             profileData.avatarUrl.length <= 2048;

      // 1. Save to Firestore users collection
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email || profileData.email || '',
          fullName: profileData.fullName || user.displayName || '',
          avatarUrl: profileData.avatarUrl || '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore profile save warning:', firestoreErr);
      }

      // 2. Safely attempt Firebase Auth updateProfile without passing large data URLs
      try {
        const updatePayload: { displayName?: string; photoURL?: string } = {
          displayName: profileData.fullName || user.displayName || ''
        };
        if (isHttpPhotoUrl) {
          updatePayload.photoURL = profileData.avatarUrl;
        }
        await updateProfile(user, updatePayload);
      } catch (authErr) {
        console.warn('Firebase Auth updateProfile non-critical warning:', authErr);
      }

      // 3. Update local state
      setUser((prev: any) => prev ? ({
        ...prev,
        displayName: profileData.fullName || prev?.displayName,
        photoURL: isHttpPhotoUrl ? profileData.avatarUrl : (prev?.photoURL || '')
      }) : null);

      setUserData((prev: any) => ({
        ...prev,
        fullName: profileData.fullName,
        email: profileData.email || prev?.email,
        avatarUrl: profileData.avatarUrl
      }));

      setIsProfileModalOpen(false);
    } catch (err) {
      console.error('Failed to save profile', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setIsListening(false);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 500) { // Ignore very short/empty recordings
          setIsListening(false);
          return;
        }

        setIsTranscribing(true);
        
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const transcription = await transcribeAudio(base64Audio);
            if (transcription) {
              setInput(prev => prev ? `${prev} ${transcription}` : transcription);
            }
            setIsTranscribing(false);
          };
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          console.error('Transcription failed:', err);
          setIsTranscribing(false);
        }
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const playVoiceResponse = async (text: string) => {
    try {
      // Clean up text for TTS (remove markdown, etc.)
      const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
                           .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
                           .replace(/[*_#`]/g, '') // Remove markdown formatting
                           .trim();
      
      if (!cleanText) return;

      const isGeminiVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(selectedVoice);

      if (isGeminiVoice) {
        const audioUrl = await generateAudio(cleanText, selectedVoice as any, voiceTemperature);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.volume = voiceVolume;
          // We remove audio.playbackRate modification here for Gemini voices because the native Web Audio playback rate
          // heavily distorts the voice making it sound 'dumb' or chipmunk-like.
          
          if (voiceDelay > 0) {
            setTimeout(() => {
              audio.play().catch(e => console.error('Voice playback failed', e));
            }, voiceDelay * 1000);
          } else {
            audio.play().catch(e => console.error('Voice playback failed', e));
          }
        }
      } else {
        // Use Web Speech API
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          const creatorVoice = creatorVoices.find(v => v.id === selectedVoice);
          let voiceToUse = null;

          if (creatorVoice) {
            // Try to find a matching voice by language
            const matchingVoices = availableVoices.filter(v => v.lang.startsWith(creatorVoice.lang));
            if (matchingVoices.length > 0) {
              const localVoice = matchingVoices.find(v => v.localService);
              voiceToUse = localVoice || matchingVoices[0];
            } else {
              // Fallback to any voice
              const localVoice = availableVoices.find(v => v.localService && v.lang.startsWith('en'));
              voiceToUse = localVoice || availableVoices[0];
            }
          } else {
            voiceToUse = availableVoices.find(v => v.voiceURI === selectedVoice);
          }

          if (voiceToUse) {
            utterance.voice = voiceToUse;
          }
          
          utterance.volume = voiceVolume;
          utterance.rate = voiceSpeed;
          utterance.pitch = voicePitch;

          if (voiceDelay > 0) {
            setTimeout(() => {
              window.speechSynthesis.speak(utterance);
            }, voiceDelay * 1000);
          } else {
            window.speechSynthesis.speak(utterance);
          }
        } else {
          console.warn('Speech synthesis not supported in this browser.');
        }
      }
    } catch (err) {
      console.error('Failed to generate voice response', err);
    }
  };

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSessionRef = doc(collection(db, 'sessions'));
      sessionId = newSessionRef.id;
      await setDoc(newSessionRef, {
        userId: user.uid,
        title: text.slice(0, 30) || 'New Conversation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: text,
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Save user message
      await setDoc(doc(db, `sessions/${sessionId}/messages`, userMessage.id), userMessage);
      await setDoc(doc(db, 'sessions', sessionId), { updatedAt: serverTimestamp() }, { merge: true });

      // Check for special generation triggers
      if (text.toLowerCase().includes('generate image') || text.toLowerCase().includes('generate a photo')) {
        const imageUrl = await generateImage(text, selectedAspectRatio, selectedStyle);
        const assistantContent = `I've generated this image for you based on: "${text}"\n\n![Generated Image](${imageUrl})`;
        
        setMessages(prev => 
          prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m)
        );

        await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), { ...assistantMessage, content: assistantContent });
        setIsLoading(false);
        return;
      }

      if (text.toLowerCase().includes('compose') || text.toLowerCase().includes('generate music') || text.toLowerCase().includes('track')) {
        const audioUrl = await generateMusic(text, selectedGenre, selectedMood);
        const assistantContent = `I've composed a ${selectedMood} ${selectedGenre} track for you: [Listen to the track](${audioUrl})\n\n(Note: You can play this audio directly in your browser)`;
        
        setMessages(prev => 
          prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m)
        );

        await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), { ...assistantMessage, content: assistantContent });
        setIsLoading(false);
        return;
      }

      let fullContent = '';
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const stream = getChatResponseStream(text, history, modelType, userMessage.attachments, voiceTemperature);

      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
          );
        }
      }

      // Save assistant message
      await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), { ...assistantMessage, content: fullContent });

      // Play voice response if enabled
      if (isVoiceEnabled) {
        playVoiceResponse(fullContent);
      }

    } catch (error: any) {
      console.error('Error in handleSend:', error);
      const errorMessage = error.message || 'Sorry, I encountered an error.';
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, content: `⚠️ **Error:** ${errorMessage}\n\n*Please check your connection and try again.*` } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (action === 'Create music') {
      setIsMusicModalOpen(true);
    } else if (action === 'Text to Voice') {
      setIsTextToVoiceModalOpen(true);
    } else if (action === 'Create Photos') {
      setIsPhotoModalOpen(true);
    } else if (action === 'Deep Research') {
      handleSend("Start a deep research session on: ");
    } else if (action === 'Canvas') {
      handleSend("Open Canvas for: ");
    } else if (action === 'Guided Learning') {
      handleSend("Start a guided learning session for: ");
    } else if (action === 'NotebookLM') {
      handleSend("Open NotebookLM for: ");
    } else {
      setInput(action);
    }
  };

  const handleFeedbackSubmit = async (type: string, content: string) => {
    if (!user?.uid) {
      console.warn("User must be signed in to submit feedback.");
      return;
    }
    try {
      await addDoc(collection(db, 'feedback'), {
        type,
        content,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      // Show success toast or message
    } catch (err: any) {
      console.error('Failed to submit feedback:', err?.message || String(err));
    }
  };

  if (isAuthChecking) {
    return (
      <div className="h-[100dvh] bg-[#131314] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#4285f4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(u) => { setUser(u); }} />;
  }

  return (
    <div className="h-[100dvh] w-full flex bg-[#131314] text-[#e3e3e3] font-sans relative overflow-hidden">
      <LiquidBackground imageUrl={appBackground} />

      <Sidebar 
        isOpen={isSidebarOpen}
        activeShortcut={activeShortcut}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={handleSwitchSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBackground={() => setIsBackgroundModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenDrive={() => setIsDriveModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenVoiceSettings={() => setIsVoiceSettingsModalOpen(true)}
        onAction={handleAction}
        user={user}
      />

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-full relative z-10">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#131314]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "group relative p-1.5 hover:bg-white/10 rounded-lg transition-all",
                activeShortcut === 'toggle-sidebar' && "bg-white/20 ring-1 ring-white/30 scale-95"
              )}
            >
              <Menu size={18} />
              <div className="absolute top-full left-0 mt-2 whitespace-nowrap bg-[#1e1f20] text-[#c4c7c5] text-[10px] px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity border border-white/10 shadow-xl flex items-center gap-2">
                Toggle Sidebar <kbd className="font-mono text-[#8e918f]">⌘+B</kbd>
              </div>
            </motion.button>
            <ModelSelector 
              currentModel={modelType}
              onSelect={setModelType}
              isOpen={isModelMenuOpen}
              onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
            />
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-[10px] font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {profileData.avatar}
            </motion.button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-0 custom-scrollbar">
          <div className="max-w-3xl mx-auto py-4">
            {(messages?.length || 0) === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center space-y-2">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#ff4e00] via-[#ff0080] to-[#9b72cb] bg-clip-text text-transparent"
                  >
                    Hi {profileData?.fullName?.split(' ')[0] || 'there'},
                  </motion.h2>
                  <p className="text-[#8e918f] text-sm">Where should we start today?</p>
                  <p className="text-[#4285f4] text-xs sm:text-sm font-medium mt-2 text-center text-balance">नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ? (Hindi supported)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
                  {[
                    { label: 'Create Photos', icon: <ImageIcon size={18} className="text-[#4285f4]" />, color: 'bg-blue-500/10', action: () => handleAction('Create Photos') },
                    { label: 'Summarize Chat', icon: <FileText size={18} className="text-[#ea4335]" />, color: 'bg-red-500/10', action: handleSummarizeChat },
                    { label: 'Write anything', icon: <Layout size={18} className="text-[#fbbc04]" />, color: 'bg-yellow-500/10', action: () => handleAction('Write anything') },
                    { label: 'Text to Voice', icon: <AudioLines size={18} className="text-[#34a853]" />, color: 'bg-green-500/10', action: () => handleAction('Text to Voice') }
                  ].map((action, aIdx) => (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                      key={`app-chat-action-${action.label || aIdx}`}
                      onClick={action.action}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
                    >
                      <div className={cn("p-2 rounded-lg", action.color)}>
                        {action.icon}
                      </div>
                      <span className="text-xs font-medium text-[#c4c7c5] group-hover:text-white">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, mIdx) => (
                  <motion.div 
                    key={msg.id ? `app-msg-${msg.id}` : `app-msg-idx-${mIdx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] rounded-2xl p-3 text-sm group relative",
                      msg.role === 'user' ? "bg-[#2f2f2f] text-white" : "bg-transparent text-[#e3e3e3]"
                    )}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex gap-2 mb-2 overflow-x-auto">
                          {msg.attachments.map((att: any, idx: number) => (
                            <img key={`app-msg-att-${msg.id || mIdx}-${att.id || idx}`} src={att.data || undefined} alt="attachment" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                          ))}
                        </div>
                      )}
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                        <Markdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ node, ...props }) => props.src ? <img {...props} referrerPolicy="no-referrer" className="rounded-lg max-w-full h-auto my-2" /> : null
                          }}
                        >
                          {msg.content}
                        </Markdown>
                      </div>
                      
                      {/* Message Actions */}
                      <div className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                        msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                      )}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedId(msg.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? <Check size={14} className="text-[#34a853]" /> : <Copy size={14} />}
                        </motion.button>
                        {msg.role === 'assistant' && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                            onClick={() => playVoiceResponse(msg.content)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                            title="Read aloud"
                          >
                            <Volume2 size={14} />
                          </motion.button>
                        )}
                        {msg.role === 'assistant' && messages[messages.length - 1].id === msg.id && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                            onClick={handleRegenerate}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                            title="Regenerate response"
                          >
                            <Zap size={14} />
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                          onClick={() => handleSummarizeMessage(msg.content)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                          title="Summarize this message"
                        >
                          <FileText size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex gap-1 items-center h-6">
                      <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 pb-8 sm:pb-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto p-2 bg-[#1e1e1f]/50 rounded-xl border border-white/5 backdrop-blur-sm">
                {attachments.map((att: any, idx: number) => (
                  <div key={`input-att-${idx}-${att.name || ''}`} className="relative group shrink-0">
                    <img src={att.data || undefined} alt="attachment" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative glass-card rounded-2xl p-1.5 flex items-center gap-2 shadow-xl border border-white/10">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*,.pdf,.txt"
              />
              
              <div className="relative">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#8e918f]"
                >
                  <Plus size={18} />
                </motion.button>
                <AnimatePresence>
                  {isPlusMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 mb-2 w-48 glass-card p-2 rounded-xl border border-white/10 z-50 shadow-2xl"
                      >
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { handleSummarizeChat(); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                          <FileText size={14} className="text-[#4285f4]" />
                          <span>Summarize Chat</span>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                          <Paperclip size={14} className="text-[#8e918f]" />
                          <span>Upload file</span>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setIsFeedbackModalOpen(true); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors border-t border-white/5 mt-1 pt-2">
                          <HelpCircle size={14} className="text-[#ff4e00]" />
                          <span>Send Feedback</span>
                        </motion.button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message WILDSTAR..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#e3e3e3] placeholder:text-[#8e918f] py-2"
              />

              <div className="flex items-center gap-1">
                <div className="relative">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#8e918f]"
                  >
                    <SlidersHorizontal size={18} />
                  </motion.button>
                  <AnimatePresence>
                    {isToolsMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsToolsMenuOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute bottom-full right-0 mb-2 w-48 glass-card p-2 rounded-xl border border-white/10 z-50 shadow-2xl"
                        >
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { handleAction('Create Photos'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                            <ImageIcon size={14} className="text-[#4285f4]" />
                            <span>Create Photos</span>
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { handleAction('Deep Research'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                            <Search size={14} className="text-[#4285f4]" />
                            <span>Deep Research</span>
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { handleAction('NotebookLM'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors">
                            <BookOpen size={14} className="text-[#9b72cb]" />
                            <span>NotebookLM</span>
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { handleSummarizeChat(); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors border-t border-white/5 mt-1 pt-2">
                            <FileText size={14} className="text-[#ff4e00]" />
                            <span>Summarize Chat</span>
                          </motion.button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={cn(
                      "p-2 rounded-full transition-colors relative",
                      isVoiceEnabled ? "text-[#4285f4] bg-blue-500/10" : "text-[#8e918f] hover:bg-white/5"
                    )}
                  >
                    <Mic size={18} />
                    {isVoiceEnabled && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#4285f4] rounded-full animate-ping" />
                    )}
                  </motion.button>
                  <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-[#1e1e1f] text-white text-[10px] py-1 px-2 rounded border border-white/10 whitespace-nowrap">
                      {isVoiceEnabled ? "Voice Response ON" : "Click to enable Voice Response"}
                    </div>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                  onClick={() => handleSend()}
                  disabled={!input.trim() && (attachments?.length || 0) === 0}
                  className="p-2 bg-[#4285f4] text-white rounded-full shadow-lg hover:bg-[#4285f4]/80 transition-colors disabled:opacity-50"
                >
                  <ArrowUp size={18} />
                </motion.button>
              </div>
            </div>
            <p className="text-[10px] text-center text-[#8e918f] mt-2">
              WILDSTAR can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>

        <FeedbackModal 
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />

      {/* Modals */}
      <BackgroundSettingsModal 
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        currentBackground={appBackground}
        onSelect={(url) => {
          setAppBackground(url);
          setIsBackgroundModalOpen(false);
        }}
        gallery={curatedBackgrounds}
      />

      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <DriveModal 
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        files={driveFiles}
        isConnected={isDriveConnected}
        onConnect={handleConnectDrive}
        onSelect={(file) => {
          setAttachments(prev => [...prev, {
            type: 'file',
            data: file.webViewLink,
            mimeType: file.mimeType,
            name: file.name
          }]);
          setIsDriveModalOpen(false);
        }}
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        events={calendarEvents}
        isConnected={isCalendarConnected}
        onConnect={handleConnectCalendar}
        onSelect={(event) => {
          const startTime = event.start.dateTime || event.start.date;
          const endTime = event.end.dateTime || event.end.date;
          const details = `Event: ${event.summary}\nTime: ${startTime} to ${endTime}\nLink: ${event.htmlLink}`;
          setInput(prev => prev ? `${prev}\n\n${details}` : details);
          setIsCalendarModalOpen(false);
        }}
      />

      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-card p-8 rounded-[32px] relative"
            >
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
              </motion.button>
              <h2 className="text-3xl font-bold mb-8">Profile Settings</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-3xl font-bold shadow-2xl overflow-hidden">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileData.avatar
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-sm text-[#ff4e00] font-bold hover:underline"
                  >
                    Change Avatar
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#8e918f] ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="glass-input w-full"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#8e918f] ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="glass-input w-full"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                  onClick={handleSaveProfile}
                  className="w-full glass-button bg-gradient-to-r from-[#ff4e00] to-[#ff0080] text-white py-4 font-bold mt-4"
                >
                  Save Changes
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                  onClick={handleLogout}
                  className="w-full glass-button bg-red-500/20 hover:bg-red-500/30 text-red-400 py-4 font-bold mt-2 flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isMusicModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#34a853] to-transparent opacity-50" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#34a853]/10 opacity-20 rounded-full" />
              
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsMusicModalOpen(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-white/10 rounded-full transition-colors z-10">
                <X size={24} className="md:w-7 md:h-7" />
              </motion.button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-8 pr-8">
                  <div className="p-3 md:p-4 bg-green-500/20 rounded-xl md:rounded-2xl text-[#34a853] shadow-lg shadow-green-500/10 shrink-0">
                    <Music size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Create Music</h2>
                    <p className="text-[#8e918f] text-xs md:text-sm">AI-powered original track generation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#8e918f] uppercase tracking-widest">Genre</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Lo-fi', 'Ambient', 'Cinematic', 'Techno', 'Jazz', 'Rock'].map((g, gIdx) => (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                            key={`app-music-genre-${g}-${gIdx}`} 
                            onClick={() => setSelectedGenre(g)}
                            className={cn(
                              "p-3 rounded-xl border text-sm font-medium transition-all",
                              selectedGenre === g 
                                ? "bg-[#34a853] border-[#34a853] text-white shadow-lg shadow-green-500/20" 
                                : "bg-white/5 hover:bg-white/10 border-white/5 text-[#e3e3e3]"
                            )}
                          >
                            {g}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#8e918f] uppercase tracking-widest">Mood</label>
                      <div className="relative">
                        <select
                          value={selectedMood}
                          onChange={(e) => setSelectedMood(e.target.value)}
                          className="glass-input w-full p-3 rounded-xl border border-white/10 bg-black/20 text-[#e3e3e3] focus:ring-2 focus:ring-[#34a853]/50 transition-all appearance-none"
                        >
                          {['Relaxing', 'Energetic', 'Dark', 'Happy', 'Epic', 'Melancholic', 'Romantic', 'Scary', 'Upbeat', 'Chill', 'Dreamy', 'Aggressive'].map((m, mIdx) => (
                            <option key={`app-music-mood-${m}-${mIdx}`} value={m} className="bg-gray-900 text-white">
                              {m}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#8e918f]">
                          <ChevronRight size={16} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-[#8e918f] uppercase tracking-widest">Description</label>
                      <textarea 
                        value={musicPrompt}
                        onChange={(e) => setMusicPrompt(e.target.value)}
                        placeholder="Describe the music you want to create..."
                        className="glass-input w-full h-40 resize-none p-4 focus:ring-2 focus:ring-[#34a853]/50 transition-all"
                      />
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                      onClick={async () => {
                        try {
                          const prompt = musicPrompt || `A ${selectedMood} ${selectedGenre} track`;
                          setIsMusicModalOpen(false);
                          setMusicPrompt('');
                          
                          setIsLoading(true);
                          // Immersive simulation of music generation
                          const audioUrl = await generateAudio(`Generating your original ${selectedMood} ${selectedGenre} track based on: ${prompt}. Please wait a moment.`);
                          if (audioUrl) {
                            const audio = new Audio(audioUrl);
                            audio.play().catch(e => console.error('Music playback failed', e));
                          }
                          
                          // Also send to chat for context
                          handleSend(`Create a ${selectedMood} ${selectedGenre} music track: ${prompt}`);
                        } catch (err: any) {
                          console.error('Music generation error:', err);
                          alert(`Failed to generate music: ${err.message}`);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="w-full glass-button bg-[#34a853] text-white py-5 text-xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Generate Track
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isTextToVoiceModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card p-6 md:p-10 rounded-[24px] md:rounded-[40px] relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff4e00] to-transparent opacity-50" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff4e00]/10 opacity-20 rounded-full" />
              
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsTextToVoiceModalOpen(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 hover:bg-white/10 rounded-full transition-colors z-10">
                <X size={24} className="md:w-7 md:h-7" />
              </motion.button>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6 md:mb-8 pr-8">
                  <div className="p-3 md:p-4 bg-orange-500/20 rounded-xl md:rounded-2xl text-[#ff4e00] shadow-lg shadow-orange-500/10 shrink-0">
                    <AudioLines size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Text to Voice</h2>
                    <p className="text-[#8e918f] text-xs md:text-sm">Powered by Advanced TTS</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#c4c7c5] uppercase tracking-wider">Your Text</label>
                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Enter the text you want to convert to speech..."
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-[#8e918f] focus:outline-none focus:ring-2 focus:ring-[#ff4e00]/50 resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#c4c7c5] uppercase tracking-wider">Select Voice</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {creatorVoices.map((voice, vIdx) => (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          key={`app-tts-voice-${voice.id || vIdx}`}
                          onClick={() => setTtsVoice(voice.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                            ttsVoice === voice.id 
                              ? "bg-[#ff4e00]/20 border-[#ff4e00]/50 text-white" 
                              : "bg-black/40 border-white/10 text-[#8e918f] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                            ttsVoice === voice.id ? "bg-[#ff4e00] text-white" : "bg-white/10 text-[#8e918f]"
                          )}>
                            {voice.name[0]}
                          </div>
                          <span className="font-medium text-xs truncate">{voice.name}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider">Pitch Customize</label>
                        <span className="text-xs text-[#8e918f]">{ttsCustomPitch.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" max="2.0" step="0.1" 
                        value={ttsCustomPitch}
                        onChange={(e) => setTtsCustomPitch(parseFloat(e.target.value))}
                        className="w-full accent-[#ff4e00]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#8e918f] uppercase tracking-wider">Tone (Dark to Light)</label>
                        <span className="text-xs text-[#8e918f]">
                          {ttsCustomTone === 0 ? "Normal" : ttsCustomTone < 0 ? `Dark (${Math.abs(ttsCustomTone)})` : `Light (${ttsCustomTone})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-purple-400">Dark</span>
                        <input 
                          type="range" 
                          min="-1" max="1" step="0.1" 
                          value={ttsCustomTone}
                          onChange={(e) => setTtsCustomTone(parseFloat(e.target.value))}
                          className="flex-1 accent-[#ff4e00]"
                        />
                        <span className="text-xs font-medium text-yellow-400">Light</span>
                      </div>
                    </div>
                  </div>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={!ttsText.trim() && !isGeneratingTts}
                    onClick={async () => {
                      if (isGeneratingTts) {
                        if (ttsAudioRef.current) {
                          ttsAudioRef.current.pause();
                          ttsAudioRef.current = null;
                        }
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        setIsGeneratingTts(false);
                        return;
                      }
                      
                      setIsGeneratingTts(true);
                      const creatorVoice = creatorVoices.find(v => v.id === ttsVoice);
                      
                      if ((creatorVoice as any)?.ttsOnly) {
                        try {
                          const geminiVoiceMap: Record<string, string> = {
                            'hindi_child_boy': 'Puck',
                            'hindi_young_male': 'Zephyr',
                            'hindi_deep_male': 'Charon',
                            'hindi_young_female': 'Kore',
                            'hindi_mature_female': 'Aoede'
                          };
                          const voiceName = geminiVoiceMap[ttsVoice] || 'Zephyr';
                          const audioUrl = await generateAudio(ttsText, voiceName);
                          const audio = new Audio(audioUrl);
                          ttsAudioRef.current = audio;
                          
                          const toneRateMod = ttsCustomTone * 0.15; 
                          audio.playbackRate = Math.max(0.25, Math.min(2.0, (creatorVoice?.rate || 1.0) * ttsCustomPitch + toneRateMod));
                          
                          audio.onended = () => { setIsGeneratingTts(false); ttsAudioRef.current = null; };
                          audio.onerror = () => { setIsGeneratingTts(false); ttsAudioRef.current = null; };
                          await audio.play();
                        } catch (err) {
                          console.error("Audio generation failed", err);
                          setIsGeneratingTts(false);
                        }
                      } else {
                        if (!window.speechSynthesis) {
                          alert("Text-to-speech is not supported in this browser.");
                          setIsGeneratingTts(false);
                          return;
                        }
                        window.speechSynthesis.cancel(); // Stop any ongoing speech
                        
                        const utterance = new SpeechSynthesisUtterance(ttsText);
                        
                        if (creatorVoice) {
                          const matchingVoices = availableVoices.filter(v => v.lang.startsWith(creatorVoice.lang));
                          if (matchingVoices.length > 0) {
                            const localVoice = matchingVoices.find(v => v.localService);
                            utterance.voice = localVoice || matchingVoices[0];
                          } else if (availableVoices.length > 0) {
                            const localVoice = availableVoices.find(v => v.localService && v.lang.startsWith('en'));
                            utterance.voice = localVoice || availableVoices[0];
                          }
                          const tonePitchMod = ttsCustomTone * 0.3; 
                          const toneRateMod = ttsCustomTone * 0.15; 
  
                          utterance.pitch = Math.max(0, Math.min(2, creatorVoice.pitch * ttsCustomPitch + tonePitchMod));
                          utterance.rate = Math.max(0.1, Math.min(10, creatorVoice.rate + toneRateMod));
                        }
                        
                        utterance.onend = () => setIsGeneratingTts(false);
                        utterance.onerror = () => setIsGeneratingTts(false);
                        
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    className={cn(
                      "w-full glass-button text-white py-5 text-xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3",
                      isGeneratingTts ? "bg-red-500" : "bg-[#ff4e00]"
                    )}
                  >
                    {isGeneratingTts ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Stop Voice
                      </>
                    ) : (
                      <>
                        <AudioLines size={24} />
                        Play Voice
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      {isPhotoModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 md:p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-3xl glass-card p-6 md:p-10 rounded-[24px] md:rounded-[32px] relative overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-white/10"
          >
            <div className="flex-shrink-0 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 md:p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl md:rounded-2xl text-indigo-400 shrink-0 border border-indigo-500/20">
                  <ImageIcon size={24} className="md:w-8 md:h-8" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Studio Canvas</h2>
                  <p className="text-[#8e918f] text-xs md:text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Powered by Gemini Nano Banana Pro 2 & GPT-2
                  </p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsPhotoModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors self-start">
                <X size={24} className="md:w-6 md:h-6 text-gray-400 hover:text-white" />
              </motion.button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 -mr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Style Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#8e918f] uppercase tracking-widest flex items-center gap-2">
                      <Wand2 size={14} />
                      Visual Style
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Photorealistic', 'Digital Art', 'Anime', '3D Render', 'Oil Painting', 'Sketch'].map((s, index) => (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                          key={`app-photo-style-${s}-${index}`} 
                          onClick={() => setSelectedStyle(s)}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center gap-2",
                            selectedStyle === s 
                              ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300" 
                              : "bg-white/5 hover:bg-white/10 border-white/5 text-[#c4c7c5]"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            selectedStyle === s ? "bg-indigo-400" : "bg-transparent"
                          )} />
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#8e918f] uppercase tracking-widest flex items-center gap-2">
                      <MonitorPlay size={14} />
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: '1:1', icon: <div className="w-6 h-6 border-2 rounded-sm border-current" /> },
                        { id: '16:9', icon: <div className="w-8 h-4 border-2 rounded-sm border-current" /> },
                        { id: '9:16', icon: <div className="w-4 h-8 border-2 rounded-sm border-current" /> }
                      ].map((r, index) => (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                          key={`app-photo-ratio-${r.id}-${index}`} 
                          onClick={() => setSelectedAspectRatio(r.id as any)}
                          className={cn(
                            "p-4 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-3",
                            selectedAspectRatio === r.id 
                              ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-300" 
                              : "bg-white/5 hover:bg-white/10 border-white/5 text-[#c4c7c5]"
                          )}
                        >
                          {r.icon}
                          <span>{r.id}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  {/* Prompt Textarea */}
                  <div className="space-y-3 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-[#8e918f] uppercase tracking-widest">
                      Image Prompt
                    </label>
                    <textarea 
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate in detail..."
                      className="glass-input flex-1 w-full min-h-[160px] resize-none p-4 rounded-xl focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm leading-relaxed"
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                    onClick={async () => {
                      const prompt = imagePrompt || "A beautiful landscape";
                      setIsPhotoModalOpen(false);
                      setImagePrompt('');
                      handleSend(`Generate image: A ${selectedStyle} ${selectedAspectRatio} photo of ${prompt} using gemini nano banana pro 2 and gpt 2 models.`);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <Sparkles size={20} />
                    Generate Masterpiece
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <VoiceSettingsModal 
        isOpen={isVoiceSettingsModalOpen}
        onClose={() => setIsVoiceSettingsModalOpen(false)}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        voiceVolume={voiceVolume}
        setVoiceVolume={setVoiceVolume}
        voiceDelay={voiceDelay}
        setVoiceDelay={setVoiceDelay}
        voiceSpeed={voiceSpeed}
        setVoiceSpeed={setVoiceSpeed}
        voicePitch={voicePitch}
        setVoicePitch={setVoicePitch}
        voiceTemperature={voiceTemperature}
        setVoiceTemperature={setVoiceTemperature}
        availableVoices={availableVoices}
      />

      </AnimatePresence>
    </div>
  );
}
