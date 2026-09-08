const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetActions = `                      {/* Message Hover Actions */}
                      <div className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5",
                        msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                      )}>`;

const replacementActions = `                      {/* Timestamps */}
                      <div className="mt-2 text-[10px] text-white/30 font-medium flex items-center gap-2 justify-end select-none">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.generationTimeMs && (
                          <>
                            <span>•</span>
                            <span>{ (msg.generationTimeMs / 1000).toFixed(1) }s</span>
                          </>
                        )}
                      </div>

                      {/* Message Hover Actions */}
                      <div className={cn(
                        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5",
                        msg.role === 'user' ? "right-full mr-2" : "left-full ml-2"
                      )}>`;

content = content.replace(targetActions, replacementActions);

fs.writeFileSync('src/App.tsx', content);
