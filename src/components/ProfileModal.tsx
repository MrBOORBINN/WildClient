import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Cloud, LogOut, Check, Sparkles, Brain, Trash2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Memory } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profileData: {
    fullName: string;
    email: string;
    avatar: string;
    avatarUrl?: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
  onSignOut: () => void;
  onOpenCloudConsole: () => void;
  memories?: Memory[];
  onDeleteMemory?: (id: string) => void;
  onClearAllMemories?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  profileData, 
  setProfileData, 
  onSignOut,
  onOpenCloudConsole,
  memories = [],
  onDeleteMemory,
  onClearAllMemories
}) => {
  const [name, setName] = useState(profileData.fullName || '');
  const [saved, setSaved] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev: any) => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      setProfileData((prev: any) => ({
        ...prev,
        fullName: trimmed,
        avatar: trimmed[0]?.toUpperCase() || 'I'
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-card p-6 sm:p-8 rounded-[32px] border border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-[#8e918f] hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#4285f4]/20 rounded-xl">
                <Sparkles size={20} className="text-[#4285f4]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">INFBOTT Account</h2>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-0.5">
                  <ShieldCheck size={13} />
                  <span>Account-Isolated Storage & Long-Term Memory</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-2xl font-bold shadow-xl overflow-hidden text-white border border-white/20">
                  {profileData.avatarUrl ? (
                    <img src={profileData.avatarUrl ? profileData.avatarUrl : undefined} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileData.avatar || 'I'
                  )}
                </div>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs text-[#4285f4] font-semibold hover:underline cursor-pointer"
                >
                  Change Profile Image
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8e918f] uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4285f4]"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#8e918f] uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email || user?.email || 'Local Guest'}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#8e918f] cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              {/* Account-Isolated Long-Term Memory Section (Requirement 14: Privacy & User Control) */}
              {user && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div 
                    onClick={() => setShowMemories(!showMemories)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#4285f4]/20 rounded-lg text-[#4285f4]">
                        <Brain size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Remembered Context</div>
                        <div className="text-xs text-[#8e918f]">
                          {memories.length} item{memories.length === 1 ? '' : 's'} safely tied to your account
                        </div>
                      </div>
                    </div>
                    <button className="text-[#8e918f] hover:text-white p-1">
                      {showMemories ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMemories && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-2.5"
                      >
                        <p className="text-xs text-[#8e918f]">
                          Information automatically recognized across conversations. You can delete any item at any time or say "forget this" in chat.
                        </p>

                        {memories.length === 0 ? (
                          <div className="text-xs text-white/50 italic py-2">
                            No memories recorded yet. As you chat about projects, frameworks, or preferences, they will automatically be remembered here.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {memories.map((mem) => (
                              <div 
                                key={mem.id || mem.memory}
                                className="flex items-start justify-between gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5 text-xs group"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-white/10 text-blue-300">
                                      {mem.category}
                                    </span>
                                  </div>
                                  <div className="text-white/90 leading-relaxed">{mem.memory}</div>
                                </div>
                                {onDeleteMemory && mem.id && (
                                  <button
                                    onClick={() => onDeleteMemory(mem.id!)}
                                    title="Forget this memory"
                                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {memories.length > 0 && onClearAllMemories && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={onClearAllMemories}
                              className="text-[11px] text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                            >
                              Forget All Account Memories
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5">
                <button 
                  onClick={handleSave}
                  className="w-full py-3 bg-[#4285f4] hover:bg-[#4285f4]/80 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>

                <button 
                  onClick={onOpenCloudConsole}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                >
                  <Cloud size={15} className="text-blue-400" />
                  <span>Open INFBOTT Cloud Console</span>
                </button>

                {user && (
                  <button 
                    onClick={onSignOut}
                    className="w-full py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
