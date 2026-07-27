import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Volume2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const ProfileModal = ({ 
  isOpen, 
  onClose, 
  profileData, 
  setProfileData, 
  onSave, 
  onLogout,
  avatarInputRef,
  handleAvatarUpload,
  selectedVoice,
  setSelectedVoice,
  voiceVolume,
  setVoiceVolume,
  voiceDelay,
  setVoiceDelay
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  profileData: any; 
  setProfileData: (data: any) => void;
  onSave: () => void;
  onLogout: () => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedVoice: string;
  setSelectedVoice: (v: any) => void;
  voiceVolume: number;
  setVoiceVolume: (v: number) => void;
  voiceDelay: number;
  setVoiceDelay: (v: number) => void;
}) => {
  const [errors, setErrors] = useState<{ volume?: string; delay?: string }>({});

  useEffect(() => {
    const newErrors: { volume?: string; delay?: string } = {};
    if (voiceVolume < 0 || voiceVolume > 1) {
      newErrors.volume = 'Volume must be between 0 and 100%';
    }
    if (voiceDelay < 0 || voiceDelay > 3) {
      newErrors.delay = 'Delay must be between 0 and 3 seconds';
    }
    setErrors(newErrors);
  }, [voiceVolume, voiceDelay]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-card p-10 rounded-[40px] border border-white/10"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-8">Profile Settings</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-3xl font-bold shadow-2xl overflow-hidden">
                  {profileData.avatarUrl ? (
                    <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileData.avatar
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
                  className="text-sm text-[#ff4e00] font-bold hover:underline"
                >
                  Change Avatar
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#8e918f] ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.fullName}
                    onChange={(e) => setProfileData((prev: any) => ({ ...prev, fullName: e.target.value }))}
                    className="glass-input w-full"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#8e918f] ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    className="glass-input w-full"
                    placeholder="Enter your email"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                  <Mic size={18} className="text-[#4285f4]" /> Voice Assistant
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8e918f] ml-1">Voice Personality</label>
                    <select 
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="glass-input w-full text-sm bg-[#131314]"
                    >
                      <option value="creator_doorbin">Doorbin (Hindi Roast)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8e918f] ml-1 flex justify-between items-center">
                      <span className="flex items-center gap-1"><Volume2 size={12}/> Volume</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={Math.round(voiceVolume * 100)}
                          onChange={(e) => setVoiceVolume(parseInt(e.target.value || '0') / 100)}
                          className="w-12 bg-white/5 border border-white/10 rounded px-1 text-center text-[10px] outline-none focus:border-[#4285f4]"
                        />
                        <span className="text-[10px]">%</span>
                      </div>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01"
                      value={voiceVolume}
                      onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                      className={cn("w-full accent-[#4285f4]", errors.volume && "accent-red-500")}
                    />
                    {errors.volume && (
                      <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={10} /> {errors.volume}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#8e918f] ml-1 flex justify-between items-center">
                      <span className="flex items-center gap-1"><Clock size={12}/> Response Delay</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" max="3" step="0.1"
                          value={voiceDelay}
                          onChange={(e) => setVoiceDelay(parseFloat(e.target.value || '0'))}
                          className="w-12 bg-white/5 border border-white/10 rounded px-1 text-center text-[10px] outline-none focus:border-[#4285f4]"
                        />
                        <span className="text-[10px]">s</span>
                      </div>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="3" step="0.1"
                      value={voiceDelay}
                      onChange={(e) => setVoiceDelay(parseFloat(e.target.value))}
                      className={cn("w-full accent-[#4285f4]", errors.delay && "accent-red-500")}
                    />
                    {errors.delay && (
                      <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                        <AlertCircle size={10} /> {errors.delay}
                      </p>
                    )}
                    <p className="text-[10px] text-[#8e918f] ml-1">Set to 0s for fastest response.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={onSave}
                  disabled={hasErrors}
                  className={cn(
                    "w-full glass-button bg-gradient-to-r from-[#ff4e00] to-[#ff0080] text-white py-4 font-bold transition-all",
                    hasErrors && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  {hasErrors ? 'Fix errors to save' : 'Save Changes'}
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full py-4 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
