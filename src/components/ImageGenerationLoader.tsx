import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Wand2 } from 'lucide-react';

interface ImageGenerationLoaderProps {
  prompt?: string;
  isEdit?: boolean;
  perfStartTime?: number;
}

export const ImageGenerationLoader: React.FC<ImageGenerationLoaderProps> = ({
  prompt = '',
  isEdit = false,
  perfStartTime
}) => {
  const [percent, setPercent] = useState<number>(8);
  const startTime = React.useMemo(() => perfStartTime || performance.now(), [perfStartTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = performance.now() - startTime;
      // Smoothly advance percentage as an honest estimate over ~5-7 seconds
      // Starts at 8%, advances towards ~94%, capping before completion
      // Never reaches 100% until the API response actually resolves
      let estimated = Math.floor(8 + (1 - Math.exp(-elapsedMs / 2800)) * 86);
      if (estimated > 94) estimated = 94;
      setPercent(estimated);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="w-full max-w-[360px] sm:max-w-[420px] mx-auto py-2">
      {/* Title above the placeholder */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-pink-400"
          >
            {isEdit ? <Wand2 size={16} /> : <Sparkles size={16} />}
          </motion.div>
          <span className="text-sm font-semibold text-white tracking-wide">
            {isEdit ? "Editing image…" : "Creating image…"}
          </span>
        </div>
        <span className="text-[11px] font-mono text-purple-300/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
          10 credits
        </span>
      </div>

      {/* Large rounded rectangle with blurred purple, blue, pink, and subtle warm gradients */}
      <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
        {/* Deep pure black ambient foundation */}
        <div className="absolute inset-0 bg-[#040407]" />

        {/* Continuous rotating & flowing gradient nebula matching reference image */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 0.97, 1]
          }}
          transition={{
            rotate: { duration: 16, repeat: Infinity, ease: "linear" },
            scale: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-[-25%] w-[150%] h-[150%] flex items-center justify-center filter blur-[50px] sm:blur-[65px] opacity-90 pointer-events-none"
        >
          {/* Nebula Blob 1: Deep Indigo & Royal Blue */}
          <div 
            className="absolute w-[55%] h-[55%] rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#1e1b4b] -top-6 -left-6 opacity-90 mix-blend-screen animate-pulse" 
            style={{ animationDuration: '6s' }} 
          />

          {/* Nebula Blob 2: Vibrant Purple & Violet */}
          <div 
            className="absolute w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#7e22ce] via-[#9333ea] to-[#4c1d95] top-8 right-0 opacity-85 mix-blend-screen" 
          />

          {/* Nebula Blob 3: Neon Magenta & Hot Pink */}
          <div 
            className="absolute w-[52%] h-[52%] rounded-full bg-gradient-to-tl from-[#db2777] via-[#ec4899] to-[#be185d] -bottom-8 right-4 opacity-80 mix-blend-screen animate-pulse" 
            style={{ animationDuration: '4.5s' }} 
          />

          {/* Nebula Blob 4: Subtle Warm Rose/Crimson Glow */}
          <div 
            className="absolute w-[46%] h-[46%] rounded-full bg-gradient-to-r from-[#e11d48] to-[#f43f5e] bottom-4 left-4 opacity-60 mix-blend-screen" 
          />

          {/* Nebula Center: Ultra-Deep Cosmic Violet Core */}
          <div 
            className="absolute w-[42%] h-[42%] rounded-full bg-[#4f46e5] opacity-75 mix-blend-screen" 
          />
        </motion.div>

        {/* Soft vignette overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60 pointer-events-none" />

        {/* Prompt Preview Overlay */}
        {prompt && (
          <div className="relative z-10 px-5 py-2.5 max-w-[85%] rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-center shadow-lg">
            <p className="text-xs text-white/90 line-clamp-2 italic font-normal">
              "{prompt}"
            </p>
          </div>
        )}
      </div>

      {/* Progress Section below the placeholder */}
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-[#c4c7c5] flex items-center gap-1.5">
            <span>Image generation</span>
            <span className="text-pink-400 font-bold">{percent}%</span>
            <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">(est.)</span>
          </span>
          <span className="text-[11px] text-white/50 font-mono">
            Rendering pixels...
          </span>
        </div>

        {/* Thin sleek animated progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-[0.5px]">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"
            initial={{ width: '8%' }}
            animate={{ width: `${percent}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};
