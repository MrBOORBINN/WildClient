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
  onOpenTopUp?: () => void;
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
  onOpenTopUp,
}) => {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced'>('synced');

  useEffect(() => {
    if (messages.length > 0) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 1200);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const isLowCredits = userCredits < 20;

  return (
    <header className="h-14 flex items-center justify-between px-3 sm:px-5 border-b border-[#414141] bg-[#000000]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-[#1A1A1A] rounded-xl transition-colors text-[#A0A0A0] hover:text-white cursor-pointer"
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

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#414141]">
          {syncStatus === 'syncing' ? (
            <Cloud size={12} className="text-[#4285f4] animate-pulse" />
          ) : (
            <CheckCircle2 size={12} className="text-[#34a853]" />
          )}
          <span className="text-[10px] font-mono text-[#A0A0A0] uppercase tracking-wider">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Encrypted & Synced'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Credit Count Badge */}
        <button 
          onClick={onOpenTopUp}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer shadow-inner",
            isLowCredits 
              ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 ring-2 ring-amber-500/20 animate-pulse" 
              : "bg-[#111111] hover:bg-[#1A1A1A] border border-[#414141] text-amber-400"
          )}
          title={isLowCredits ? "Low credits! Click to top up" : "Click to top up credits"}
        >
          <Zap size={14} className={isLowCredits ? "text-amber-400 fill-amber-400" : ""} />
          <span className="font-mono">{userCredits} Credits</span>
        </button>

        {/* Profile & Settings Button */}
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#111111] hover:bg-[#1A1A1A] border border-[#414141] transition-all cursor-pointer"
          title="Settings & Profile"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#9b72cb] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            {profileData?.avatarUrl ? (
              <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profileData?.avatar || 'U'
            )}
          </div>
          <span className="text-xs font-semibold text-white hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
