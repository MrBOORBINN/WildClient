import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ArrowUp, 
  X, 
  FileText, 
  Search, 
  Mic,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FileCode
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
  currentSessionId?: string | null;
  onOpenLiveVoice?: () => void;
  isLiveVoiceOpen?: boolean;
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
  setIsFeedbackModalOpen,
  currentSessionId,
  onOpenLiveVoice,
  isLiveVoiceOpen = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Restore draft when session changes
  useEffect(() => {
    const sessionIdKey = currentSessionId || 'general';
    const savedDraft = localStorage.getItem(`infbott_draft_${sessionIdKey}`);
    if (savedDraft !== null && savedDraft !== undefined) {
      setInput(savedDraft);
    } else {
      setInput('');
    }
  }, [currentSessionId, setInput]);

  // Save draft when input changes
  useEffect(() => {
    const sessionIdKey = currentSessionId || 'general';
    try {
      localStorage.setItem(`infbott_draft_${sessionIdKey}`, input);
    } catch (e) {}
  }, [input, currentSessionId]);

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (replaceIndexRef.current !== null) {
      const file = files[0];
      const result = await processUploadedFile(file);
      if (result.error) {
        alert(result.error);
      } else if (result.attachment) {
        const replaceIdx = replaceIndexRef.current;
        setAttachments(prev => prev.map((a, i) => i === replaceIdx ? result.attachment! : a));
      }
      replaceIndexRef.current = null;
    } else {
      for (const file of Array.from(files)) {
        const result = await processUploadedFile(file);
        if (result.error) {
          alert(result.error);
        } else if (result.attachment) {
          setAttachments(prev => [...prev, result.attachment]);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReplaceImage = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
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
        {/* Attachment preview cards */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2.5 mb-2.5 p-2 bg-[#1e1f20]/80 rounded-2xl border border-white/10 backdrop-blur-md"
            >
              {attachments.map((att, idx) => (
                <div 
                  key={`att-${idx}-${att.name}`}
                  className="relative group bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center p-1.5 gap-2 shadow-md"
                >
                  {/* Rich Image Thumbnail */}
                  {att.type === 'image' && att.data ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                      <img 
                        src={att.data} 
                        alt={att.name || "Uploaded image"} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : att.name.endsWith('.pdf') ? (
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 text-rose-400">
                      <FileText size={18} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
                      <FileCode size={18} />
                    </div>
                  )}

                  <div className="pr-1 text-left min-w-0 max-w-[130px] sm:max-w-[170px]">
                    <div className="text-[11px] font-semibold text-white truncate">{att.name}</div>
                    <div className="text-[9px] text-[#8e918f] uppercase font-mono">
                      {att.type === 'image' ? 'Image Ready' : 'Document'}
                    </div>
                  </div>

                  {/* Actions: Replace & Remove */}
                  <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                    {att.type === 'image' && (
                      <button 
                        onClick={() => handleReplaceImage(idx)}
                        className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        title="Replace image"
                      >
                        <RefreshCw size={11} />
                      </button>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="p-1 rounded-md hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                      title="Remove attachment"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Card */}
        <div className="glass-card rounded-[24px] p-2 flex items-center gap-1.5 shadow-2xl border border-white/10 relative">
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
              onClick={() => {
                replaceIndexRef.current = null;
                fileInputRef.current?.click();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#8e918f] hover:text-white cursor-pointer"
              title="Attach Images, Camera Photos, or Files"
              aria-label="Upload file or photo"
            >
              <Upload size={18} />
            </button>
          </div>

          {/* Clean Microphone Button immediately to the left of message input field */}
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className={cn(
              "p-2 rounded-full transition-all cursor-pointer relative active:scale-95",
              isLiveVoiceOpen
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-[#8e918f] hover:text-white hover:bg-white/10"
            )}
            title="Real-Time Live Voice Conversation (ChatGPT style)"
            aria-label="Live Voice Conversation"
          >
            <Mic size={18} className={cn(isLiveVoiceOpen && "animate-pulse")} />
            {isLiveVoiceOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Web Research Toggle */}
          {setIsSearchEnabled && (
            <button
              onClick={() => setIsSearchEnabled(!isSearchEnabled)}
              className={cn(
                "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all border shrink-0",
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
            placeholder={attachments.some(a => a.type === 'image') ? "Ask about this image, or say how to edit it..." : "Message INFBOTT or ask to generate an image..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#e3e3e3] placeholder:text-[#8e918f] py-2 px-1 outline-none min-w-0"
          />

          <div className="flex items-center gap-1">
            {/* Send Button */}
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="p-2 bg-[#4285f4] text-white rounded-full shadow-lg hover:bg-[#4285f4]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 cursor-pointer"
              title="Send message"
              aria-label="Send message"
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
