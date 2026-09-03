import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Cloud, LogOut, Check, Sparkles } from 'lucide-react';

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
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  profileData, 
  setProfileData, 
  onSignOut,
  onOpenCloudConsole
}) => {
  const [name, setName] = useState(profileData.fullName || '');
  const [saved, setSaved] = useState(false);
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
            className="relative w-full max-w-md glass-card p-8 rounded-[32px] border border-white/10"
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
              <h2 className="text-2xl font-bold text-white">INFBOTT Account</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#ff0080] flex items-center justify-center text-2xl font-bold shadow-xl overflow-hidden text-white border border-white/20">
                  {profileData.avatarUrl ? (
                    <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
