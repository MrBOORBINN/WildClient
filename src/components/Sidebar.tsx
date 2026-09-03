import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Bot, 
  Trash2, 
  Image as ImageIcon, 
  HelpCircle, 
  Settings,
  ChevronRight,
  Zap,
  X,
  Brain,
  Check,
  Code,
  Highlighter,
  FileSearch,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ModelType } from '../services/geminiService';

export const ModelSelector = ({ 
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
    <button 
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-sm font-semibold"
    >
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-[#e3e3e3] tracking-wide font-bold">INFBOTT</span>
      <span className="text-[#8e918f] text-xs font-normal">{currentModel === 'fast' ? '2.5 Flash' : '2.5 Pro'}</span>
      <ChevronRight size={14} className={cn("text-[#8e918f] transition-transform", isOpen && "rotate-90")} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-64 glass-card p-2 rounded-2xl border border-white/10 z-50 shadow-2xl"
          >
            <button 
              onClick={() => { onSelect('fast'); onToggle(); }}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                currentModel === 'fast' ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-[#4285f4]" />
                <div className="text-left">
                  <div className="text-sm font-bold text-white">2.5 Flash</div>
                  <div className="text-[10px] text-[#8e918f]">Fast, intelligent & highly responsive</div>
                </div>
              </div>
              {currentModel === 'fast' && <Check size={16} className="text-[#4285f4]" />}
            </button>
            <button 
              onClick={() => { onSelect('pro'); onToggle(); }}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-colors mt-1",
                currentModel === 'pro' ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-[#9b72cb]" />
                <div className="text-left">
                  <div className="text-sm font-bold text-white">2.5 Pro</div>
                  <div className="text-[10px] text-[#8e918f]">Advanced reasoning, math & architecture</div>
                </div>
              </div>
              {currentModel === 'pro' && <Check size={16} className="text-[#9b72cb]" />}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </div>
);

const Sidebar = ({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId, 
  onSwitchSession, 
  onNewChat,
  onDeleteSession,
  onOpenProfile,
  onOpenBackground,
  onOpenHelp,
  onOpenNotebook,
  notebookCount,
  onAction,
  user
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  sessions: any[]; 
  currentSessionId: string | null; 
  onSwitchSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenProfile: () => void;
  onOpenBackground: () => void;
  onOpenHelp: () => void;
  onOpenDrive?: () => void;
  onOpenCalendar?: () => void;
  onOpenVoiceSettings?: () => void;
  onOpenNotebook?: () => void;
  notebookCount?: number;
  onAction: (action: string) => void;
  user: any;
}) => (
  <>
    {/* Backdrop for mobile when sidebar is open */}
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
        />
      )}
    </AnimatePresence>

    <motion.div 
      initial={false}
      animate={{ x: isOpen ? 0 : -270 }}
      className={cn(
        "fixed lg:relative inset-y-0 left-0 w-[270px] bg-[#171718] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
        !isOpen && "lg:w-0 lg:opacity-0 lg:pointer-events-none"
      )}
    >
      <div className="p-3 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          {/* New Chat Button */}
          <button 
            onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-white shadow-sm hover:scale-[1.01]"
          >
            <Plus size={16} className="text-blue-400" />
            <span>New conversation</span>
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors border border-white/5 shrink-0 lg:hidden"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

      {/* Notebook Quick Access */}
      {onOpenNotebook && (
        <button 
          onClick={onOpenNotebook}
          className="flex items-center justify-between w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-xs font-semibold text-amber-300 mb-3 group"
        >
          <div className="flex items-center gap-2.5">
            <Highlighter size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Personal Notebook</span>
          </div>
          {(notebookCount || 0) > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {notebookCount}
            </span>
          )}
        </button>
      )}

      {/* Quick AI Modes */}
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        <div className="space-y-1 mb-4 pb-3 border-b border-white/5">
          <div className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider px-2 mb-1">Capabilities</div>
          <button 
            onClick={() => onAction('Deep Research')} 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white"
          >
            <Search size={14} className="text-[#4285f4]" />
            <span>Web Research</span>
          </button>
          <button 
            onClick={() => onAction('Code & Game Dev')} 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white"
          >
            <Code size={14} className="text-[#34a853]" />
            <span>Coding & Games</span>
          </button>
          <button 
            onClick={() => onAction('Analyze Document')} 
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white"
          >
            <FileSearch size={14} className="text-[#ff4e00]" />
            <span>Vision & Files</span>
          </button>
        </div>

        {/* Recent Conversations */}
        <div className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider px-2 mb-2">Recent Chats</div>
        {sessions.length === 0 ? (
          <div className="text-xs text-[#8e918f] px-2 py-3 text-center">No conversations yet</div>
        ) : (
          sessions
            .filter((session, index, self) => 
              index === self.findIndex((s) => s.id === session.id)
            )
            .map((session, sIdx) => (
            <div 
              key={`sidebar-session-${session.id || sIdx}-${sIdx}`}
              className={cn(
                "group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-xs",
                currentSessionId === session.id ? "bg-white/10 text-white font-medium shadow-sm" : "text-[#c4c7c5] hover:bg-white/5"
              )}
              onClick={() => onSwitchSession(session.id)}
            >
              <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                <Bot size={13} className={cn("shrink-0", currentSessionId === session.id ? "text-[#4285f4]" : "text-[#8e918f]")} />
                <span className="truncate">{session.title || 'New Conversation'}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all shrink-0 ml-1"
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-auto pt-3 border-t border-white/5 space-y-1">
        <button 
          onClick={onOpenBackground}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white"
        >
          <ImageIcon size={15} className="text-[#8e918f]" />
          <span>Appearance & Canvas</span>
        </button>
        <button 
          onClick={onOpenHelp}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white"
        >
          <HelpCircle size={15} className="text-[#8e918f]" />
          <span>Help & System Info</span>
        </button>
        <button 
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-white/5 transition-colors text-xs text-[#c4c7c5] hover:text-white mt-1 border border-white/5"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
            {user?.avatarUrl || user?.photoURL || user?.avatar_url ? (
              <img src={user.avatarUrl || user.photoURL || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.displayName || user?.full_name || user?.email || 'U')[0]?.toUpperCase()
            )}
          </div>
          <span className="truncate font-medium">{user?.displayName || user?.full_name || user?.email || 'User'}</span>
          <Settings size={13} className="ml-auto opacity-50 shrink-0" />
        </button>
      </div>
    </div>
  </motion.div>
  </>
);

export default Sidebar;
