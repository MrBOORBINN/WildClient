import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Menu, 
  Plus, 
  Image as ImageIcon, 
  Music, 
  Layout, 
  Search, 
  SlidersHorizontal, 
  Mic, 
  Sparkles, 
  X, 
  Zap, 
  Send, 
  User, 
  Bot, 
  Trash2, 
  Settings, 
  LogOut, 
  Cloud, 
  AudioLines, 
  HelpCircle, 
  Volume2, 
  Paperclip, 
  ArrowUp, 
  FileText, 
  Copy, 
  Check, 
  Highlighter, 
  MonitorPlay, 
  Code, 
  ExternalLink,
  RotateCcw,
  FileCode,
  Globe,
  Download,
  BookOpen,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Heart,
  AlertTriangle,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { calculateReadingTime } from './utils/readingTime';
import { 
  getChatResponseStream, 
  ModelType, 
  summarizeContent, 
  generateChatTitle,
  diagnoseImageGenerationEndpoint,
  editImage,
  generateImage
} from './services/geminiService';
import { generateSmartReasoningResponse } from './services/smartReasoningEngine';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  getDocFromServer, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { Message, Attachment, NotebookSnippet, SnippetColor, GroundingSource, Memory, UserProfileData } from './types';
import { 
  getMemoriesForUser, 
  deleteMemory, 
  handleCorrectionIfPresent, 
  runBackgroundMemoryExtraction 
} from './services/memoryService';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InputBar from './components/InputBar';
import AuthScreen from './components/AuthScreen';
import LiquidBackground from './components/LiquidBackground';
import { 
  PhotoModal, 
  MusicModal, 
  DriveModal, 
  HelpModal, 
  BackgroundSettingsModal 
} from './components/Modals';
import { NotebookModal } from './components/NotebookModal';
import { HighlightFloatingMenu } from './components/HighlightFloatingMenu';
import { CodePreviewModal } from './components/CodePreviewModal';
import CloudConsole from './components/CloudConsole';
import ProfileModal from './components/ProfileModal';
import { SettingsView } from './components/settings/SettingsView';
import { DynamicWidget } from './components/chat/DynamicWidget';
import { ImageGenerationLoader } from './components/ImageGenerationLoader';
import { ChatImageCard } from './components/ChatImageCard';
import { ImageGalleryModal, GalleryImage } from './components/ImageGalleryModal';
import { CreditTopUpModal } from './components/CreditTopUpModal';

// Helper function to extract reliable numeric millisecond timestamp from message
export const getMessageTimestamp = (m: Message): number => {
  if (typeof m.timestamp === 'number') return m.timestamp;
  if ((m.timestamp as any)?.toMillis) return (m.timestamp as any).toMillis();
  if ((m.timestamp as any)?.seconds) return (m.timestamp as any).seconds * 1000;
  return 0;
};

/**
 * Strict chronological message sorter that guarantees user messages ALWAYS precede
 * the corresponding AI assistant response (ensuring AI message is placed down/below the user message)
 */
export const sortMessagesChronologically = (msgs: Message[]): Message[] => {
  return [...msgs].sort((a, b) => {
    const tA = getMessageTimestamp(a);
    const tB = getMessageTimestamp(b);

    // If timestamps differ by more than 50ms, order by time strictly
    if (Math.abs(tA - tB) > 50) {
      return tA - tB;
    }

    // Tie-breaker: If timestamps are within same interaction turn (<= 50ms),
    // user message MUST ALWAYS appear BEFORE the assistant message!
    if (a.role === 'user' && b.role === 'assistant') {
      return -1;
    }
    if (a.role === 'assistant' && b.role === 'user') {
      return 1;
    }

    if (tA !== tB) {
      return tA - tB;
    }
    return (a.id || '').localeCompare(b.id || '');
  });
};

/**
 * Fast sub-100ms routing policy for exact standalone greetings.
 * If user sends a standalone greeting with no previous unanswered context,
 * respond immediately without network or model overhead.
 */
export function getInstantReply(
  message: string,
  hasRelevantContext: boolean
): string | null {
  if (hasRelevantContext) return null;

  const normalized = message
    .trim()
    .toLowerCase()
    .replace(/[!.?,]+$/g, "");

  const greetings = new Set([
    "hi",
    "hello",
    "hey",
    "hey there",
    "hi there",
    "namaste",
    "yo",
    "hola",
    "hey infbott",
    "hi infbott",
    "hello infbott"
  ]);

  if (greetings.has(normalized)) {
    return "Hey! 👋 How can I help you today?";
  }

  return null;
}

