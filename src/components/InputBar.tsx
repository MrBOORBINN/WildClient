import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Paperclip, 
  ArrowUp, 
  X, 
  FileText, 
  Search, 
  Code, 
  Highlighter, 
  Sparkles, 
  SlidersHorizontal,
  Mic,
  FileCode,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Attachment } from '../types';
import { processUploadedFile } from '../utils/fileProcessor';

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: (text?: string) => void;
  isLoading: boolean;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  isToolsMenuOpen: boolean;
  setIsToolsMenuOpen: (open: boolean) => void;
  isPlusMenuOpen: boolean;
  setIsPlusMenuOpen: (open: boolean) => void;
  isSearchEnabled?: boolean;
  setIsSearchEnabled?: (enabled: boolean) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (enabled: boolean) => void;
  setIsNotebookOpen: (open: boolean) => void;
  handleAction: (action: string) => void;
  handleSummarizeChat: () => void;
  setIsFeedbackModalOpen: (open: boolean) => void;
}

const InputBar: React.FC<InputBarProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  attachments,
  setAttachments,
  isToolsMenuOpen,
  setIsToolsMenuOpen,
  isPlusMenuOpen,
  setIsPlusMenuOpen,
  isSearchEnabled = true,
  setIsSearchEnabled,
  isVoiceEnabled,
  setIsVoiceEnabled,
  setIsNotebookOpen,
  handleAction,
  handleSummarizeChat,
  setIsFeedbackModalOpen
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const result = await processUploadedFile(file);
      if (result.error) {
        alert(result.error);
      } else if (result.attachment) {
        setAttachments(prev => [...prev, result.attachment]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Attachment preview tags */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 mb-2 p-2 bg-[#1e1f20]/60 rounded-xl border border-white/5 backdrop-blur-sm"
            >
              {attachments.map((att, idx) => (
                <div 
                  key={`att-${idx}-${att.name}`}
                  className="flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-lg text-xs text-white max-w-xs truncate border border-white/5"
                >
                  {att.type === 'image' ? (
                    <ImageIcon size={13} className="text-blue-400 shrink-0" />
                  ) : att.name.endsWith('.pdf') ? (
                    <FileText size={13} className="text-rose-400 shrink-0" />
                  ) : (
                    <FileCode size={13} className="text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate text-[11px] font-medium">{att.name}</span>
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="hover:text-red-400 p-0.5 rounded transition-colors ml-1"
                    title="Remove file"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Card */}
        <div className="glass-card rounded-[24px] p-2 flex items-center gap-2 shadow-2xl border border-white/10 relative">
          {/* Add / Attachment Button */}
          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileInputChange} 
              multiple 
              accept="image/*,application/pdf,.docx,.txt,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.sh,.md,.yaml,.yml"
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#8e918f] hover:text-white"
              title="Attach Images, PDFs, DOCX, CSV, JSON, or Code files"
            >
              <Paperclip size={18} />
            </button>
          </div>

          {/* Web Research Toggle */}
          {setIsSearchEnabled && (
            <button
              onClick={() => setIsSearchEnabled(!isSearchEnabled)}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border",
                isSearchEnabled 
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                  : "bg-white/5 text-[#8e918f] border-transparent hover:text-white"
              )}
              title={isSearchEnabled ? "Live Web Research Grounding is ON" : "Click to enable Web Research"}
            >
              <Search size={12} />
              <span>Web</span>
              {isSearchEnabled && <Check size={10} className="text-blue-400" />}
            </button>
          )}

          {/* Text Input */}
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message INFBOTT..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#e3e3e3] placeholder:text-[#8e918f] py-2 px-1 outline-none"
          />

          <div className="flex items-center gap-1">
            {/* Tools Menu Button */}
            <div className="relative">
              <button 
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-[#8e918f] hover:text-white"
                title="AI Tools & Shortcuts"
              >
                <SlidersHorizontal size={18} />
              </button>
              <AnimatePresence>
                {isToolsMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsToolsMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full right-0 mb-2 w-52 glass-card p-2 rounded-xl border border-white/10 z-50 shadow-2xl bg-[#1e1f20]"
                    >
                      <button 
                        onClick={() => { setIsNotebookOpen(true); setIsToolsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors text-white"
                      >
                        <Highlighter size={14} className="text-[#fbbc04]" />
                        <span>Personal Notebook</span>
                      </button>
                      <button 
                        onClick={() => { handleAction('Deep Research'); setIsToolsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors text-white"
                      >
                        <Search size={14} className="text-[#4285f4]" />
                        <span>Web Research</span>
                      </button>
                      <button 
                        onClick={() => { handleAction('Code & Game Dev'); setIsToolsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors text-white"
                      >
                        <Code size={14} className="text-[#34a853]" />
                        <span>Code & Game Studio</span>
                      </button>
                      <button 
                        onClick={() => { handleSummarizeChat(); setIsToolsMenuOpen(false); }} 
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg text-xs transition-colors border-t border-white/5 mt-1 pt-2 text-white"
                      >
                        <FileText size={14} className="text-[#ff4e00]" />
                        <span>Summarize Chat</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Voice Toggle */}
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={cn(
                "p-2 rounded-full transition-colors relative",
                isVoiceEnabled ? "text-[#4285f4] bg-blue-500/10" : "text-[#8e918f] hover:bg-white/5 hover:text-white"
              )}
              title={isVoiceEnabled ? "Voice Speech Response is Enabled" : "Click to enable Voice Response"}
            >
              <Mic size={18} />
              {isVoiceEnabled && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#4285f4] rounded-full animate-ping" />
              )}
            </button>

            {/* Send Button */}
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="p-2 bg-[#4285f4] text-white rounded-full shadow-lg hover:bg-[#4285f4]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              title="Send message"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        {/* Disclaimer footer */}
        <p className="text-[10px] text-center text-[#8e918f] mt-2">
          INFBOTT can make mistakes. Verify important facts, code, and documents.
        </p>
      </div>
    </div>
  );
};

export default InputBar;
