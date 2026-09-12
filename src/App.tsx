import React, { useState, useRef, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  getChatResponseStream, 
  ModelType, 
  summarizeContent, 
  generateChatTitle 
} from './services/geminiService';
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
import { Message, Attachment, NotebookSnippet, SnippetColor, GroundingSource } from './types';
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
  const [profileData, setProfileData] = useState({
    fullName: 'Explorer',
    email: '',
    avatar: 'I',
    avatarUrl: ''
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

      setProfileData({
        fullName: activeName,
        email: activeEmail,
        avatar: activeInitial,
        avatarUrl: activeAvatarUrl
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
          setMessages(JSON.parse(localMsgs));
        } catch (e) {}
      }
      return;
    }

    const q = query(
      collection(db, `sessions/${currentSessionId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
      try {
        localStorage.setItem(`infbott_messages_${currentSessionId}`, JSON.stringify(msgs));
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
    if (user?.uid) {
      try {
        await deleteDoc(doc(db, 'sessions', id));
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    }
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('infbott_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  // Send Message
  const handleSend = async (text: string | any = input) => {
    if (typeof text !== 'string') {
      text = input;
    }
    const trimmedText = text.trim();
    if ((!trimmedText && attachments.length === 0) || isLoading) return;

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

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: trimmedText,
      attachments: [...attachments],
      timestamp: Date.now(),
    };

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: startTime,
      sources: []
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
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
        isSearchEnabled
      );

      let lastUpdateTime = Date.now();
      for await (const chunk of stream) {
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
      const endTime = Date.now();
      const genTime = endTime - startTime;
      
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

      if (isVoiceEnabled && fullContent) {
        playVoiceResponse(fullContent);
      }
    } catch (error: any) {
      console.error('Error in handleSend:', error);
      let errorMessage = error?.message || 'Sorry, I encountered an error.';
      
      try {
        if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
          }
          if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
            const innerParsed = JSON.parse(errorMessage);
            if (innerParsed.error && innerParsed.error.message) {
              errorMessage = innerParsed.error.message;
            }
          }
        }
      } catch (e) {
        // Fallback to original message if not valid JSON
      }

      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? {
          ...m,
          content: `⚠️ **INFBOTT Error:** ${errorMessage}\n\n*Please verify your connection and try again.*`
        } : m)
      );
    } finally {
      setIsLoading(false);
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

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentSessionTitle = currentSession?.title || 'New Conversation';

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] overflow-hidden font-sans select-text relative">
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
        />

        {/* Messages Stream View */}
        <div 
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          className="flex-1 overflow-y-auto px-3 sm:px-6 custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center mx-auto shadow-2xl border border-white/10">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent"
                  >
                    Hi {profileData?.fullName?.split(' ')[0] || 'there'}, how can INFBOTT help?
                  </motion.h2>
                  <p className="text-[#8e918f] text-sm max-w-lg mx-auto">
                    Advanced software development, Minecraft world/schematic generation, and 3D modeling.
                  </p>
                  <p className="text-[#4285f4] text-xs font-medium">
                    नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ? (Hindi & Hinglish supported)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, mIdx) => (
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[88%] rounded-2xl p-4 text-sm group relative shadow-sm",
                      msg.role === 'user' 
                        ? "bg-[#252629] text-white border border-white/10" 
                        : "bg-[#1e1f20]/90 text-[#e3e3e3] border border-white/5"
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
                                <img src={att.data} alt="uploaded" className="w-8 h-8 object-cover rounded" />
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

                      {/* Markdown text with customized code blocks */}
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
                        <Markdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const lang = match ? match[1] : '';
                              const isRunnable = isCodeRunnable(lang, codeString);

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
                          {msg.content}
                        </Markdown>
                      </div>

                      {/* Loading Status - Numbers Only */}
                      {isLoading && msg.role === 'assistant' && mIdx === messages.length - 1 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-[#4285f4] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={10} className="animate-pulse" />
                              Generating response...
                            </span>
                            <span className="text-[12px] font-bold text-[#4285f4] font-mono">
                              {Math.min(99, Math.max(1, Math.floor((msg.content.length / (msg.content.length + 300)) * 100)))}%
                            </span>
                          </div>
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

                      {/* Message Hover Actions */}
                      <div className={cn(
                        "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#1e1f20] p-1 rounded-xl border border-white/10 shadow-lg z-20",
                        msg.role === 'user' ? "right-full mr-2" : "right-2"
                      )}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
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
                      <span className="text-xs text-[#8e918f]">INFBOTT is thinking...</span>
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

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        profileData={profileData}
        setProfileData={setProfileData}
        onSignOut={async () => {
          await signOut(auth);
          setIsProfileModalOpen(false);
        }}
        onOpenCloudConsole={() => {
          setIsProfileModalOpen(false);
          setIsCloudConsoleOpen(true);
        }}
      />

      <CloudConsole 
        isOpen={isCloudConsoleOpen}
        onClose={() => setIsCloudConsoleOpen(false)}
      />
    </div>
  );
}

export default App;
