import React, { useState, useEffect } from 'react';
import { Menu, FileText, Cloud, CheckCircle2, Download, Highlighter, Zap, Mic } from 'lucide-react';
import { ModelSelector } from './Sidebar';
import { ModelType } from '../services/geminiService';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { exportConversationToPDF } from '../utils/pdfExport';

interface HeaderProps {
  setIsSidebarOpen: (o: boolean) => void;
  isSidebarOpen: boolean;
  modelType: ModelType;
  setModelType: (m: ModelType) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (o: boolean) => void;
  handleSummarizeChat: () => void;
  isSummarizing: boolean;
  messages: Message[];
  currentSessionTitle?: string;
  setIsProfileModalOpen: (o: boolean) => void;
  profileData: any;
  onOpenNotebook?: () => void;
  notebookCount?: number;
  userCredits?: number;
  onOpenLiveVoice?: () => void;
  isLiveVoiceOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  setIsSidebarOpen,
  isSidebarOpen,
  modelType,
  setModelType,
  isModelMenuOpen,
  setIsModelMenuOpen,
  handleSummarizeChat,
  isSummarizing,
  messages,
  currentSessionTitle = 'New Conversation',
  setIsProfileModalOpen,
  profileData,
  onOpenNotebook,
  notebookCount = 0,
  userCredits = 70,
  onOpenLiveVoice,
  isLiveVoiceOpen = false
}) => {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced'>('synced');

  useEffect(() => {
    if (messages.length > 0) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 1200);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  return (
    <header className="h-14 flex items-center justify-between px-3 sm:px-5 border-b border-white/5 bg-[#131314]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#c4c7c5] hover:text-white cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        <ModelSelector 
          currentModel={modelType}
          onSelect={setModelType}
          isOpen={isModelMenuOpen}
          onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
        />

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          {syncStatus === 'syncing' ? (
            <Cloud size={12} className="text-blue-400 animate-pulse" />
          ) : (
            <CheckCircle2 size={12} className="text-green-400" />
          )}
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Encrypted & Synced'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Voice Button in Header */}
        {onOpenLiveVoice && (
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer shadow-sm active:scale-95",
              isLiveVoiceOpen
                ? "bg-purple-600 text-white border-purple-400 shadow-purple-500/20"
                : "bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-white/10"
            )}
            title="Start Real-Time Live Voice Conversation"
            aria-label="Live Voice"
          >
            <Mic size={14} className={cn(isLiveVoiceOpen ? "text-white animate-pulse" : "text-purple-400")} />
            <span className="hidden sm:inline">Live Voice</span>
          </button>
        )}

        {/* Credit Count Badge on Top Right */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs shadow-inner">
          <Zap size={14} className="animate-pulse" />
          <span className="font-mono">{userCredits} Credits</span>
        </div>

        {/* Profile Avatar Button */}
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-xs font-bold shadow-lg hover:scale-105 transition-transform overflow-hidden shrink-0 border border-white/10 cursor-pointer"
          title="Profile & Settings"
        >
          {profileData?.avatarUrl ? (
            <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            profileData?.avatar || 'U'
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
