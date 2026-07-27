import React, { useState, useEffect } from 'react';
import { Menu, FileText, Cloud, CheckCircle2 } from 'lucide-react';
import { ModelSelector } from './Sidebar';
import { ModelType } from '../services/geminiService';
import { cn } from '../lib/utils';

interface HeaderProps {
  setIsSidebarOpen: (o: boolean) => void;
  isSidebarOpen: boolean;
  modelType: ModelType;
  setModelType: (m: ModelType) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (o: boolean) => void;
  handleSummarizeChat: () => void;
  isSummarizing: boolean;
  messages: any[];
  setIsProfileModalOpen: (o: boolean) => void;
  profileData: any;
}

const Header = ({
  setIsSidebarOpen,
  isSidebarOpen,
  modelType,
  setModelType,
  isModelMenuOpen,
  setIsModelMenuOpen,
  handleSummarizeChat,
  isSummarizing,
  messages,
  setIsProfileModalOpen,
  profileData
}: HeaderProps) => {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced'>('synced');

  useEffect(() => {
    if (messages.length > 0) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#131314]/50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
        <ModelSelector 
          currentModel={modelType}
          onSelect={setModelType}
          isOpen={isModelMenuOpen}
          onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
        />
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          {syncStatus === 'syncing' ? (
            <Cloud size={12} className="text-blue-400 animate-pulse" />
          ) : (
            <CheckCircle2 size={12} className="text-green-400" />
          )}
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            {syncStatus === 'syncing' ? 'Cloud Syncing...' : 'Cloud Synced'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={handleSummarizeChat}
          disabled={isSummarizing || messages.length === 0}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            isSummarizing ? "bg-white/5 text-[#8e918f] cursor-not-allowed" : "bg-white/5 text-[#c4c7c5] hover:bg-white/10"
          )}
          title="Summarize entire conversation"
        >
          <FileText size={14} className={isSummarizing ? "animate-pulse" : ""} />
          <span className="hidden sm:inline">{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
        </button>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-[10px] font-bold shadow-lg hover:scale-105 transition-transform"
        >
          {profileData.avatar}
        </button>
      </div>
    </header>
  );
};

export default Header;
