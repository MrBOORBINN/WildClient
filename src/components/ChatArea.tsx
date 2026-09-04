import React from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Layout, Download, Code } from 'lucide-react';
import { cn } from '../lib/utils';

// Helper function to handle downloading Minecraft schematic/NBT data
const handleDownloadMinecraftExport = (content: string, type: 'zip' | 'schematic' | 'schem' | 'nbt' | string) => {
  let blob: Blob;
  try {
    // If the model provides base64 data, we should decode it into binary
    if (content.match(/^[a-zA-Z0-9+/=]+$/) && content.length > 50) {
      const byteCharacters = atob(content.trim());
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'application/octet-stream' });
    } else {
      // Otherwise, it might be SNBT or JSON text format
      blob = new Blob([content], { type: 'text/plain' });
    }
  } catch (err) {
    // Fallback to raw text if base64 decoding fails
    blob = new Blob([content], { type: 'text/plain' });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exported_minecraft_data.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: any[];
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  profileData: any;
  user: any;
  handleSummarizeChat: () => void;
  handleSummarizeMessage: (content: string) => void;
  handleAction: (action: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatArea = ({
  messages,
  isLoading,
  profileData,
  user,
  handleSummarizeChat,
  handleSummarizeMessage,
  handleAction,
  messagesEndRef
}: ChatAreaProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-0 custom-scrollbar">
      <div className="max-w-3xl mx-auto py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#ff4e00] via-[#ff0080] to-[#9b72cb] bg-clip-text text-transparent"
              >
                Hi {profileData.fullName.split(' ')[0] || 'there'},
              </motion.h2>
              <p className="text-[#8e918f] text-sm">Where should we start today?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                { label: 'Summarize Chat', icon: <FileText size={18} className="text-[#4285f4]" />, color: 'bg-blue-500/10', action: handleSummarizeChat },
                { label: 'Write anything', icon: <Layout size={18} className="text-[#ea4335]" />, color: 'bg-red-500/10', action: () => handleAction('Write anything') }
              ].map((action, aIdx) => (
                <button 
                  key={`chat-action-${action.label || aIdx}`}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all group"
                >
                  <div className={cn("p-2 rounded-lg", action.color)}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-[#c4c7c5] group-hover:text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, mIdx) => (
              <motion.div 
                key={msg.id ? `chat-msg-${msg.id}` : `chat-msg-idx-${mIdx}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={12} className="text-[#4285f4]" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-sm group relative",
                  msg.role === 'user' ? "bg-[#2f2f2f] text-white" : "bg-transparent text-[#e3e3e3]"
                )}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto">
                      {msg.attachments.map((att: any, idx: number) => (
                        <img key={`chat-att-${msg.id || mIdx}-${att.id || idx}`} src={att.data || undefined} alt="attachment" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                      ))}
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    <Markdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ node, ...props }) => props.src ? <img {...props} referrerPolicy="no-referrer" className="rounded-lg max-w-full h-auto my-2" /> : null,
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1].toLowerCase() : '';
                          const content = String(children).replace(/\n$/, '');
                          
                          if (language === 'zip' || language === 'schematic' || language === 'nbt' || language === 'schem') {
                            const fileType = (language === 'nbt' || language === 'schem') ? 'schem' : language;
                            return (
                              <div className="my-3 rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-500/10 border-b border-blue-500/10">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                                    <Code size={14} />
                                    Minecraft {fileType.toUpperCase()} Export
                                  </div>
                                  <button
                                    onClick={() => handleDownloadMinecraftExport(content, fileType)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition-colors shadow-sm ml-auto"
                                  >
                                    <span className="text-sm font-black leading-none">↓</span>
                                    <span>Download .{fileType}</span>
                                  </button>
                                </div>
                                <div className="p-3 text-xs font-mono text-[#a8c7fa] overflow-x-auto max-h-40 whitespace-pre-wrap">
                                  {content.length > 500 ? `${content.substring(0, 500)}... (truncated for preview)` : content}
                                </div>
                              </div>
                            );
                          }
                          
                          if (match) {
                            return (
                              <div className="rounded-lg bg-black/40 border border-white/10 my-2 overflow-hidden">
                                <div className="px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] text-gray-400 uppercase tracking-widest">{language || 'code'}</div>
                                <div className="p-3 overflow-x-auto text-xs font-mono text-gray-300">
                                  <code {...props}>{children}</code>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <code className="bg-white/10 text-[#e3e3e3] px-1.5 py-0.5 rounded text-xs" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>
                  
                  {/* Message Actions */}
                  <div className={cn(
                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                    msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                  )}>
                    <button 
                      onClick={() => handleSummarizeMessage(msg.content)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e918f] hover:text-white transition-colors"
                      title="Summarize this message"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center shrink-0 mt-1 text-[8px] font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={12} className="text-[#4285f4] animate-pulse" />
                </div>
                <div className="flex gap-1 items-center h-6">
                  <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-[#4285f4] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
