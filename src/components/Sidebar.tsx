import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  PenTool, 
  GraduationCap, 
  Bot, 
  Trash2, 
  Cloud, 
  Image as ImageIcon, 
  HelpCircle, 
  Settings,
  ChevronRight,
  Zap,
  Brain,
  Check,
  AudioLines
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
    >
      <span className="text-[#e3e3e3]">WILDCLEINT</span>
      <span className="text-[#8e918f]">{currentModel === 'fast' ? '1.5 Flash' : '1.5 Pro'}</span>
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
                  <div className="text-sm font-bold">1.5 Flash</div>
                  <div className="text-[10px] text-[#8e918f]">Fast & efficient for daily tasks</div>
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
                  <div className="text-sm font-bold">1.5 Pro</div>
                  <div className="text-[10px] text-[#8e918f]">Complex reasoning & creativity</div>
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
  onOpenDrive,
  onOpenConsole,
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
  onOpenDrive: () => void;
  onOpenConsole: () => void;
  onAction: (action: string) => void;
  user: any;
}) => (
  <motion.div 
    initial={false}
    animate={{ x: isOpen ? 0 : -260 }}
    className={cn(
      "fixed lg:relative inset-y-0 left-0 w-[260px] bg-[#171717] border-r border-white/5 z-50 flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none",
      !isOpen && "lg:w-0 lg:opacity-0 lg:pointer-events-none"
    )}
  >
    <div className="p-3 flex flex-col h-full">
      <button 
        onClick={onNewChat}
        className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium mb-4"
      >
        <Plus size={16} />
        <span>New chat</span>
      </button>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        <div className="space-y-1 mb-4">
          <button onClick={() => onAction('Deep Research')} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]">
            <Search size={14} className="text-[#4285f4]" />
            <span>Deep Research</span>
          </button>
          <button onClick={() => onAction('Text to Speech')} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]">
            <AudioLines size={14} className="text-[#ff4e00]" />
            <span>Text to Speech</span>
          </button>
          <button onClick={() => onAction('Canvas')} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]">
            <PenTool size={14} className="text-[#34a853]" />
            <span>Canvas</span>
          </button>
          <button onClick={() => onAction('Guided Learning')} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]">
            <GraduationCap size={14} className="text-[#ea4335]" />
            <span>Guided Learning</span>
          </button>
          <button onClick={onOpenConsole} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]">
            <Cloud size={14} className="text-[#4285f4]" />
            <span>Cloud Console</span>
          </button>
        </div>

        <div className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider px-2 mb-2">Recent</div>
        {sessions.map((session) => (
          <div 
            key={session.id}
            className={cn(
              "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-sm",
              currentSessionId === session.id ? "bg-white/10 text-white" : "text-[#c4c7c5] hover:bg-white/5"
            )}
            onClick={() => onSwitchSession(session.id)}
          >
            <div className="flex items-center gap-3 truncate flex-1">
              <Bot size={14} className={cn(currentSessionId === session.id ? "text-[#4285f4]" : "text-[#8e918f]")} />
              <span className="truncate">{session.title || 'New Conversation'}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
        <button 
          onClick={onOpenDrive}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <Cloud size={16} />
          <span>Google Drive</span>
        </button>
        <button 
          onClick={onOpenBackground}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <ImageIcon size={16} />
          <span>Background</span>
        </button>
        <button 
          onClick={onOpenHelp}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <HelpCircle size={16} />
          <span>Help & FAQ</span>
        </button>
        <button 
          onClick={onOpenProfile}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-[#c4c7c5]"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-[10px] font-bold overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.email?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <span className="truncate">{user?.full_name || user?.email || 'User'}</span>
          <Settings size={14} className="ml-auto opacity-50" />
        </button>
      </div>
    </div>
  </motion.div>
);

export default Sidebar;
