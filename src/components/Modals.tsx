import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cloud, 
  Image as ImageIcon, 
  Music, 
  HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';

export const PhotoModal = ({ 
  isOpen, 
  onClose, 
  prompt, 
  setPrompt, 
  style, 
  setStyle, 
  aspectRatio, 
  setAspectRatio, 
  onGenerate 
}: {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (p: string) => void;
  style: string;
  setStyle: (s: string) => void;
  aspectRatio: string;
  setAspectRatio: (a: string) => void;
  onGenerate: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass-card p-6 rounded-[24px] border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon size={20} className="text-[#4285f4]" />
              Create Image
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#4285f4] outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase">Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none">
                  {['Photorealistic', 'Digital Art', 'Oil Painting', 'Sketch', 'Cyberpunk', 'Anime'].map(s => <option key={s} value={s} className="bg-[#1e1f20]">{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase">Aspect Ratio</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none">
                  {['1:1', '16:9', '9:16'].map(a => <option key={a} value={a} className="bg-[#1e1f20]">{a}</option>)}
                </select>
              </div>
            </div>
            <button onClick={onGenerate} className="w-full py-3 bg-gradient-to-r from-[#4285f4] to-[#9b72cb] rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform mt-2">Generate Image</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const MusicModal = ({ 
  isOpen, 
  onClose, 
  prompt, 
  setPrompt, 
  genre, 
  setGenre, 
  mood, 
  setMood, 
  onGenerate 
}: {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (p: string) => void;
  genre: string;
  setGenre: (g: string) => void;
  mood: string;
  setMood: (m: string) => void;
  onGenerate: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg glass-card p-6 rounded-[24px] border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Music size={20} className="text-[#34a853]" />
              Create Music
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
          </div>
          <div className="space-y-4">
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the music you want to compose..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#34a853] outline-none"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase">Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none">
                  {['Lo-fi', 'Cinematic', 'Electronic', 'Ambient', 'Jazz', 'Rock', 'Classical', 'Hip Hop', 'Synthwave', 'Acoustic'].map(g => <option key={g} value={g} className="bg-[#1e1f20]">{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8e918f] uppercase">Mood</label>
                <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs outline-none">
                  {['Relaxing', 'Energetic', 'Melancholic', 'Epic', 'Mysterious', 'Happy', 'Dark', 'Peaceful', 'Intense'].map(m => <option key={m} value={m} className="bg-[#1e1f20]">{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={onGenerate} className="w-full py-3 bg-gradient-to-r from-[#34a853] to-[#4285f4] rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform mt-2">Compose Track</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const DriveModal = ({ 
  isOpen, 
  onClose, 
  files, 
  isConnected, 
  onConnect, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  files: any[]; 
  isConnected: boolean; 
  onConnect: () => void;
  onSelect: (file: any) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-card p-6 rounded-[24px] border border-white/10 flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cloud size={20} className="text-[#4285f4]" />
              Google Drive
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
          </div>
          
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Cloud size={32} className="text-[#4285f4]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold">Connect Google Drive</h3>
                <p className="text-sm text-[#8e918f]">Access your files directly from WILDCLEINT</p>
              </div>
              <button 
                onClick={onConnect}
                className="px-6 py-2 bg-[#4285f4] hover:bg-[#4285f4]/80 rounded-full font-bold transition-colors"
              >
                Connect Now
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {files.length === 0 ? (
                <div className="text-center py-12 text-[#8e918f]">No files found in your Drive</div>
              ) : (
                files.map((file) => (
                  <div 
                    key={file.id}
                    onClick={() => onSelect(file)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Cloud size={20} className="text-[#8e918f]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-[10px] text-[#8e918f] uppercase">{file.mimeType.split('.').pop()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const HelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const faqs = [
    {
      question: "What is WILDSTAR?",
      answer: "WILDSTAR is a multi-modal AI assistant designed for creativity, productivity, and persistent companionship. It can generate images, compose music, analyze documents, and more."
    },
    {
      question: "How do I use Google Drive?",
      answer: "Click the Drive icon in the sidebar to connect your account. Once connected, you can attach files directly to your chats for analysis or storage."
    },
    {
      question: "Can I customize the background?",
      answer: "Yes! Use the Background option in the sidebar to choose from curated themes or upload your own custom image."
    },
    {
      question: "What are the different models?",
      answer: "1.5 Flash is optimized for speed and efficiency. 1.5 Pro is designed for complex reasoning, long-form content, and deep creative tasks."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#1e1f20] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#9b72cb]/20 rounded-xl">
                  <HelpCircle size={24} className="text-[#9b72cb]" />
                </div>
                <h2 className="text-2xl font-bold">Help & FAQ</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-semibold text-white flex items-start gap-3">
                    <span className="text-[#9b72cb] font-mono">0{index + 1}.</span>
                    {faq.question}
                  </h3>
                  <p className="text-[#8e918f] leading-relaxed pl-10">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/5 text-center shrink-0">
              <p className="text-sm text-[#8e918f]">
                Need more help? Contact us at <span className="text-[#4285f4]">support@wildcleint.ai</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const BackgroundSettingsModal = ({ 
  isOpen, 
  onClose, 
  currentBackground, 
  onSelect, 
  gallery 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  currentBackground: string | null; 
  onSelect: (url: string | null) => void;
  gallery: { name: string; url: string; }[];
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-card p-8 rounded-[32px] border border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ImageIcon size={24} className="text-[#ff4e00]" />
                Background Settings
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider mb-4 block">Custom Upload</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-all flex flex-col items-center gap-2"
                >
                  <ImageIcon size={32} className="text-[#8e918f]" />
                  <span className="text-sm font-medium">Upload custom image</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8e918f] uppercase tracking-wider mb-4 block">Curated Gallery</label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => onSelect(null)}
                    className={cn(
                      "aspect-video rounded-xl border-2 transition-all flex items-center justify-center bg-[#131314]",
                      currentBackground === null ? "border-[#ff4e00]" : "border-transparent hover:border-white/20"
                    )}
                  >
                    <span className="text-xs font-bold">Default Liquid</span>
                  </button>
                  {gallery.map((bg) => (
                    <button 
                      key={bg.name}
                      onClick={() => onSelect(bg.url)}
                      className={cn(
                        "aspect-video rounded-xl border-2 transition-all overflow-hidden relative group",
                        currentBackground === bg.url ? "border-[#ff4e00]" : "border-transparent hover:border-white/20"
                      )}
                    >
                      <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-bold">{bg.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
