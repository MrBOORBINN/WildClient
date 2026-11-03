import React from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Layout, Download, Code, Clock, Terminal, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { calculateReadingTime } from '../utils/readingTime';
import { ChatImageCard } from './ChatImageCard';
import { DynamicWidget } from './chat/DynamicWidget';
import { DynamicWidgetData } from '../types';

// Helper function to handle downloading Minecraft schematic/NBT data
const handleDownloadMinecraftExport = (content: string, type: 'zip' | 'schematic' | 'schem' | 'nbt' | string) => {
  let blob: Blob;
  try {
    if (content.match(/^[a-zA-Z0-9+/=]+$/) && content.length > 50) {
      const byteCharacters = atob(content.trim());
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'application/octet-stream' });
    } else {
      blob = new Blob([content], { type: 'text/plain' });
    }
  } catch (err) {
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
    <div className="flex-1 overflow-y-auto px-4 lg:px-0 custom-scrollbar bg-[#000000]">
      <div className="max-w-3xl mx-auto py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#ff4e00] via-[#9b72cb] to-[#4285f4] bg-clip-text text-transparent"
              >
                Hi {profileData.fullName.split(' ')[0] || 'there'},
              </motion.h2>
              <p className="text-[#A0A0A0] text-sm">Where should we start today?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                { label: 'Summarize Conversations', icon: <FileText size={18} className="text-[#9b72cb]" />, color: 'bg-[#9b72cb]/20', action: handleSummarizeChat },
                { label: 'Generate Visual Art', icon: <ImageIcon size={18} className="text-[#4285f4]" />, color: 'bg-[#4285f4]/20', action: () => handleAction('Generate image') },
                { label: 'Code & Software Architecture', icon: <Terminal size={18} className="text-[#34a853]" />, color: 'bg-[#34a853]/20', action: () => handleAction('Write full-stack code') },
                { label: 'Deep Reasoning & Analysis', icon: <Layout size={18} className="text-[#ea4335]" />, color: 'bg-[#ea4335]/20', action: () => handleAction('Analyze and problem solve') }
              ].map((action, aIdx) => (
                <button 
                  key={`chat-action-${action.label || aIdx}`}
                  onClick={action.action}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-[#111111] border border-[#414141] hover:bg-[#1A1A1A] hover:border-white/30 transition-all group text-left cursor-pointer"
                >
                  <div className={cn("p-2.5 rounded-xl border border-white/5", action.color)}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-white">{action.label}</span>
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
                  <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-[#414141] flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={12} className="text-[#9b72cb]" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-3.5 text-sm group relative",
                  msg.role === 'user' ? "bg-[#2C2C2C] border border-[#414141] text-white" : "bg-transparent text-white"
                )}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto">
                      {msg.attachments.map((att: any, idx: number) => (
                        att.data ? (
                          <img key={`chat-att-${msg.id || mIdx}-${att.id || idx}`} src={att.data} alt="attachment" className="w-20 h-20 object-cover rounded-lg border border-[#414141]" />
                        ) : null
                      ))}
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-white">
                    <Markdown 
                      remarkPlugins={[remarkGfm]}
                      urlTransform={(url) => url}
                      components={{
                        p: ({ children }: any) => <div className="mb-3 leading-relaxed last:mb-0">{children}</div>,
                        img: ({ node, ...props }: any) => props.src ? <ChatImageCard src={props.src} alt={props.alt || "INFBOTT Image"} /> : null,
                        a: ({ href, children }: any) => {
                          if (href && (href.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(href))) {
                            return <ChatImageCard src={href} alt={String(children) || "INFBOTT Image"} />;
                          }
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#9b72cb] underline hover:text-[#b895e3]">
                              {children}
                            </a>
                          );
                        },
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1].toLowerCase() : '';
                          const content = String(children).replace(/\n$/, '');

                          // Dynamic AI Widgets Parser
                          if (language.startsWith('widget:')) {
                            const widgetType = language.split(':')[1];
                            try {
                              const parsedData = JSON.parse(content);
                              return (
                                <DynamicWidget 
                                  data={{ ...parsedData, type: widgetType as any }} 
                                  onAction={handleAction} 
                                />
                              );
                            } catch (e) {
                              // If parse fails, fallback to normal code block
                            }
                          }
                          
                          if (language === 'zip' || language === 'schematic' || language === 'nbt' || language === 'schem') {
                            const fileType = (language === 'nbt' || language === 'schem') ? 'schem' : language;
                            return (
                              <div className="my-3 rounded-xl border border-[#9b72cb]/40 bg-[#1A1A1A] overflow-hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#2C2C2C] border-b border-[#414141]">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9b72cb]">
                                    <Code size={14} />
                                    Minecraft {fileType.toUpperCase()} Export
                                  </div>
                                  <button
                                    onClick={() => handleDownloadMinecraftExport(content, fileType)}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9b72cb] hover:bg-[#8a5bbd] text-white text-xs font-bold transition-colors shadow-sm ml-auto"
                                  >
                                    <span className="text-sm font-black leading-none">↓</span>
                                    <span>Download .{fileType}</span>
                                  </button>
                                </div>
                                <div className="p-3 text-xs font-mono text-neutral-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                                  {content.length > 500 ? `${content.substring(0, 500)}... (truncated for preview)` : content}
                                </div>
                              </div>
                            );
                          }
                          
                          if (match) {
                            return (
                              <div className="rounded-xl bg-[#111111] border border-[#414141] my-2 overflow-hidden">
                                <div className="px-3 py-1.5 bg-[#1A1A1A] border-b border-[#414141] text-[10px] text-[#A0A0A0] uppercase tracking-widest font-mono">{language || 'code'}</div>
                                <div className="p-3 overflow-x-auto text-xs font-mono text-neutral-200">
                                  <code {...props}>{children}</code>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <code className="bg-[#2C2C2C] text-neutral-200 px-1.5 py-0.5 rounded text-xs border border-[#414141]" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#414141] text-[10px] text-[#A0A0A0]">
                      <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-[#A0A0A0]">
                        <Clock size={11} /> {calculateReadingTime(msg.content).formatted}
                      </span>
                    </div>
                  )}
                  
                  {/* Message Actions */}
                  <div className={cn(
                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                    msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                  )}>
                    <button 
                      onClick={() => handleSummarizeMessage(msg.content)}
                      className="p-1.5 rounded-lg bg-[#2C2C2C] hover:bg-[#383838] border border-[#414141] text-[#A0A0A0] hover:text-white transition-colors"
                      title="Summarize this message"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#9b72cb] flex items-center justify-center shrink-0 mt-1 text-[8px] font-bold text-white">
                    {user?.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-[#414141] flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={12} className="text-[#9b72cb] animate-pulse" />
                </div>
                <div className="flex gap-1 items-center h-6">
                  <div className="w-1.5 h-1.5 bg-[#9b72cb] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#9b72cb] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#9b72cb] rounded-full animate-bounce [animation-delay:0.4s]" />
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

