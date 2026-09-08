const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Progress Bar Replacement
const targetBar = `{/* Simulated Progress Bar for Active Generation */}
                      {isLoading && msg.role === 'assistant' && mIdx === messages.length - 1 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-[#4285f4] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={10} className="animate-pulse" />
                              Generating response...
                            </span>
                            <span className="text-[10px] font-bold text-white/50 font-mono">
                              {Math.min(99, Math.max(2, Math.floor((msg.content.length / (msg.content.length + 300)) * 100)))}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#4285f4] to-[#9b72cb] rounded-full"
                              initial={{ width: '2%' }}
                              animate={{ width: \`\${Math.min(99, Math.max(2, Math.floor((msg.content.length / (msg.content.length + 300)) * 100)))}\%\` }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      )}`;

const replacementBar = `{/* Loading Status - Numbers Only */}
                      {isLoading && msg.role === 'assistant' && mIdx === messages.length - 1 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-[#4285f4] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles size={10} className="animate-pulse" />
                              Generating response...
                            </span>
                            <span className="text-[12px] font-bold text-[#4285f4] font-mono">
                              {Math.min(99, Math.max(1, Math.floor((msg.content.length / (msg.content.length + 300)) * 100)))}%
                            </span>
                          </div>
                        </div>
                      )}`;

content = content.replace(targetBar, replacementBar);

// 2. Add Timestamps
// We want to add the timestamp below the user message and below the assistant message.
// The structure is:
// <div className={cn("max-w-[88%] rounded-2xl p-4 text-sm group relative shadow-sm", ...
// Wait, I need to see the exact structure. I'll write a script to check it first.
fs.writeFileSync('src/App.tsx', content);