// Helper function to handle downloading Minecraft schematic/NBT data
const handleDownloadMinecraftExport = (content: string, type: string) => {
  let blob: Blob;
  try {
    // If the model provides base64 data, we should decode it into binary
    if (content.match(/^[a-zA-Z0-9+/=]+$/) && content.length > 50) {
      const byteCharacters = atob(content.trim());
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'application/octet-stream' });
    } else {
      // Otherwise, it might be SNBT or JSON text format
      blob = new Blob([content], { type: 'text/plain' });
    }
  } catch (err) {
    // Fallback to raw text if base64 decoding fails
    blob = new Blob([content], { type: 'text/plain' });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exported_minecraft_data.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Chat State
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modelType, setModelType] = useState<ModelType>('fast');
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [appBackground, setAppBackground] = useState<string | null>(null);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCloudConsoleOpen, setIsCloudConsoleOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(70);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isLowCreditDismissed, setIsLowCreditDismissed] = useState(false);

  // Automatically re-enable low credit alerts if balance is topped up and later drops below 20
  useEffect(() => {
    if (userCredits >= 20) {
      setIsLowCreditDismissed(false);
    }
  }, [userCredits]);

  useEffect(() => {
    if (!user) {
      setUserCredits(70);
      return;
    }
    const fetchCredits = async () => {
      try {
        const idToken = await user.getIdToken().catch(() => null);
        const res = await fetch('/api/credits', {
          headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.credits === 'number') {
            setUserCredits(data.credits);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch credits:", e);
      }
    };
    fetchCredits();
  }, [user]);

  const handleDeductCredits = (amount: number) => {
    setUserCredits(prev => Math.max(0, prev - amount));
  };

  const handleImageGeneratedFromModal = (imageUrl: string, prompt: string) => {
    const imageMessage: Message = {
      id: `assistant-img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'assistant',
      content: `![${prompt}](${imageUrl})`,
      imageUrl: imageUrl,
      imagePrompt: prompt,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, imageMessage]);
  };

  // Image Gallery & Watermark State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Aggregated session images for Gallery Modal
  const sessionImages: GalleryImage[] = useMemo(() => {
    const list: GalleryImage[] = [];
    messages.forEach(m => {
      if (m.imageUrl) {
        list.push({
          id: m.id,
          url: m.imageUrl,
          prompt: m.imagePrompt || (typeof m.content === 'string' ? m.content.slice(0, 90) : 'Generated Image'),
          timestamp: m.timestamp,
          isEdit: m.isEdit
        });
      }
      if (m.attachments) {
        m.attachments.forEach((att, idx) => {
          if (att.type === 'image' && att.data) {
            list.push({
              id: `${m.id}-att-${idx}`,
              url: att.data,
              prompt: att.name || 'Uploaded image',
              timestamp: m.timestamp
            });
          }
        });
      }
      if (typeof m.content === 'string') {
        const mdMatches = [...m.content.matchAll(/!\[(.*?)\]\(((?:data:image\/|https?:\/\/)[^)]+)\)/g)];
        mdMatches.forEach((match, idx) => {
          const url = match[2];
          if (!list.some(item => item.url === url)) {
            list.push({
              id: `${m.id}-md-${idx}`,
              url: url,
              prompt: match[1] || m.imagePrompt || 'Session Image',
              timestamp: m.timestamp
            });
          }
        });
      }
    });
    return list;
  }, [messages]);

  // Top-level displayMessages memoization strictly compliant with React Rules of Hooks
  const displayMessages = useMemo(() => sortMessagesChronologically(messages), [messages]);

  const handleRegenerateImage = (promptText: string) => {
    if (!promptText || isLoading) return;
    setInput(promptText);
    handleSend(promptText);
  };

  const handleUseAsWatermark = (imageUrl: string) => {
    if (isLoading) return;
    const watermarkAttachment: Attachment = {
      type: 'image',
      data: imageUrl,
      name: 'watermark_image.png',
      mimeType: imageUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
    };
    setAttachments([watermarkAttachment]);
    setInput('Use this as watermark');
    handleSend('Use this as watermark');
  };

  // Dynamic AI Status Indicator state
  const [aiStatus, setAiStatus] = useState<string>('INFBOTT is Thinking...');

  // Firestore-backed Reaction Handlers (Like, Heart, Dislike)
  const handleReaction = async (messageId: string, reactionType: 'thumbs_up' | 'thumbs_down' | 'heart') => {
    let nextReaction: 'thumbs_up' | 'thumbs_down' | 'heart' | null = null;
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        nextReaction = m.reaction === reactionType ? null : reactionType;
        return { ...m, reaction: nextReaction };
      }
      return m;
    }));

    if (user?.uid && currentSessionId) {
      try {
        const msgRef = doc(db, `sessions/${currentSessionId}/messages`, messageId);
        await setDoc(msgRef, { reaction: nextReaction }, { merge: true });

        // Record in the central feedback collection for tracking & continuous improvement
        const targetMsg = messages.find(m => m.id === messageId);
        await addDoc(collection(db, 'feedback'), {
          userId: user.uid,
          sessionId: currentSessionId,
          messageId: messageId,
          reaction: nextReaction,
          contentPreview: (targetMsg?.content || '').slice(0, 300),
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Failed to persist reaction to Firestore:", err);
      }
    }
  };

  // Code & Game Runner Preview Sandbox
  const [codeSandboxData, setCodeSandboxData] = useState<{
    isOpen: boolean;
    code: string;
    language: string;
    title?: string;
  }>({
    isOpen: false,
    code: '',
    language: 'html',
    title: 'Code & Game Runner'
  });

  // Personal Notebook
  const [notebookSnippets, setNotebookSnippets] = useState<NotebookSnippet[]>([]);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [selectedSnippetText, setSelectedSnippetText] = useState('');
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState<UserProfileData>({
    fullName: 'Explorer',
    email: '',
    avatar: 'I',
    avatarUrl: '',
    customSystemInstructions: localStorage.getItem('infbott_custom_system_instructions') || ''
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const curatedBackgrounds = [
    { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80' },
    { name: 'Dark Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80' },
    { name: 'Minimalist Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80' }
  ];

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync profile data
  useEffect(() => {
    if (user) {
      const activeName = userData?.fullName || user.displayName || user.email?.split('@')[0] || 'User';
      const activeEmail = userData?.email || user.email || '';
      const activeAvatarUrl = userData?.avatarUrl || (user.photoURL && user.photoURL.startsWith('http') ? user.photoURL : '');
      const activeInitial = (activeName || activeEmail || 'I')[0]?.toUpperCase() || 'I';
      const activeCustomInstructions = userData?.customSystemInstructions || localStorage.getItem('infbott_custom_system_instructions') || '';

      setProfileData({
        fullName: activeName,
        email: activeEmail,
        avatar: activeInitial,
        avatarUrl: activeAvatarUrl,
        customSystemInstructions: activeCustomInstructions
      });
    }
  }, [user, userData]);

  // Firestore Sessions listener
  useEffect(() => {
    if (!user) {
      const localSessions = localStorage.getItem('infbott_sessions') || localStorage.getItem('wildstar_sessions');
      if (localSessions) {
        try {
          setSessions(JSON.parse(localSessions));
        } catch (e) {
          console.error("Failed to parse local sessions:", e);
        }
      }
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(sessionsData);
      try {
        localStorage.setItem('infbott_sessions', JSON.stringify(sessionsData));
      } catch (e) {}
    }, (error) => {
      console.warn("Firestore sessions error, using local state:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Firestore Messages listener for active session
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    if (!user) {
      const localMsgKey = `infbott_messages_${currentSessionId}`;
      const fallbackKey = `wildstar_messages_${currentSessionId}`;
      const localMsgs = localStorage.getItem(localMsgKey) || localStorage.getItem(fallbackKey);
      if (localMsgs) {
        try {
          setMessages(sortMessagesChronologically(JSON.parse(localMsgs)));
        } catch (e) {}
      }
      return;
    }

    const q = query(
      collection(db, `sessions/${currentSessionId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(prev => {
        const remoteIds = new Set(remoteMsgs.map(m => m.id));
        // Keep in-flight local messages: image generation loaders, streaming assistant messages, or recent messages not yet synced
        const pendingLocalMsgs = prev.filter(m => 
          !remoteIds.has(m.id) && (
            m.isImageGenerationLoading || 
            m.id.startsWith('assistant-') || 
            (m.timestamp && (Date.now() - (typeof m.timestamp === 'number' ? m.timestamp : Date.now()) < 60000))
          )
        );

        if (pendingLocalMsgs.length === 0) {
          return sortMessagesChronologically(remoteMsgs);
        }

        const merged = [...remoteMsgs, ...pendingLocalMsgs];
        return sortMessagesChronologically(merged);
      });
      try {
        localStorage.setItem(`infbott_messages_${currentSessionId}`, JSON.stringify(remoteMsgs));
      } catch (e) {}
    }, (error) => {
      console.warn("Firestore messages error, using local state:", error);
    });

    return () => unsubscribe();
  }, [currentSessionId, user]);

  // Sync Notebook Snippets
  useEffect(() => {
    if (!user) {
      const localSnippets = localStorage.getItem('infbott_notebook_snippets') || localStorage.getItem('wildstar_notebook_snippets');
      if (localSnippets) {
        try {
          setNotebookSnippets(JSON.parse(localSnippets));
        } catch (e) {}
      }
      return;
    }

    const q = query(
      collection(db, 'notebook'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const snippetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotebookSnippet[];
      setNotebookSnippets(snippetsData);
      try {
        localStorage.setItem('infbott_notebook_snippets', JSON.stringify(snippetsData));
      } catch (e) {}
    }, (error) => {
      console.warn("Firestore notebook error, using local state:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Account-Based Long-Term Memory Listener (Requirement 1, 6, 8)
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setMemories([]);
      return;
    }

    const q = query(
      collection(db, 'memories'),
      where('user_id', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memoriesData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Memory[];
      setMemories(memoriesData);
    }, (error) => {
      console.warn("Firestore memories error, using local state:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
    } catch (e) {
      console.warn("Notice: Error removing memory doc remotely:", e);
    }
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleClearAllMemories = async () => {
    for (const mem of memories) {
      if (mem.id) {
        try {
          await deleteMemory(mem.id);
        } catch (e) {
          console.warn("Notice: Error clearing memory remotely:", e);
        }
      }
    }
    setMemories([]);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech synthesis
  const playVoiceResponse = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_\[\]]/g, '').slice(0, 400);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Switch session
  const handleSwitchSession = (id: string) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // New Chat
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    setAttachments([]);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    // 1. Immediately update local UI state
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('infbott_sessions', JSON.stringify(updated));
        localStorage.removeItem(`infbott_messages_${id}`);
        localStorage.removeItem(`wildstar_messages_${id}`);
      } catch (e) {}
      return updated;
    });

    if (currentSessionId === id) {
      handleNewChat();
    }

    // 2. Delete from Firestore if user is logged in
    if (user?.uid) {
      try {
        // Delete subcollection messages first so Firestore tree remains clean
        const msgsRef = collection(db, `sessions/${id}/messages`);
        const msgsSnap = await getDocs(msgsRef).catch(() => null);
        if (msgsSnap && !msgsSnap.empty) {
          const deleteOps = msgsSnap.docs.map(d => deleteDoc(d.ref).catch(() => null));
          await Promise.all(deleteOps);
        }

        await deleteDoc(doc(db, 'sessions', id));
      } catch (err: any) {
        console.warn("Firestore session delete handled:", err?.message || err);
      }
    }
  };

  // Send Message
  const handleSend = async (text: string | any = input) => {
    if (typeof text !== 'string') {
      text = input;
    }
    const trimmedText = text.trim();
    if ((!trimmedText && attachments.length === 0) || isLoading) return;

    // 1. Check for local chat commands
    const renameMatch = trimmedText.match(/^rename\s+this\s+chat\s+to\s+(.+)$/i);
    if (renameMatch) {
      const newName = renameMatch[1].trim();
      const userMsg: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'user',
        content: trimmedText,
        timestamp: Date.now()
      };
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'assistant',
        content: `Chat successfully renamed to "${newName}".`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setInput('');
      if (currentSessionId) {
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newName } : s));
        if (user?.uid) {
          try {
            await setDoc(doc(db, 'sessions', currentSessionId), { title: newName }, { merge: true });
          } catch (e) {}
        }
      }
      return;
    }

    if (/^delete\s+this\s+chat$/i.test(trimmedText)) {
      const userMsg: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'user',
        content: trimmedText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      if (currentSessionId) {
        await handleDeleteSession(currentSessionId);
      }
      return;
    }

    if (/^(new\s+chat|start\s+a\s+new\s+chat)$/i.test(trimmedText)) {
      setInput('');
      handleNewChat();
      return;
    }

    if (/^(clear\s+chat|clear\s+history)$/i.test(trimmedText)) {
      const userMsg: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'user',
        content: trimmedText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setMessages([]);
      return;
    }

    // 1a. Fast Standalone Greeting Router (Sub-100ms response policy)
    // Standalone greetings such as "hey", "hi", "hello" return immediately without unnecessary provider request
    const hasMeaningfulContext = messages.length > 0 && messages.some(m => m.role === 'user' && !/^(hi|hello|hey|hey there|hi there|namaste)$/i.test(m.content.trim()));
    const instantGreeting = attachments.length === 0 ? getInstantReply(trimmedText, hasMeaningfulContext) : null;
    if (instantGreeting) {
      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        activeSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newSessionData = {
          id: activeSessionId,
          userId: user?.uid || 'guest',
          title: 'Greeting',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        if (user?.uid) {
          setDoc(doc(db, 'sessions', activeSessionId), {
            ...newSessionData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(console.warn);
        }
        setSessions(prev => [newSessionData, ...prev]);
        setCurrentSessionId(activeSessionId);
      }

      const userTimestamp = Date.now();
      const userMsg: Message = {
        id: `user-${userTimestamp}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'user',
        content: trimmedText,
        attachments: [],
        timestamp: userTimestamp
      };
      const assistantMsg: Message = {
        id: `assistant-${userTimestamp + 50}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'assistant',
        content: instantGreeting,
        timestamp: userTimestamp + 50,
        generationTimeMs: 8
      };
      setMessages(prev => sortMessagesChronologically([...prev, userMsg, assistantMsg]));
      setInput('');
      setAttachments([]);

      if (user?.uid && activeSessionId) {
        setDoc(doc(db, `sessions/${activeSessionId}/messages`, userMsg.id), userMsg).catch(console.warn);
        setDoc(doc(db, `sessions/${activeSessionId}/messages`, assistantMsg.id), assistantMsg).catch(console.warn);
        setDoc(doc(db, 'sessions', activeSessionId), { updatedAt: serverTimestamp() }, { merge: true }).catch(console.warn);
      }
      return;
    }

    // 1b. Check for Creator / Owner question
    const creatorRegex = /^(who\s+(created|made|built|developed|owns?|is\s+(the\s+)?creator\s+of|is\s+(the\s+)?owner\s+of)\s+(you|infbott|this\s+ai|this\s+bot|this\s+app)|who\s+is\s+(your\s+)?(owner|creator|maker|developer)|who\s+owns?\s+you|who\s+created\s+you\??|who\s+is\s+owner\??)$/i;
    if (creatorRegex.test(trimmedText) || /who\s+(created|is\s+(the\s+)?owner\s+of)\s+you/i.test(trimmedText) || trimmedText.toLowerCase() === 'who is owner' || trimmedText.toLowerCase() === 'who is your owner' || trimmedText.toLowerCase() === 'who created you') {
      const userMsg: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'user',
        content: trimmedText,
        attachments: [...attachments],
        timestamp: Date.now()
      };
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        role: 'assistant',
        content: 'Duckeyy/Ravi Create Me to make users life easy',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setInput('');
      setAttachments([]);
      return;
    }

    // Check for automatic image generation or editing intent
    let targetImage = attachments.find(a => a.type === 'image' && a.data);

    // If no image is currently attached, check if recent messages in chat had an image
    if (!targetImage) {
      for (let i = messages.length - 1; i >= Math.max(0, messages.length - 8); i--) {
        const msg = messages[i];
        if (msg.imageUrl) {
          targetImage = {
            type: 'image',
            data: msg.imageUrl,
            name: msg.imagePrompt || 'Previous Image',
            mimeType: 'image/png'
          };
          break;
        }
        if (msg.attachments && msg.attachments.length > 0) {
          const imgAtt = msg.attachments.find(a => a.type === 'image' && a.data);
          if (imgAtt) {
            targetImage = imgAtt;
            break;
          }
        }
        if (msg.role === 'assistant' && msg.content) {
          const mdImgMatch = msg.content.match(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/);
          if (mdImgMatch && mdImgMatch[1]) {
            targetImage = {
              type: 'image',
              data: mdImgMatch[1],
              name: 'Previous Image',
              mimeType: 'image/png'
            };
            break;
          }
        }
      }
    }

    const hasImageAttachment = Boolean(targetImage);
    const imageIntentRegex = /^(create|generate|make|draw|paint|produce|render)\s+(an?\s+)?(image|picture|photo|artwork|illustration|logo|avatar|banner)/i;
    const isImageIntent = imageIntentRegex.test(trimmedText) || trimmedText.toLowerCase().includes('generate an image') || trimmedText.toLowerCase().includes('create an image') || trimmedText.toLowerCase().includes('make a picture');
    const editKeywordsRegex = /(edit|change|remove|delete|clean|replace|modify|update|adjust|enhance|fix|watermark|background|crop|colour|color|reconstruct|keep|filter|grayscale|sepia|contrast|saturate|tint|add|brighten|darken|invert|turn)/i;
    // Real separation: Only treat as image edit if explicit edit keywords are present.
    // Otherwise, uploaded image proceeds to Vision Analysis for description, visual Q&A, and OCR.
    const isImageEditIntent = hasImageAttachment && editKeywordsRegex.test(trimmedText);

    if (isImageIntent || isImageEditIntent) {
      if (userCredits < 10) {
        const insufficientMsg: Message = {
          id: `assistant-insufficient-${Date.now()}`,
          role: 'assistant',
          content: 'Insufficient credits. You need 10 credits to generate or edit an image.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: trimmedText, attachments: [...attachments], timestamp: Date.now() }, insufficientMsg]);
        setInput('');
        setAttachments([]);
        return;
      }

      setAiStatus(isImageEditIntent ? 'Editing image...' : 'Creating image...');
      setUserCredits(prev => Math.max(0, prev - 10));

      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        activeSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const newSessionData = {
          id: activeSessionId,
          userId: user?.uid || 'guest',
          title: trimmedText.slice(0, 30) || 'Image Generation',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        if (user?.uid) {
          setDoc(doc(db, 'sessions', activeSessionId), {
            ...newSessionData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(console.warn);
        }
        setSessions(prev => [newSessionData, ...prev]);
        setCurrentSessionId(activeSessionId);
      }

      const userTimestamp = Date.now();
      const userMsg: Message = {
        id: `user-${userTimestamp}`,
        role: 'user',
        content: trimmedText,
        attachments: attachments.length > 0 ? [...attachments] : (isImageEditIntent && targetImage ? [targetImage] : []),
        timestamp: userTimestamp
      };
      const assistantTimestamp = userTimestamp + 50;
      const loadingMsgId = `assistant-loading-${assistantTimestamp}`;
      const loadingMsg: Message = {
        id: loadingMsgId,
        role: 'assistant',
        content: isImageEditIntent ? 'Editing image...' : 'Creating image...',
        timestamp: assistantTimestamp,
        perfStartTime: performance.now(),
        isImageGenerationLoading: true,
        imagePrompt: trimmedText,
        isEdit: isImageEditIntent
      };
      setMessages(prev => sortMessagesChronologically([...prev, userMsg, loadingMsg]));
      setInput('');
      setAttachments([]);
      setIsLoading(true);

      try {
        const idToken = user ? await user.getIdToken().catch(() => null) : null;
        let data: { imageUrl: string; creditsRemaining?: number; cost?: number; isEdit?: boolean };

        if (isImageEditIntent && targetImage) {
          data = await editImage({
            prompt: trimmedText,
            image: targetImage,
            idToken
          });
        } else {
          data = await generateImage({
            prompt: trimmedText,
            provider: 'auto',
            idToken
          });
        }
        if (data.imageUrl) {
          const successMsg: Message = {
            id: `assistant-img-${Date.now()}`,
            role: 'assistant',
            content: `![${trimmedText}](${data.imageUrl})`,
            imageUrl: data.imageUrl,
            imagePrompt: trimmedText,
            timestamp: Date.now()
          };
          setMessages(prev => prev.map(m => m.id === loadingMsgId ? successMsg : m));
          if (typeof data.creditsRemaining === 'number') {
            setUserCredits(data.creditsRemaining);
          }
          if (user?.uid && activeSessionId) {
            setDoc(doc(db, `sessions/${activeSessionId}/messages`, userMsg.id), userMsg).catch(console.warn);
            setDoc(doc(db, `sessions/${activeSessionId}/messages`, successMsg.id), successMsg).catch(console.warn);
            setDoc(doc(db, 'sessions', activeSessionId), { updatedAt: serverTimestamp() }, { merge: true }).catch(console.warn);
          }
        }
      } catch (err: any) {
        setUserCredits(prev => prev + 10);
        const errorContent = isImageEditIntent 
          ? (err.message && err.message.includes("Sorry") ? err.message : "Sorry, I couldn't edit this image. Please try again.")
          : `Image generation error: ${err.message || 'Failed to generate image'}. Your 10 credits have been refunded.`;
        const errorMsg: Message = {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now()
        };
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? errorMsg : m));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let sessionId = currentSessionId;
    const isNewConversation = !sessionId;

    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newSessionData = {
        id: sessionId,
        userId: user?.uid || 'guest',
        title: trimmedText.slice(0, 30) || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      if (user?.uid) {
        try {
          await setDoc(doc(db, 'sessions', sessionId), {
            ...newSessionData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Firestore session create fallback:", e);
        }
      }

      setSessions(prev => [newSessionData, ...prev]);
      setCurrentSessionId(sessionId);

      // Asynchronously generate a concise title
      generateChatTitle(trimmedText).then(async (smartTitle) => {
        if (smartTitle && smartTitle !== 'New Conversation') {
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: smartTitle } : s));
          if (user?.uid && sessionId) {
            try {
              await setDoc(doc(db, 'sessions', sessionId), { title: smartTitle }, { merge: true });
            } catch (e) {}
          }
        }
      });
    }

    const userTimestamp = Date.now();
    const userMessage: Message = {
      id: `user-${userTimestamp}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: trimmedText,
      attachments: [...attachments],
      timestamp: userTimestamp,
    };

    // Guarantee assistant timestamp is strictly greater so AI message is always chronologically down/below the user message
    const assistantTimestamp = userTimestamp + 50;
    const assistantMessageId = `assistant-${assistantTimestamp}-${Math.random().toString(36).substr(2, 6)}`;
    const perfStart = performance.now();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: assistantTimestamp,
      perfStartTime: perfStart,
      sources: []
    };

    // Context-aware dynamic AI status determination
    const lowerInput = trimmedText.toLowerCase();
    const hasCodeOrUrl = /https?:\/\/|```|github\.com|stack|trace|error|bug/i.test(trimmedText) || 
      userMessage.attachments?.some(a => /\.(ts|js|py|json|html|css|c|cpp|go|rs|md|txt)$/i.test(a.name));
    const hasDocAttachment = userMessage.attachments?.some(a => /\.(pdf|doc|docx|csv|xlsx)$/i.test(a.name));
    const isRememberIntent = memories.length > 0 && /(remember|who am i|my name|preferences|what do you know)/i.test(lowerInput);
    const isSearchIntent = isSearchEnabled || /(today|current|news|latest|weather|price|who won|score)/i.test(lowerInput);
    const isAnalysisIntent = trimmedText.length > 80 || /(explain|analyze|compare|difference|summary|summarize|calculate|evaluate)/i.test(lowerInput);

    if (hasCodeOrUrl) {
      setAiStatus('Inspecting...');
    } else if (hasDocAttachment) {
      setAiStatus('Reading...');
    } else if (isSearchIntent) {
      setAiStatus('Checking...');
    } else if (isRememberIntent) {
      setAiStatus('Remembering...');
    } else if (isAnalysisIntent) {
      setAiStatus('Analysing...');
    } else {
      setAiStatus('INFBOTT is Thinking...');
    }

    setMessages(prev => sortMessagesChronologically([...prev, userMessage, assistantMessage]));
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // Save user message to Firestore if user exists
    if (user?.uid && sessionId) {
      try {
        await setDoc(doc(db, `sessions/${sessionId}/messages`, userMessage.id), userMessage);
        await setDoc(doc(db, 'sessions', sessionId), { updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {}
    }

    // Get Firebase ID token for account-authenticated memory requests (Requirement 1 & 8)
    const idToken = user ? await user.getIdToken().catch(() => undefined) : undefined;

    // Process user correction if present (Requirement 7: "Don't remember that", "Forget this", "Remember this")
    if (user) {
      handleCorrectionIfPresent(trimmedText, memories).catch(err => {
        console.warn("User correction processing:", err);
      });
    }

    try {
      let fullContent = '';
      const sourcesList: GroundingSource[] = [];
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const stream = getChatResponseStream(
        trimmedText, 
        history, 
        modelType, 
        userMessage.attachments, 
        0.7, 
        isSearchEnabled,
        idToken,
        memories,
        profileData.customSystemInstructions
      );

      let lastUpdateTime = Date.now();
      for await (const chunk of stream) {
        if (chunk.type === 'error') {
          const errorMessageText = chunk.message || "An issue occurred while generating the response. Please retry.";
          const perfEnd = performance.now();
          const genTime = perfEnd - perfStart;
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? {
              ...m,
              content: errorMessageText,
              isError: true,
              canRetry: true,
              generationTimeMs: genTime
            } : m)
          );
          if (user?.uid && sessionId) {
            setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), {
              ...assistantMessage,
              content: errorMessageText,
              isError: true,
              canRetry: true,
              generationTimeMs: genTime
            }).catch(console.warn);
          }
          return;
        }

        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          const now = Date.now();
          // Throttle UI updates to roughly 60fps (~16ms) or 20fps (~50ms) to reduce re-render lag
          if (now - lastUpdateTime > 50) {
            setMessages(prev => 
              prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent } : m)
            );
            lastUpdateTime = now;
          }
        } else if (chunk.type === 'sources' && chunk.sources) {
          sourcesList.push(...chunk.sources);
          setMessages(prev => 
            prev.map(m => m.id === assistantMessageId ? { ...m, sources: [...sourcesList] } : m)
          );
        }
      }
      
      // Final catch-up state update to ensure nothing was left out in the throttle
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, content: fullContent, sources: [...sourcesList] } : m)
      );
      const perfEnd = performance.now();
      const genTime = perfEnd - perfStart;
      
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? { ...m, generationTimeMs: genTime } : m)
      );

      // Save assistant message to Firestore
      if (user?.uid && sessionId) {
        try {
          await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), {
            ...assistantMessage,
            content: fullContent,
            sources: sourcesList,
            generationTimeMs: genTime
          });
        } catch (e) {}
      }

      // Asynchronous background memory extraction (Requirement 2, 11, 13)
      if (user?.uid) {
        runBackgroundMemoryExtraction(
          trimmedText, 
          fullContent, 
          user.uid, 
          memories, 
          idToken
        ).catch(e => console.warn("Background memory extraction error:", e));
      }

      if (isVoiceEnabled && fullContent) {
        playVoiceResponse(fullContent);
      }
    } catch (error: any) {
      console.warn('Chat stream error:', error?.message || error);
      const perfEnd = performance.now();
      const genTime = perfEnd - perfStart;
      const errorMessageText = error?.message || "The connection to the AI provider was interrupted. Please retry.";

      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? {
          ...m,
          content: errorMessageText,
          isError: true,
          canRetry: true,
          generationTimeMs: genTime
        } : m)
      );

      if (user?.uid && sessionId) {
        try {
          await setDoc(doc(db, `sessions/${sessionId}/messages`, assistantMessageId), {
            ...assistantMessage,
            content: errorMessageText,
            isError: true,
            canRetry: true,
            generationTimeMs: genTime
          });
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated handler to retry a failed response
  const handleRetry = (assistantMsgId: string) => {
    if (isLoading) return;
    const msgIndex = messages.findIndex(m => m.id === assistantMsgId);
    if (msgIndex <= 0) return;
    const prevUserMsg = messages[msgIndex - 1];
    if (prevUserMsg && prevUserMsg.role === 'user') {
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
      if (prevUserMsg.attachments) {
        setAttachments([...prevUserMsg.attachments]);
      }
      handleSend(prevUserMsg.content);
    }
  };

  // Summarize whole chat
  const handleSummarizeChat = async () => {
    if (messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const fullText = messages.map(m => `${m.role === 'user' ? 'User' : 'INFBOTT'}: ${m.content}`).join('\n\n');
      const summary = await summarizeContent(fullText);
      await handleSend(`Please provide the following conversation summary in the chat:\n\n${summary}`);
    } catch (err: any) {
      alert(err.message || 'Failed to summarize conversation');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Summarize single message
  const handleSummarizeMessage = async (content: string) => {
    await handleSend(`Please summarize this key point:\n\n"${content.slice(0, 800)}"`);
  };

  // Quick Action Buttons
  const handleAction = (action: string) => {
    if (action === 'Deep Research' || action === 'Web Research') {
      setInput('Search the live web and provide an in-depth research summary on: ');
    } else if (action === 'Code & Game Dev') {
      setInput('Write a complete, playable 2D HTML5 Canvas game in JavaScript with score tracking and controls.');
    } else if (action === 'Analyze Document') {
      setInput('Please analyze this document and summarize the key insights, arguments, and actionable takeaways.');
    } else if (action === 'Create Photos') {
      setIsPhotoModalOpen(true);
    } else {
      setInput(action);
    }
  };

  // Save Notebook snippet
  const handleSaveSnippet = async (text: string, color: SnippetColor = 'amber', tag?: string, note?: string) => {
    if (!text.trim()) return;
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const newSnippetData = {
      userId: user?.uid || 'guest-user',
      text: text.trim(),
      color,
      tag: tag?.trim() || undefined,
      note: note?.trim() || undefined,
      sessionId: currentSessionId || undefined,
      sessionTitle: currentSession?.title || 'Quick Chat',
      createdAt: Date.now()
    };

    if (user?.uid) {
      try {
        const docRef = await addDoc(collection(db, 'notebook'), newSnippetData);
        const createdSnippet: NotebookSnippet = { id: docRef.id, ...newSnippetData };
        setNotebookSnippets(prev => [createdSnippet, ...prev.filter(s => s.id !== docRef.id)]);
      } catch (err) {
        const fallbackSnippet: NotebookSnippet = { id: `snippet-${Date.now()}`, ...newSnippetData };
        setNotebookSnippets(prev => {
          const updated = [fallbackSnippet, ...prev];
          localStorage.setItem('infbott_notebook_snippets', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      const fallbackSnippet: NotebookSnippet = { id: `snippet-${Date.now()}`, ...newSnippetData };
      setNotebookSnippets(prev => {
        const updated = [fallbackSnippet, ...prev];
        localStorage.setItem('infbott_notebook_snippets', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteSnippet = async (snippetId: string) => {
    if (user?.uid) {
      try {
        await deleteDoc(doc(db, 'notebook', snippetId));
      } catch (err) {}
    }
    setNotebookSnippets(prev => {
      const updated = prev.filter(s => s.id !== snippetId);
      localStorage.setItem('infbott_notebook_snippets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateSnippet = async (snippetId: string, updates: Partial<NotebookSnippet>) => {
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'notebook', snippetId), updates, { merge: true });
      } catch (err) {}
    }
    setNotebookSnippets(prev => {
      const updated = prev.map(s => s.id === snippetId ? { ...s, ...updates } : s);
      localStorage.setItem('infbott_notebook_snippets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 2) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && rect.width > 0) {
          setSelectedSnippetText(text);
          setFloatingMenuPos({
            x: rect.left + rect.width / 2,
            y: rect.top
          });
        }
      } catch (e) {}
    }
  };

  // Helper to detect runnable code (HTML, JS Canvas games)
  const isCodeRunnable = (lang: string = '', code: string = '') => {
    const cleanLang = lang.toLowerCase();
    return cleanLang === 'html' || cleanLang === 'javascript' || cleanLang === 'js' || code.includes('<canvas') || code.includes('requestAnimationFrame');
  };

  const handleRunCode = (code: string, lang: string = 'html') => {
    setCodeSandboxData({
      isOpen: true,
      code,
      language: lang,
      title: 'Interactive Code & Game Runner'
    });
  };

  // Regenerate last response
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#131314] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center animate-pulse">
            <Sparkles size={24} className="text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wider text-[#8e918f]">Loading INFBOTT...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentSessionTitle = currentSession?.title || 'New Conversation';

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden font-sans select-text relative">
      {/* Dynamic Background */}
      <LiquidBackground imageUrl={appBackground} />

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSwitchSession={handleSwitchSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBackground={() => setIsBackgroundModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        notebookCount={notebookSnippets.length}
        onAction={handleAction}
        user={user}
      />

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 min-w-0">
        <Header 
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarOpen={isSidebarOpen}
          modelType={modelType}
          setModelType={setModelType}
          isModelMenuOpen={isModelMenuOpen}
          setIsModelMenuOpen={setIsModelMenuOpen}
          handleSummarizeChat={handleSummarizeChat}
          isSummarizing={isSummarizing}
          messages={messages}
          currentSessionTitle={currentSessionTitle}
          setIsProfileModalOpen={setIsProfileModalOpen}
          profileData={profileData}
          onOpenNotebook={() => setIsNotebookOpen(true)}
          notebookCount={notebookSnippets.length}
          userCredits={userCredits}
          onOpenTopUp={() => setIsTopUpModalOpen(true)}
        />

        {/* Warning notification when user's credit balance drops below 20 credits, suggesting a top-up */}
        <AnimatePresence>
          {userCredits < 20 && !isLowCreditDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border-b border-amber-500/30 backdrop-blur-md px-3 sm:px-6 py-2.5 z-20 shadow-md shrink-0"
            >
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <AlertTriangle size={15} className="animate-pulse" />
                  </div>
                  <div className="text-white/90">
                    <span className="font-bold text-amber-300 mr-1.5">Low Balance Warning:</span>
                    <span>You have only <strong className="text-amber-200 font-mono font-bold">{userCredits} credit{userCredits === 1 ? '' : 's'}</strong> remaining. Top up your balance to keep generating images and running advanced requests without interruption.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap size={13} className="fill-black" />
                    <span>Top Up Now</span>
                  </button>
                  <button
                    onClick={() => setIsLowCreditDismissed(true)}
                    className="p-1 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Dismiss warning for this session"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Stream View */}
        <div 
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          className="flex-1 overflow-y-auto px-3 sm:px-6 custom-scrollbar bg-[#000000]"
        >
          <div className="max-w-3xl mx-auto py-6">
            {displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#ff4e00] to-[#9b72cb] flex items-center justify-center mx-auto shadow-2xl border border-[#414141]">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent"
                  >
                    Hi {profileData?.fullName?.split(' ')[0] || 'there'}, how can INFBOTT help?
                  </motion.h2>
                  <p className="text-[#A0A0A0] text-sm max-w-lg mx-auto">
                    Advanced software engineering, interactive reasoning, media analysis, and creative architecture.
                  </p>
                  <p className="text-[#9b72cb] text-xs font-medium">
                    नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ? (Hindi & Hinglish supported)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {displayMessages.map((msg, mIdx) => (
                  <motion.div 
                    key={msg.id ? `msg-${msg.id}` : `msg-idx-${mIdx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#414141] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                        <Sparkles size={14} className="text-[#9b72cb]" />
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[88%] rounded-2xl p-4 text-sm group relative shadow-sm",
                      msg.role === 'user' 
                        ? "bg-[#2C2C2C] text-white border border-[#414141]" 
                        : "bg-[#111111] text-white border border-[#414141]/50"
                    )}>
                      {/* Attachments preview inside message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.attachments.map((att: Attachment, idx: number) => (
                            <div 
                              key={`msg-att-${idx}`}
                              className="flex items-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs"
                            >
                              {att.type === 'image' && att.data ? (
                                <img src={att.data ? att.data : undefined} alt="uploaded" className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <FileCode size={14} className="text-blue-400" />
                              )}
                              <span className="truncate max-w-[140px] text-[11px] font-medium text-white/90">
                                {att.name || 'File'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Error Card with Retry Button, Image Generation Loader, or Standard Markdown */}
                      {msg.isError ? (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                            <span className="leading-relaxed">{msg.content}</span>
                          </div>
                          {msg.canRetry && (
                            <button
                              onClick={() => handleRetry(msg.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <RotateCw size={12} />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      ) : msg.isImageGenerationLoading ? (
                        <ImageGenerationLoader 
                          prompt={msg.imagePrompt || ''}
                          isEdit={msg.isEdit}
                          perfStartTime={msg.perfStartTime}
                        />
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
                          <Markdown 
                            remarkPlugins={[remarkGfm]}
                            urlTransform={(url) => url}
                            components={{
                              p({ children }: any) {
                                return <div className="mb-3 leading-relaxed last:mb-0">{children}</div>;
                              },
                              img({ src, alt }: any) {
                                if (!src) return null;
                                return (
                                  <ChatImageCard 
                                    src={src} 
                                    alt={alt || "INFBOTT AI Image"} 
                                    prompt={msg.imagePrompt || alt}
                                    onRegenerate={handleRegenerateImage}
                                    onOpenGallery={() => setIsGalleryOpen(true)}
                                    onUseAsWatermark={handleUseAsWatermark}
                                  />
                                );
                              },
                              a({ href, children }: any) {
                                if (href && (href.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(href))) {
                                  return (
                                    <ChatImageCard 
                                      src={href} 
                                      alt={String(children) || "INFBOTT AI Image"} 
                                      prompt={msg.imagePrompt || String(children)}
                                      onRegenerate={handleRegenerateImage}
                                      onOpenGallery={() => setIsGalleryOpen(true)}
                                      onUseAsWatermark={handleUseAsWatermark}
                                    />
                                  );
                                }
                                return (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                                    {children}
                                  </a>
                                );
                              },
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                const lang = match ? match[1] : '';
                                const isRunnable = isCodeRunnable(lang, codeString);

                                if (lang.startsWith('widget:')) {
                                  const widgetType = lang.split(':')[1];
                                  try {
                                    const parsedData = JSON.parse(codeString);
                                    return (
                                      <DynamicWidget 
                                        data={{ ...parsedData, type: widgetType as any }} 
                                        onAction={(act) => handleSend(act)} 
                                      />
                                    );
                                  } catch (e) {}
                                }

                                if (lang === 'zip' || lang === 'schematic' || lang === 'nbt' || lang === 'schem') {
                                  const fileType = (lang === 'nbt' || lang === 'schem') ? 'schem' : lang;
                                  return (
                                    <div className="my-3 rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/10">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                                          <Code size={14} />
                                          Minecraft {fileType.toUpperCase()} Export
                                        </div>
                                        <button
                                          onClick={() => handleDownloadMinecraftExport(codeString, fileType)}
                                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors shadow-sm ml-auto"
                                        >
                                          <span className="text-sm font-black leading-none">↓</span>
                                          <span>Download .{fileType}</span>
                                        </button>
                                      </div>
                                      <div className="p-3 text-xs font-mono text-[#a8c7fa] overflow-x-auto max-h-40 whitespace-pre-wrap">
                                        {codeString.length > 500 ? `${codeString.substring(0, 500)}... (truncated for preview)` : codeString}
                                      </div>
                                    </div>
                                  );
                                }

                                if (!inline && (match || codeString.includes('\n'))) {
                                  return (
                                    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-lg">
                                      <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 border-b border-white/10 text-xs text-[#8e918f]">
                                        <div className="flex items-center gap-2">
                                          <Code size={13} className="text-blue-400" />
                                          <span className="font-mono uppercase font-bold text-[10px] text-white/70">
                                            {lang || 'code'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {isRunnable && (
                                            <button
                                              onClick={() => handleRunCode(codeString, lang)}
                                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 text-[11px] font-semibold transition-colors cursor-pointer"
                                              title="Run interactive preview / play game"
                                            >
                                              <MonitorPlay size={12} />
                                              <span>Run Game / Sandbox</span>
                                            </button>
                                          )}

                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(codeString);
                                              setCopiedCodeIndex(`${mIdx}-${codeString.slice(0, 10)}`);
                                              setTimeout(() => setCopiedCodeIndex(null), 2000);
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[#c4c7c5] hover:text-white text-[11px] transition-colors cursor-pointer"
                                            title="Copy code"
                                          >
                                            {copiedCodeIndex === `${mIdx}-${codeString.slice(0, 10)}` ? (
                                              <>
                                                <Check size={12} className="text-green-400" />
                                                <span className="text-green-400">Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy size={12} />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="p-3.5 overflow-x-auto font-mono text-xs text-white/90 leading-relaxed custom-scrollbar">
                                        <pre className="!m-0 !p-0 bg-transparent">
                                          <code>{codeString}</code>
                                        </pre>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.content || ''}
                          </Markdown>

                          {/* Direct image render fallback if not already rendered inside Markdown */}
                          {msg.imageUrl && !(typeof msg.content === 'string' && msg.content.includes(msg.imageUrl)) && (
                            <div className="mt-3">
                              <ChatImageCard 
                                src={msg.imageUrl} 
                                alt={msg.imagePrompt || "INFBOTT AI Image"} 
                                prompt={msg.imagePrompt}
                                onRegenerate={handleRegenerateImage}
                                onOpenGallery={() => setIsGalleryOpen(true)}
                                onUseAsWatermark={handleUseAsWatermark}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clean typing indicator while waiting for first token */}
                      {isLoading && msg.role === 'assistant' && !msg.isImageGenerationLoading && mIdx === displayMessages.length - 1 && !msg.content && (
                        <div className="flex items-center gap-1.5 py-1 px-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:200ms]" />
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:400ms]" />
                        </div>
                      )}

                      {/* Grounding Web Citations & Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8e918f] uppercase tracking-wider">
                            <Globe size={11} className="text-blue-400" />
                            <span>Web Sources & Grounding</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <a 
                                key={`src-${sIdx}`}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] transition-colors"
                              >
                                <span className="truncate max-w-[200px]">{src.title || src.url}</span>
                                <ExternalLink size={10} className="shrink-0 opacity-70" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant Response Footer: Generation Time, Estimated Reading Time & Reaction Buttons */}
                      {msg.role === 'assistant' && (msg.content || msg.imageUrl) && (!isLoading || mIdx !== displayMessages.length - 1) && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8e918f] select-none">
                          <div className="flex items-center gap-3">
                            {msg.generationTimeMs !== undefined && (
                              <span className="flex items-center gap-1 font-mono text-[#4285f4] font-medium" title="AI Generation Latency">
                                <Zap size={11} className="text-[#4285f4]" />
                                <span>
                                  {msg.generationTimeMs >= 1000 
                                    ? `${(msg.generationTimeMs / 1000).toFixed(2)}s` 
                                    : `${Math.round(msg.generationTimeMs)}ms`}
                                </span>
                              </span>
                            )}

                            <span className="flex items-center gap-1 text-[#8e918f]" title="Estimated Reading Time">
                              <BookOpen size={11} className="text-emerald-400" />
                              <span>{calculateReadingTime(msg.content || '').formatted}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Firestore Reaction Buttons */}
                            <button
                              onClick={() => handleReaction(msg.id, 'thumbs_up')}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer",
                                msg.reaction === 'thumbs_up' 
                                  ? "bg-blue-500/20 text-blue-400" 
                                  : "hover:bg-white/10 text-[#8e918f] hover:text-white"
                              )}
                              title="Helpful (Like)"
                            >
                              <ThumbsUp size={12} className={msg.reaction === 'thumbs_up' ? "fill-blue-400" : ""} />
                            </button>

                            <button
                              onClick={() => handleReaction(msg.id, 'heart')}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer",
                                msg.reaction === 'heart' 
                                  ? "bg-rose-500/20 text-rose-400" 
                                  : "hover:bg-white/10 text-[#8e918f] hover:text-white"
                              )}
                              title="Loved this response (Heart)"
                            >
                              <Heart size={12} className={msg.reaction === 'heart' ? "fill-rose-400" : ""} />
                            </button>

                            <button
                              onClick={() => handleReaction(msg.id, 'thumbs_down')}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer",
                                msg.reaction === 'thumbs_down' 
                                  ? "bg-amber-500/20 text-amber-400" 
                                  : "hover:bg-white/10 text-[#8e918f] hover:text-white"
                              )}
                              title="Needs improvement (Dislike)"
                            >
                              <ThumbsDown size={12} className={msg.reaction === 'thumbs_down' ? "fill-amber-400" : ""} />
                            </button>

                            {msg.timestamp && (
                              <span className="ml-1.5 flex items-center gap-1 text-[10px] text-white/40">
                                <Clock size={10} className="text-white/30" />
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* User Message Footer: Timestamp */}
                      {msg.role === 'user' && msg.timestamp && (
                        <div className="mt-2 text-right text-[10px] text-white/40 select-none">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}

                      {/* Message Hover Actions */}
                      <div className={cn(
                        "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#1e1f20] p-1 rounded-xl border border-white/10 shadow-lg z-20",
                        msg.role === 'user' ? "right-full mr-2" : "right-2"
                      )}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content || msg.imageUrl || '');
                            setCopiedId(msg.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                        </button>

                        {msg.role === 'assistant' && (
                          <>
                            <button 
                              onClick={() => {
                                handleSaveSnippet(msg.content, 'amber', 'Key Point');
                                setIsNotebookOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-amber-500/20 text-[#8e918f] hover:text-amber-300 transition-colors"
                              title="Save to Personal Notebook"
                            >
                              <Highlighter size={13} />
                            </button>
                            <button 
                              onClick={() => playVoiceResponse(msg.content)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                              title="Read aloud"
                            >
                              <Volume2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleSummarizeMessage(msg.content)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                              title="Summarize point"
                            >
                              <FileText size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white shadow-md">
                        {profileData.avatar}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading State Animation */}
                {isLoading && (
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles size={14} className="text-white animate-spin" />
                    </div>
                    <div className="bg-[#1e1f20]/90 border border-white/5 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#4285f4] rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-xs text-[#8e918f]">{aiStatus}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Highlight Menu for Notebook */}
        {floatingMenuPos && (
          <HighlightFloatingMenu 
            position={floatingMenuPos}
            selectedText={selectedSnippetText}
            onSave={(text, color, tag, note) => {
              handleSaveSnippet(text, color, tag, note);
              setFloatingMenuPos(null);
            }}
            onClose={() => setFloatingMenuPos(null)}
          />
        )}

        {/* Input Bar */}
        <InputBar 
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          attachments={attachments}
          setAttachments={setAttachments}
          isToolsMenuOpen={isToolsMenuOpen}
          setIsToolsMenuOpen={setIsToolsMenuOpen}
          isPlusMenuOpen={isPlusMenuOpen}
          setIsPlusMenuOpen={setIsPlusMenuOpen}
          isSearchEnabled={isSearchEnabled}
          setIsSearchEnabled={setIsSearchEnabled}
          isVoiceEnabled={isVoiceEnabled}
          setIsVoiceEnabled={setIsVoiceEnabled}
          setIsNotebookOpen={setIsNotebookOpen}
          handleAction={handleAction}
          handleSummarizeChat={handleSummarizeChat}
          setIsFeedbackModalOpen={setIsFeedbackModalOpen}
          currentSessionId={currentSessionId}
        />
      </main>

      {/* Modals */}
      <CodePreviewModal 
        isOpen={codeSandboxData.isOpen}
        onClose={() => setCodeSandboxData(prev => ({ ...prev, isOpen: false }))}
        code={codeSandboxData.code}
        language={codeSandboxData.language}
        title={codeSandboxData.title}
      />

      <NotebookModal 
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        snippets={notebookSnippets}
        onDeleteSnippet={handleDeleteSnippet}
        onUpdateSnippet={handleUpdateSnippet}
        onSendToChat={(snippetText) => {
          setIsNotebookOpen(false);
          handleSend(`Regarding this note from my notebook:\n\n"${snippetText}"\n\n`);
        }}
      />

      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

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

      <SettingsView 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profileData={profileData}
        setProfileData={setProfileData}
        memories={memories}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
        sessions={sessions}
        onClearAllSessions={async () => {
          for (const s of sessions) {
            await handleDeleteSession(s.id);
          }
          setSessions([]);
        }}
        userCredits={userCredits}
        onOpenTopUp={() => setIsTopUpModalOpen(true)}
        onSignOut={async () => {
          await signOut(auth);
          setIsProfileModalOpen(false);
        }}
      />

      <CloudConsole 
        isOpen={isCloudConsoleOpen}
        onClose={() => setIsCloudConsoleOpen(false)}
      />

      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={sessionImages}
        onRegenerate={handleRegenerateImage}
      />

      <CreditTopUpModal 
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        userCredits={userCredits}
        onTopUpSuccess={(newCredits) => {
          setUserCredits(newCredits);
          setIsLowCreditDismissed(false);
        }}
        user={user}
      />
    </div>
  );
}

export default App;
