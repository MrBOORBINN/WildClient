import React, { useState, useEffect } from 'react';
import { Menu, FileText, Cloud, CheckCircle2, Download, Highlighter } from 'lucide-react';
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
  notebookCount = 0
}) => {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced'>('synced');

  useEffect(() => {
    if (messages.length > 0) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 1200);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleExportPDF = () => {
    if (!messages || messages.length === 0) {
      alert('Start a conversation to export your chat history as PDF.');
      return;
    }
    exportConversationToPDF(
      currentSessionTitle,
      messages,
      profileData?.fullName || 'User'
    );
  };

  return (
    <header className="h-14 flex items-center justify-between px-3 sm:px-5 border-b border-white/5 bg-[#131314]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#c4c7c5] hover:text-white"
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

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* PDF Export Button */}
        <button
          onClick={handleExportPDF}
          disabled={messages.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
            messages.length > 0 
              ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 hover:scale-[1.02] shadow-sm cursor-pointer" 
              : "bg-white/5 text-[#8e918f] border-transparent cursor-not-allowed opacity-50"
          )}
          title="Download conversation history as PDF"
        >
          <Download size={13} className="text-blue-400" />
          <span className="hidden sm:inline">Export PDF</span>
        </button>

        {/* Summarize Conversation Button */}
        <button 
          onClick={handleSummarizeChat}
          disabled={isSummarizing || messages.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            isSummarizing 
              ? "bg-white/5 text-[#8e918f] cursor-not-allowed" 
              : "bg-white/5 text-[#c4c7c5] hover:bg-white/10 hover:text-white"
          )}
          title="Summarize entire conversation"
        >
          <FileText size={13} className={isSummarizing ? "animate-pulse text-amber-400" : ""} />
          <span className="hidden md:inline">{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
        </button>

        {/* Personal Notebook Button */}
        {onOpenNotebook && (
          <button 
            onClick={onOpenNotebook}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs transition-all"
            title="Open Personal Notebook"
          >
            <Highlighter size={13} className="text-amber-400" />
            <span className="hidden lg:inline font-medium">Notebook</span>
            {notebookCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-[10px] font-bold text-amber-300">
                {notebookCount}
              </span>
            )}
          </button>
        )}

        {/* Profile Avatar Button */}
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-xs font-bold shadow-lg hover:scale-105 transition-transform overflow-hidden shrink-0 ml-1 border border-white/10"
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
