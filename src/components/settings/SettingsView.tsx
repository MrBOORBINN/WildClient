import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  User, 
  Briefcase, 
  Sparkles, 
  Sliders, 
  Brain, 
  Puzzle, 
  Code2, 
  Monitor, 
  BarChart3, 
  Bell, 
  Mic, 
  Shield, 
  Key, 
  HardDrive, 
  EyeOff, 
  History, 
  ShieldCheck, 
  LogOut, 
  Check, 
  X, 
  AlertTriangle, 
  Download, 
  Trash2, 
  RefreshCw, 
  Volume2, 
  Info,
  Camera,
  ExternalLink,
  Zap,
  Lock,
  Mail,
  FileText
} from 'lucide-react';
import { UserSettings, Memory, UserProfileData, Session } from '../../types';
import { getLocalSettings, updateRemoteSettingsCategory } from '../../services/settingsService';
import { auth } from '../../firebase';
import { sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';

export type SettingsPageId = 
  | 'menu'
  | 'account'
  | 'workspace'
  | 'premium'
  | 'personalization'
  | 'memory'
  | 'plugins'
  | 'codex'
  | 'general'
  | 'usage'
  | 'notifications'
  | 'voice'
  | 'safety'
  | 'security'
  | 'storage'
  | 'privacy'
  | 'history'
  | 'ads';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profileData: UserProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
  onSignOut: () => void;
  userCredits?: number;
  onOpenTopUp?: () => void;
  memories?: Memory[];
  onDeleteMemory?: (id: string) => void;
  onClearAllMemories?: () => void;
  sessions?: Session[];
  onClearAllSessions?: () => void;
  onSelectSession?: (id: string | number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isOpen,
  onClose,
  user,
  profileData,
  setProfileData,
  onSignOut,
  userCredits = 70,
  onOpenTopUp,
  memories = [],
  onDeleteMemory,
  onClearAllMemories,
  sessions = [],
  onClearAllSessions,
}) => {
  const [activePage, setActivePage] = useState<SettingsPageId>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<UserSettings>(getLocalSettings());
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync settings helper
  const handleUpdate = async <K extends keyof UserSettings>(
    category: K, 
    values: Partial<UserSettings[K]>,
    toastMsg?: string
  ) => {
    const userId = user?.uid || user?.id || 'guest';
    const updated = await updateRemoteSettingsCategory(userId, category, values);
    setSettings(updated);
    if (toastMsg) {
      setSaveToast(toastMsg);
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  // Search items registry
  const searchItems = useMemo(() => {
    return [
      { id: 'account', title: 'Account Profile', desc: 'Display name, avatar, email, UID', icon: User, keywords: 'name profile picture avatar photo email uid' },
      { id: 'workspace', title: 'Personal Workspace', desc: 'Workspace name, autosave, sync frequency', icon: Briefcase, keywords: 'workspace autosave sync backup' },
      { id: 'premium', title: 'INFBOTT Premium', desc: 'Credits, subscription status, models', icon: Sparkles, keywords: 'premium pro subscription credits billing plans' },
      { id: 'personalization', title: 'AI Personalization', desc: 'Response style, languages, custom instructions', icon: Sliders, keywords: 'personality style instructions hinglish tone length' },
      { id: 'memory', title: 'Memory System', desc: 'Enable/disable, saved memories, memory clear', icon: Brain, keywords: 'memory context recall facts remember delete' },
      { id: 'plugins', title: 'Plugins & Tools', desc: 'Google Search, Code Sandbox, Vision, Image Studio', icon: Puzzle, keywords: 'plugins tools web search google code sandbox vision' },
      { id: 'codex', title: 'Codex & Developer', desc: 'Default language, formatting, code runner', icon: Code2, keywords: 'codex coding programming typescript python auto run' },
      { id: 'general', title: 'General & Appearance', desc: 'Pure black theme, sound effects, font size', icon: Monitor, keywords: 'theme pure black dark sound enter key accessibility' },
      { id: 'usage', title: 'Usage & Limits', desc: 'Message metrics, model usage, credit consumption', icon: BarChart3, keywords: 'usage limits stats metrics tokens messages' },
      { id: 'notifications', title: 'Notifications', desc: 'Chat alerts, security notices, permissions', icon: Bell, keywords: 'notifications alerts push sound web' },
      { id: 'voice', title: 'Voice & Speech', desc: 'Speech voice, speech rate, preview, microphone', icon: Mic, keywords: 'voice speech audio mic tts speed sound' },
      { id: 'safety', title: 'Safety & Guardrails', desc: 'Content filtering, safe search, injection protection', icon: Shield, keywords: 'safety content moderation filter guardrails' },
      { id: 'security', title: 'Security & Login', desc: 'Password reset, email verification, active sessions', icon: Key, keywords: 'security password email verify login auth' },
      { id: 'storage', title: 'File Storage', desc: 'Uploaded files list, storage space, delete files', icon: HardDrive, keywords: 'storage files uploads mb bytes cache' },
      { id: 'privacy', title: 'Privacy Center', desc: 'Export all data, account deletion request', icon: EyeOff, keywords: 'privacy export json download data delete account' },
      { id: 'history', title: 'History & Conversations', desc: 'Chat history management, export conversations', icon: History, keywords: 'history chats export pdf markdown clear' },
      { id: 'ads', title: 'Ads Controls', desc: '100% ad-free experience guarantee', icon: ShieldCheck, keywords: 'ads tracking privacy advertising free' },
    ];
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchItems.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) || 
      item.keywords.includes(q)
    );
  }, [searchQuery, searchItems]);

  // Voice test
  const handleTestVoice = (voiceName: string, rate: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hello! I am INFBOTT, your ultra-fast intelligent assistant.");
      utterance.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
      if (match) utterance.voice = match;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Notification request
  const handleRequestNotification = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        handleUpdate('notifications', { enabled: true }, 'Notifications enabled!');
        new Notification("INFBOTT", { body: "Notifications are successfully enabled." });
      } else {
        handleUpdate('notifications', { enabled: false });
        setActionError("Notification permission was denied in your browser settings.");
      }
    } else {
      setActionError("This browser does not support Web Notifications.");
    }
  };

  // Export full account data as JSON
  const handleExportAllData = () => {
    const fullData = {
      exportedAt: new Date().toISOString(),
      user: {
        uid: user?.uid || 'guest',
        email: user?.email || profileData.email,
        displayName: profileData.fullName || user?.displayName,
      },
      settings,
      memories,
      sessionsCount: sessions.length,
      sessions: sessions.map(s => ({ id: s.id, title: s.title, createdAt: s.created_at })),
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INFBOTT-Account-Export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveToast("Account data exported successfully!");
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Password reset email
  const handleSendPasswordReset = async () => {
    const targetEmail = user?.email || profileData.email;
    if (!targetEmail) {
      setActionError("No email address associated with this account.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setSaveToast(`Password reset link sent to ${targetEmail}`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setActionError(err?.message || "Failed to send password reset email.");
    }
  };

  // Email verification
  const handleSendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        setSaveToast("Verification email sent! Check your inbox.");
        setTimeout(() => setSaveToast(null), 3000);
      } catch (err: any) {
        setActionError(err?.message || "Failed to send verification email.");
      }
    } else {
      setActionError("You must be signed in to verify your email.");
    }
  };

  // Avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setActionError("File exceeds 5MB limit. Please choose a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileData((prev: any) => ({ ...prev, avatarUrl: base64 }));
        handleUpdate('account', { avatarUrl: base64 }, "Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-[150] px-5 py-3 rounded-full bg-[#2C2C2C] border border-[#414141] text-white text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <Check size={16} className="text-[#34a853]" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {actionError && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1A1A1A] border border-[#414141] rounded-2xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-white">Notice</h3>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">{actionError}</p>
              <button 
                onClick={() => setActionError(null)}
                className="w-full py-2.5 bg-[#2C2C2C] hover:bg-[#383838] border border-[#414141] rounded-xl text-xs font-bold text-white transition-colors"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation */}
      <AnimatePresence>
        {logoutConfirmOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1A1A1A] border border-[#414141] rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <LogOut size={22} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-white">Log out of INFBOTT?</h3>
                <p className="text-xs text-[#A0A0A0] mt-1">Your saved chats, custom instructions, and memories remain secure on the cloud.</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={() => setLogoutConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#414141] bg-[#2C2C2C] hover:bg-[#383838] text-xs font-semibold text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setLogoutConfirmOpen(false);
                    onClose();
                    onSignOut();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow-lg shadow-red-600/20"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Settings Frame */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-2xl h-[92vh] max-h-[850px] bg-[#000000] border border-[#414141] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-[#414141] flex items-center justify-between shrink-0 bg-[#000000]">
          <div className="w-10">
            {activePage !== 'menu' ? (
              <button 
                onClick={() => setActivePage('menu')}
                className="p-2 -ml-2 rounded-full hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="p-2 -ml-2 rounded-full hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <h1 className="text-base font-bold tracking-tight text-white capitalize text-center">
            {activePage === 'menu' ? 'Settings' : activePage.replace('_', ' ')}
          </h1>

          <div className="w-10 flex justify-end">
            <button 
              onClick={() => setInfoModalOpen(true)}
              className="p-2 -mr-2 rounded-full hover:bg-[#1A1A1A] text-[#A0A0A0] hover:text-white transition-colors"
              title="System Information"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {activePage === 'menu' ? (
            <>
              {/* Search Settings Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#111111] border border-[#414141] text-xs text-white placeholder-[#A0A0A0] focus:outline-none focus:border-[#9b72cb] transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtered Search Results View */}
              {searchQuery.trim() ? (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-1">
                    Search Results ({filteredItems.length})
                  </div>
                  {filteredItems.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#A0A0A0] bg-[#111111] rounded-2xl border border-[#414141]/50">
                      No settings matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                      {filteredItems.map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActivePage(item.id as SettingsPageId);
                              setSearchQuery('');
                            }}
                            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#383838] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-white">{item.title}</div>
                                <div className="text-[11px] text-[#A0A0A0]">{item.desc}</div>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-[#A0A0A0]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Grouped Settings Panels matching Reference Screenshots */
                <div className="space-y-6">
                  {/* Group 1: ACCOUNT & WORKSPACE */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-2">Account</div>
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                      {/* Account item */}
                      <button 
                        onClick={() => setActivePage('account')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#9b72cb] flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                            {settings.account.avatarUrl || profileData.avatarUrl ? (
                              <img src={settings.account.avatarUrl || profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              (profileData.fullName || user?.displayName || 'U')[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{profileData.fullName || user?.displayName || settings.account.displayName}</div>
                            <div className="text-[11px] text-[#A0A0A0] truncate">{user?.email || profileData.email || settings.account.email}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0] shrink-0" />
                      </button>

                      {/* Workspace item */}
                      <button 
                        onClick={() => setActivePage('workspace')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Workspace</div>
                            <div className="text-[11px] text-[#A0A0A0]">{settings.workspace.name}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>
                    </div>
                  </div>

                  {/* Group 2: SUBSCRIPTION */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-2">Subscription</div>
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl overflow-hidden">
                      <button 
                        onClick={() => setActivePage('premium')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#9b72cb]/20 text-[#9b72cb] flex items-center justify-center">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>INFBOTT Premium</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#9b72cb]/20 text-[#9b72cb] font-mono uppercase">
                                {settings.premium.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#A0A0A0]">{userCredits} credits remaining</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>
                    </div>
                  </div>

                  {/* Group 3: PREFERENCES & TOOLS */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-2">Preferences</div>
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                      <button 
                        onClick={() => setActivePage('personalization')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Sliders size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Personalization</div>
                            <div className="text-[11px] text-[#A0A0A0]">AI style, languages, custom instructions</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('memory')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Brain size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Memory</div>
                            <div className="text-[11px] text-[#A0A0A0]">{settings.memory.enabled ? `${memories.length} memories stored` : 'Disabled'}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('plugins')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Puzzle size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Plugins & Tools</div>
                            <div className="text-[11px] text-[#A0A0A0]">Search grounding, code sandbox, image studio</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('codex')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Code2 size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Codex & Developer</div>
                            <div className="text-[11px] text-[#A0A0A0]">Language: {settings.codex.defaultLanguage}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('general')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Monitor size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">General Settings</div>
                            <div className="text-[11px] text-[#A0A0A0]">Pure black theme, sound, typography</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>
                    </div>
                  </div>

                  {/* Group 4: METRICS & HARDWARE */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-2">Metrics & Controls</div>
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                      <button 
                        onClick={() => setActivePage('usage')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <BarChart3 size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Usage and Limits</div>
                            <div className="text-[11px] text-[#A0A0A0]">Real-time message and credit tracking</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('notifications')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Bell size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Notifications</div>
                            <div className="text-[11px] text-[#A0A0A0]">{settings.notifications.enabled ? 'Enabled' : 'Disabled'}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('voice')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Mic size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Voice Settings</div>
                            <div className="text-[11px] text-[#A0A0A0]">Voice: {settings.voice.voiceName} ({settings.voice.speechRate}x)</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('safety')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Shield size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Safety Settings</div>
                            <div className="text-[11px] text-[#A0A0A0]">Content protection & prompt shield</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>
                    </div>
                  </div>

                  {/* Group 5: PRIVACY & SECURITY */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider px-2">Data & Security</div>
                    <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                      <button 
                        onClick={() => setActivePage('security')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <Key size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Security and Login</div>
                            <div className="text-[11px] text-[#A0A0A0]">Password, verification, sessions</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('storage')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <HardDrive size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Storage</div>
                            <div className="text-[11px] text-[#A0A0A0]">Uploaded files & cache management</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('privacy')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <EyeOff size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Privacy Center</div>
                            <div className="text-[11px] text-[#A0A0A0]">Export data, privacy controls</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('history')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <History size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">History and Data</div>
                            <div className="text-[11px] text-[#A0A0A0]">{sessions.length} conversations stored</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>

                      <button 
                        onClick={() => setActivePage('ads')}
                        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#383838] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Ads Controls</div>
                            <div className="text-[11px] text-[#A0A0A0]">Zero ads, zero third-party tracking</div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-[#A0A0A0]" />
                      </button>
                    </div>
                  </div>

                  {/* Group 6: LOG OUT */}
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-red-500/10 transition-colors text-left text-red-400 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                          <LogOut size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-red-400 group-hover:text-red-300">Log out</div>
                          <div className="text-[11px] text-[#A0A0A0]">Sign out from this device</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-red-400/50 group-hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Sub-Pages Renderer */
            <div className="space-y-6">
              {/* ACCOUNT SUB-PAGE */}
              {activePage === 'account' && (
                <div className="space-y-6">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#9b72cb] flex items-center justify-center font-bold text-xl text-white overflow-hidden shadow-lg">
                          {settings.account.avatarUrl || profileData.avatarUrl ? (
                            <img src={settings.account.avatarUrl || profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (profileData.fullName || user?.displayName || 'U')[0]?.toUpperCase()
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleAvatarChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1A1A1A] border border-[#414141] text-white hover:bg-[#383838] transition-colors"
                          title="Change Profile Photo"
                        >
                          <Camera size={12} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{profileData.fullName || user?.displayName || 'User'}</h3>
                        <p className="text-xs text-[#A0A0A0] truncate">{user?.email || profileData.email || 'guest@infbott.ai'}</p>
                        <span className="inline-block mt-1 text-[10px] text-[#9b72cb] bg-[#9b72cb]/20 px-2 py-0.5 rounded font-mono">
                          {user?.uid ? `UID: ${user.uid.slice(0, 10)}...` : 'Guest Session'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#414141]">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Display Name</label>
                        <input 
                          type="text" 
                          value={profileData.fullName || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfileData((prev: any) => ({ ...prev, fullName: val }));
                          }}
                          placeholder="Your display name"
                          className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none focus:border-[#9b72cb]"
                        />
                      </div>

                      <button 
                        onClick={() => {
                          handleUpdate('account', { displayName: profileData.fullName }, "Display name updated!");
                        }}
                        className="w-full py-2.5 bg-[#9b72cb] hover:bg-[#8a5bbd] text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-[#9b72cb]/20"
                      >
                        Save Profile Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKSPACE SUB-PAGE */}
              {activePage === 'workspace' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Workspace Title</label>
                      <input 
                        type="text" 
                        value={settings.workspace.name} 
                        onChange={(e) => handleUpdate('workspace', { name: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none focus:border-[#9b72cb]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Autosave Conversations</div>
                        <div className="text-[11px] text-[#A0A0A0]">Automatically commit turns to Firestore</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.workspace.autosave} 
                        onChange={(e) => handleUpdate('workspace', { autosave: e.target.checked }, "Autosave updated")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Default Export Format</label>
                      <select 
                        value={settings.workspace.defaultExportFormat}
                        onChange={(e) => handleUpdate('workspace', { defaultExportFormat: e.target.value as any }, "Export format set")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="markdown">Markdown (.md)</option>
                        <option value="json">JSON Structured Data (.json)</option>
                        <option value="pdf">Formatted PDF Document (.pdf)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PREMIUM SUB-PAGE */}
              {activePage === 'premium' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A] border border-[#9b72cb]/40 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-[#9b72cb]" />
                        <h3 className="text-sm font-bold text-white">INFBOTT Premium Access</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#9b72cb]/20 text-[#9b72cb] text-[10px] font-mono font-bold uppercase">
                        {settings.premium.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#A0A0A0] leading-relaxed">
                      Enjoy lightning-fast real-time responses, full multi-file analysis, canvas image editing, and code compilation sandboxes.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-[#111111] rounded-xl border border-[#414141]">
                        <div className="text-[10px] text-[#A0A0A0] uppercase font-bold">Available Credits</div>
                        <div className="text-xl font-bold text-white mt-1">{userCredits}</div>
                      </div>
                      <div className="p-3 bg-[#111111] rounded-xl border border-[#414141]">
                        <div className="text-[10px] text-[#A0A0A0] uppercase font-bold">Model Quota Tier</div>
                        <div className="text-xl font-bold text-[#34a853] mt-1">Free & Fast</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        onClose();
                        onOpenTopUp?.();
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-[#9b72cb] to-[#4285f4] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-[#9b72cb]/20"
                    >
                      Top Up Image Generation Credits
                    </button>
                  </div>
                </div>
              )}

              {/* PERSONALIZATION SUB-PAGE */}
              {activePage === 'personalization' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">AI Response Style</label>
                      <select 
                        value={settings.personalization.aiStyle}
                        onChange={(e) => handleUpdate('personalization', { aiStyle: e.target.value as any }, "Response style updated")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="balanced">Balanced & Thoughtful (Recommended)</option>
                        <option value="concise">Concise & Direct (Speed-first)</option>
                        <option value="detailed">Comprehensive & Academic</option>
                        <option value="coding">Code Specialist (Implementation-first)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Language Preference</label>
                      <select 
                        value={settings.personalization.language}
                        onChange={(e) => handleUpdate('personalization', { language: e.target.value as any }, "Language preference updated")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="english">English (Standard)</option>
                        <option value="hinglish">Hinglish (Natural Hindi + English mix)</option>
                        <option value="hindi">Hindi (हिंदी)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Custom System Instructions</label>
                      <textarea 
                        rows={4}
                        value={profileData.customSystemInstructions || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProfileData((prev: any) => ({ ...prev, customSystemInstructions: val }));
                          try {
                            localStorage.setItem('infbott_custom_system_instructions', val);
                          } catch (err) {}
                        }}
                        placeholder="What would you like INFBOTT to know about you to provide better responses?"
                        className="w-full p-3 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white placeholder-[#A0A0A0] focus:outline-none focus:border-[#9b72cb] custom-scrollbar"
                      />
                    </div>

                    <button 
                      onClick={() => handleUpdate('personalization', { customInstructions: profileData.customSystemInstructions || '' }, "Instructions saved!")}
                      className="w-full py-2.5 bg-[#9b72cb] hover:bg-[#8a5bbd] text-white font-bold text-xs rounded-xl transition-colors"
                    >
                      Save Custom Instructions
                    </button>
                  </div>
                </div>
              )}

              {/* MEMORY SUB-PAGE */}
              {activePage === 'memory' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Enable Long-Term Memory</div>
                        <div className="text-[11px] text-[#A0A0A0]">Allow INFBOTT to remember important facts across chats</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.memory.enabled}
                        onChange={(e) => handleUpdate('memory', { enabled: e.target.checked }, "Memory setting updated")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">
                        Saved Memories ({memories.length})
                      </span>
                      {memories.length > 0 && onClearAllMemories && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to clear all saved memories? This cannot be undone.")) {
                              onClearAllMemories();
                              setSaveToast("All memories cleared!");
                              setTimeout(() => setSaveToast(null), 2500);
                            }
                          }}
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {memories.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#A0A0A0] bg-[#111111] rounded-2xl border border-[#414141]/50">
                        No memories saved yet. Talk to INFBOTT and it will automatically remember key facts!
                      </div>
                    ) : (
                      <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                        {memories.map((m, idx) => (
                          <div key={m.id || `mem-${idx}`} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#383838] transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white leading-relaxed">{m.memory}</p>
                              <span className="text-[10px] text-[#A0A0A0] font-mono mt-1 block">
                                {m.category} · {new Date(m.created_at || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            {onDeleteMemory && m.id && (
                              <button 
                                onClick={() => {
                                  onDeleteMemory(m.id!);
                                  setSaveToast("Memory deleted");
                                  setTimeout(() => setSaveToast(null), 2000);
                                }}
                                className="p-1.5 text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Memory"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PLUGINS SUB-PAGE */}
              {activePage === 'plugins' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl divide-y divide-[#414141] overflow-hidden">
                    {[
                      { key: 'webGrounding', label: 'Google Search Grounding', desc: 'Real-time live web facts & verified citations', icon: ExternalLink },
                      { key: 'codeSandbox', label: 'Code & Game Runner Sandbox', desc: 'In-browser JS/HTML5 execution and playable games', icon: Code2 },
                      { key: 'documentVision', label: 'Vision & Document Extraction', desc: 'Parse images, PDFs, CSVs, and markdown', icon: FileText },
                      { key: 'imageStudio', label: 'Image Studio & Canvas Editor', desc: 'AI visual generation and direct pixel manipulation', icon: Sparkles },
                      { key: 'minecraftEngine', label: 'Minecraft Engineering System', desc: 'Command blocks, datapacks, and schematics', icon: Zap },
                    ].map(plugin => {
                      const Icon = plugin.icon;
                      const isEnabled = (settings.plugins as any)[plugin.key];
                      return (
                        <div key={plugin.key} className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-white">
                              <Icon size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{plugin.label}</div>
                              <div className="text-[11px] text-[#A0A0A0]">{plugin.desc}</div>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isEnabled} 
                            onChange={(e) => handleUpdate('plugins', { [plugin.key]: e.target.checked } as any, `${plugin.label} updated`)}
                            className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CODEX SUB-PAGE */}
              {activePage === 'codex' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Preferred Programming Language</label>
                      <select 
                        value={settings.codex.defaultLanguage}
                        onChange={(e) => handleUpdate('codex', { defaultLanguage: e.target.value }, "Default language set")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="TypeScript">TypeScript (Modern Typed JS)</option>
                        <option value="Python">Python (Data, Scripts & AI)</option>
                        <option value="JavaScript">JavaScript (ESNext)</option>
                        <option value="C++">C++ (Systems & Games)</option>
                        <option value="HTML/CSS">HTML5 & Tailwind CSS</option>
                        <option value="SQL">PostgreSQL / SQL</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Auto-Run Code Sandboxes</div>
                        <div className="text-[11px] text-[#A0A0A0]">Immediately render preview when code finishes generation</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.codex.autoRunCode} 
                        onChange={(e) => handleUpdate('codex', { autoRunCode: e.target.checked }, "Code runner preference saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Show Code Line Numbers</div>
                        <div className="text-[11px] text-[#A0A0A0]">Display gutter numbering in code blocks</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.codex.showLineNumbers} 
                        onChange={(e) => handleUpdate('codex', { showLineNumbers: e.target.checked }, "Line numbers updated")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GENERAL SUB-PAGE */}
              {activePage === 'general' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Color Theme</label>
                      <select 
                        value={settings.general.theme}
                        onChange={(e) => handleUpdate('general', { theme: e.target.value as any }, "Theme applied")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="pure-black">Pure Black OLED (#000000 - Default)</option>
                        <option value="liquid-oled">Liquid Glow (Subtle ambient light)</option>
                        <option value="high-contrast">High Contrast (Max accessibility)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">UI Sound Effects</div>
                        <div className="text-[11px] text-[#A0A0A0]">Subtle audio cues for send, receive, and completions</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.general.soundEnabled} 
                        onChange={(e) => handleUpdate('general', { soundEnabled: e.target.checked }, "Sound preferences saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Enter to Send Message</div>
                        <div className="text-[11px] text-[#A0A0A0]">Press Enter to send, Shift+Enter for new line</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.general.enterSendsMessage} 
                        onChange={(e) => handleUpdate('general', { enterSendsMessage: e.target.checked }, "Keyboard behavior saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Reduced Motion</div>
                        <div className="text-[11px] text-[#A0A0A0]">Disable liquid fluid backgrounds and micro-animations</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.general.reduceMotion} 
                        onChange={(e) => handleUpdate('general', { reduceMotion: e.target.checked }, "Motion preference saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* USAGE AND LIMITS SUB-PAGE */}
              {activePage === 'usage' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#2C2C2C] border border-[#414141] rounded-2xl">
                      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase">Total AI Messages</div>
                      <div className="text-2xl font-bold text-white mt-1">{settings.usage.totalMessages}</div>
                    </div>
                    <div className="p-4 bg-[#2C2C2C] border border-[#414141] rounded-2xl">
                      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase">Images Generated</div>
                      <div className="text-2xl font-bold text-[#9b72cb] mt-1">{settings.usage.imagesGenerated}</div>
                    </div>
                    <div className="p-4 bg-[#2C2C2C] border border-[#414141] rounded-2xl">
                      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase">Flash Model Invocations</div>
                      <div className="text-2xl font-bold text-white mt-1">{settings.usage.flashMessages}</div>
                    </div>
                    <div className="p-4 bg-[#2C2C2C] border border-[#414141] rounded-2xl">
                      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase">Storage Used</div>
                      <div className="text-2xl font-bold text-[#34a853] mt-1">
                        {(settings.usage.storageUsedBytes / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#111111] border border-[#414141] rounded-2xl text-xs text-[#A0A0A0] leading-relaxed">
                    INFBOTT provides unlimited free conversational chatting across high-performance Gemini and Gemma models with zero quota stalls.
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS SUB-PAGE */}
              {activePage === 'notifications' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Browser Notifications</div>
                        <div className="text-[11px] text-[#A0A0A0]">Request permission for background completion alerts</div>
                      </div>
                      <button 
                        onClick={handleRequestNotification}
                        className="px-3 py-1.5 bg-[#9b72cb] hover:bg-[#8a5bbd] text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Request Permission
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#414141]">
                      <div>
                        <div className="text-xs font-bold text-white">Chat Completed Alerts</div>
                        <div className="text-[11px] text-[#A0A0A0]">Notify when a long response finishes streaming</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.chatDone}
                        onChange={(e) => handleUpdate('notifications', { chatDone: e.target.checked }, "Notification updated")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs font-bold text-white">Security Alerts</div>
                        <div className="text-[11px] text-[#A0A0A0]">Receive critical alerts regarding your account</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.securityAlerts}
                        onChange={(e) => handleUpdate('notifications', { securityAlerts: e.target.checked }, "Notification updated")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VOICE SUB-PAGE */}
              {activePage === 'voice' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Speech Synthesis Voice</label>
                      <select 
                        value={settings.voice.voiceName}
                        onChange={(e) => handleUpdate('voice', { voiceName: e.target.value }, "Voice updated")}
                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#414141] rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Nova">Nova (Energetic & Natural)</option>
                        <option value="Alloy">Alloy (Warm & Balanced)</option>
                        <option value="Echo">Echo (Deep & Grounded)</option>
                        <option value="Fable">Fable (Expressive & Engaging)</option>
                        <option value="Onyx">Onyx (Authoritative & Crisp)</option>
                        <option value="Shimmer">Shimmer (Clear & Friendly)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <label className="text-[11px] font-bold text-[#A0A0A0] uppercase">Speech Rate</label>
                        <span className="font-mono text-white font-bold">{settings.voice.speechRate}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.8" 
                        max="1.5" 
                        step="0.1" 
                        value={settings.voice.speechRate}
                        onChange={(e) => handleUpdate('voice', { speechRate: parseFloat(e.target.value) })}
                        className="w-full accent-[#9b72cb] cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        onClick={() => handleTestVoice(settings.voice.voiceName, settings.voice.speechRate)}
                        className="flex-1 py-2.5 bg-[#1A1A1A] hover:bg-[#383838] border border-[#414141] text-xs font-bold text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Volume2 size={16} />
                        <span>Preview Voice Audio</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SAFETY SUB-PAGE */}
              {activePage === 'safety' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Safe Search Grounding</div>
                        <div className="text-[11px] text-[#A0A0A0]">Filter explicit and unverified external web domains</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.safety.safeSearch}
                        onChange={(e) => handleUpdate('safety', { safeSearch: e.target.checked }, "Safety settings saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#414141]">
                      <div>
                        <div className="text-xs font-bold text-white">Prompt Injection Shield</div>
                        <div className="text-[11px] text-[#A0A0A0]">Block malicious jailbreak patterns and script tags</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.safety.promptInjectionShield}
                        onChange={(e) => handleUpdate('safety', { promptInjectionShield: e.target.checked }, "Safety settings saved")}
                        className="w-4 h-4 accent-[#9b72cb] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY & LOGIN SUB-PAGE */}
              {activePage === 'security' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Email Address</div>
                        <div className="text-[11px] text-[#A0A0A0]">{user?.email || profileData.email || 'Not verified'}</div>
                      </div>
                      <button 
                        onClick={handleSendVerification}
                        className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#383838] border border-[#414141] text-xs font-bold text-white rounded-xl transition-colors"
                      >
                        Verify Email
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#414141]">
                      <div>
                        <div className="text-xs font-bold text-white">Account Password</div>
                        <div className="text-[11px] text-[#A0A0A0]">Send a secure password reset link to your email</div>
                      </div>
                      <button 
                        onClick={handleSendPasswordReset}
                        className="px-3 py-1.5 bg-[#9b72cb] hover:bg-[#8a5bbd] text-xs font-bold text-white rounded-xl transition-colors"
                      >
                        Reset Password
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#414141]">
                      <div className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">Session Information</div>
                      <div className="text-xs text-[#A0A0A0] font-mono">
                        Provider: {user?.providerData?.[0]?.providerId || 'password / firebase'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STORAGE SUB-PAGE */}
              {activePage === 'storage' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Total Storage Consumed</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {(settings.usage.storageUsedBytes / (1024 * 1024)).toFixed(2)} MB / 500 MB
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          handleUpdate('usage', { storageUsedBytes: 0 }, "Storage cache refreshed");
                        }}
                        className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#383838] border border-[#414141] text-[#A0A0A0] hover:text-white transition-colors"
                        title="Clear Temporary Storage"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>

                    <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#9b72cb]" style={{ width: '1.2%' }} />
                    </div>

                    <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                      Files and attachments uploaded in conversations are stored securely. Clearing storage removes temporary caches without losing your chat logs.
                    </p>
                  </div>
                </div>
              )}

              {/* PRIVACY CENTER SUB-PAGE */}
              {activePage === 'privacy' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-white">Data Export</h3>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5">Download a complete JSON export of your profile, preferences, memories, and chat sessions.</p>
                      <button 
                        onClick={handleExportAllData}
                        className="mt-3 px-4 py-2 bg-[#1A1A1A] hover:bg-[#383838] border border-[#414141] text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Download size={15} />
                        <span>Export All Data (JSON)</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#414141]">
                      <h3 className="text-xs font-bold text-red-400">Account Deletion</h3>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5">Permanently erase your memories, conversations, and account details from the server.</p>
                      <button 
                        onClick={() => {
                          if (window.confirm("CRITICAL: Are you sure you want to delete your account data? This permanently removes all conversations and memories.")) {
                            localStorage.clear();
                            onClearAllMemories?.();
                            onClearAllSessions?.();
                            onSignOut();
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-xs font-bold text-red-300 hover:text-white rounded-xl transition-colors"
                      >
                        Delete Account Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORY SUB-PAGE */}
              {activePage === 'history' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Stored Conversations</div>
                        <div className="text-[11px] text-[#A0A0A0]">{sessions.length} chats in your account</div>
                      </div>
                      {sessions.length > 0 && onClearAllSessions && (
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to clear all chat history?")) {
                              onClearAllSessions();
                              setSaveToast("Chat history cleared");
                              setTimeout(() => setSaveToast(null), 2500);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold rounded-xl transition-colors"
                        >
                          Clear All History
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ADS SUB-PAGE */}
              {activePage === 'ads' && (
                <div className="space-y-4">
                  <div className="bg-[#2C2C2C] border border-[#414141] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3 text-[#34a853]">
                      <ShieldCheck size={24} />
                      <h3 className="text-xs font-bold text-white">100% Ad-Free Guarantee</h3>
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">
                      INFBOTT does not contain advertisements, third-party advertising cookies, or behavioral trackers. Your prompts and conversations are never sold to advertisers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Info Modal */}
      <AnimatePresence>
        {infoModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1A1A1A] border border-[#414141] rounded-2xl p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#9b72cb]/20 text-[#9b72cb] flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">INFBOTT AI</h3>
                <p className="text-xs text-[#A0A0A0] mt-1 font-mono">Build v2.4 (Pure Black Edition)</p>
              </div>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Created by Duckeyy / Ravi to make users' lives easy. Built with high-throughput streaming, persistent long-term memory, and interactive real-time widgets.
              </p>
              <button 
                onClick={() => setInfoModalOpen(false)}
                className="w-full py-2.5 bg-[#2C2C2C] hover:bg-[#383838] border border-[#414141] rounded-xl text-xs font-bold text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsView;
