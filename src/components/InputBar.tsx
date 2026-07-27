import React from 'react';
import { Plus, FileText, Cloud, Paperclip, SlidersHorizontal, Search, PenTool, GraduationCap, BookOpen, Mic, ArrowUp, Image as ImageIcon, Music, X, AudioLines } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface InputBarProps {
  input: string;
  setInput: (i: string) => void;
  handleSend: () => void;
  attachments: any[];
  isPlusMenuOpen: boolean;
  setIsPlusMenuOpen: (o: boolean) => void;
  isToolsMenuOpen: boolean;
  setIsToolsMenuOpen: (o: boolean) => void;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (o: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSummarizeChat: () => void;
  setIsDriveModalOpen: (o: boolean) => void;
  handleAction: (action: string) => void;
}

const InputBar = ({
  input,
  setInput,
  handleSend,
  attachments,
  isPlusMenuOpen,
  setIsPlusMenuOpen,
  isToolsMenuOpen,
  setIsToolsMenuOpen,
  isVoiceEnabled,
  setIsVoiceEnabled,
  fileInputRef,
  handleFileUpload,
  handleSummarizeChat,
  setIsDriveModalOpen,
  handleAction
}: InputBarProps) => {
  return (
    <div className="p-4 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
      <div className="max-w-3xl mx-auto relative">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4285f4]/20 via-[#9b72cb]/20 to-[#34a853]/20 rounded-[24px] opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative glass-card rounded-[24px] p-2 flex flex-col gap-2 shadow-2xl border border-white/10 bg-[#1e1f20]/95 transition-all duration-300 group-focus-within:border-white/20">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*,.pdf,.txt"
              />
              
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-wrap gap-2 px-2 pt-2 pb-1 overflow-hidden"
                  >
                    {attachments.map((att, idx) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx} 
                        className="group/att flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-[#c4c7c5] hover:bg-white/10 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center">
                          {att.type === 'image' ? <ImageIcon size={12} className="text-blue-400" /> : <FileText size={12} className="text-orange-400" />}
                        </div>
                        <span className="max-w-[120px] truncate font-medium">{att.name}</span>
                        <button className="opacity-0 group-hover/att:opacity-100 transition-opacity ml-1 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300 text-[#8e918f] hover:text-white hover:bg-white/5",
                      isPlusMenuOpen && "bg-white/10 text-white rotate-45"
                    )}
                  >
                    <Plus size={20} />
                  </button>
                  <AnimatePresence>
                    {isPlusMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsPlusMenuOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-4 w-64 glass-card p-3 rounded-[24px] border border-white/10 z-50 shadow-2xl overflow-hidden"
                        >
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 py-2 mb-1">Quick Actions</div>
                          <div className="space-y-1">
                            <button onClick={() => { handleSummarizeChat(); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <FileText size={18} className="text-[#4285f4]" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-white/90">Summarize</div>
                                <div className="text-[10px] text-[#8e918f]">Get a quick recap</div>
                              </div>
                            </button>
                            <button onClick={() => { setIsDriveModalOpen(true); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <Cloud size={18} className="text-[#34a853]" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-white/90">Google Drive</div>
                                <div className="text-[10px] text-[#8e918f]">Access cloud files</div>
                              </div>
                            </button>
                            <button onClick={() => { fileInputRef.current?.click(); setIsPlusMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <Paperclip size={18} className="text-[#8e918f]" />
                              </div>
                              <div className="text-left">
                                <div className="font-bold text-white/90">Upload File</div>
                                <div className="text-[10px] text-[#8e918f]">Local documents</div>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 min-w-0">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message WILDCLEINT..."
                    className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#e3e3e3] placeholder:text-[#8e918f] py-3 px-1"
                  />
                </div>

                <div className="flex items-center gap-1.5 px-1">
                  <div className="relative">
                    <button 
                      onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                      className={cn(
                        "p-2.5 rounded-xl transition-all duration-300 text-[#8e918f] hover:text-white",
                        isToolsMenuOpen ? "bg-white/10 text-white" : "hover:bg-white/5"
                      )}
                    >
                      <SlidersHorizontal size={20} />
                    </button>
                    <AnimatePresence>
                      {isToolsMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsToolsMenuOpen(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-4 w-72 glass-card p-3 rounded-[24px] border border-white/10 z-50 shadow-2xl overflow-hidden"
                          >
                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 py-2 mb-1">Creative Tools</div>
                            <div className="space-y-1">
                              <button onClick={() => { handleAction('Create music'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                  <Music size={18} className="text-[#34a853]" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white/90">Music Studio</div>
                                  <div className="text-[10px] text-[#8e918f]">Compose AI tracks</div>
                                </div>
                              </button>
                              <button onClick={() => { handleAction('Deep Research'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                  <Search size={18} className="text-[#4285f4]" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white/90">Deep Research</div>
                                  <div className="text-[10px] text-[#8e918f]">Advanced web analysis</div>
                                </div>
                              </button>
                              <button onClick={() => { handleAction('Text to Speech'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                  <AudioLines size={18} className="text-[#ff4e00]" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white/90">Text to Speech</div>
                                  <div className="text-[10px] text-[#8e918f]">Convert text to audio</div>
                                </div>
                              </button>
                              <button onClick={() => { handleAction('Canvas'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                  <PenTool size={18} className="text-[#ff4e00]" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white/90">Canvas</div>
                                  <div className="text-[10px] text-[#8e918f]">Collaborative workspace</div>
                                </div>
                              </button>
                              <button onClick={() => { handleAction('Guided Learning'); setIsToolsMenuOpen(false); }} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl text-xs transition-all group/item">
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                  <GraduationCap size={18} className="text-[#ea4335]" />
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white/90">Guided Learning</div>
                                  <div className="text-[10px] text-[#8e918f]">Step-by-step tutor</div>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300",
                      isVoiceEnabled ? "text-[#4285f4] bg-blue-500/10" : "text-[#8e918f] hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Mic size={20} />
                  </button>
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() && attachments.length === 0}
                    className="p-2.5 bg-[#4285f4] text-white rounded-xl shadow-lg hover:bg-[#4285f4]/80 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
                  >
                    <ArrowUp size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        <p className="text-[10px] text-center text-[#8e918f] mt-2">
          WILDSTAR can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default InputBar;
