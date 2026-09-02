import React from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Layout } from 'lucide-react';
import { cn } from '../lib/utils';

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
                        img: ({ node, ...props }) => props.src ? <img {...props} referrerPolicy="no-referrer" className="rounded-lg max-w-full h-auto my-2" /> : null
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
