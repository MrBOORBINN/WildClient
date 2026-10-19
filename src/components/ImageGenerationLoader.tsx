import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Wand2, Clock } from 'lucide-react';

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
  const [percent, setPercent] = useState<number>(10);
  const [elapsedSec, setElapsedSec] = useState<string>('0.1s');
  const startTime = React.useMemo(() => perfStartTime || performance.now(), [perfStartTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMs = performance.now() - startTime;
      const sec = (elapsedMs / 1000).toFixed(1) + 's';
      setElapsedSec(sec);

      // Smoothly advance progress bar reflecting actual generation time elapsed
      let estimated = Math.floor(10 + (1 - Math.exp(-elapsedMs / 2500)) * 84);
      if (estimated > 95) estimated = 95;
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
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-white/60 flex items-center gap-1">
            <Clock size={11} className="text-purple-400" />
            <span>{elapsedSec}</span>
          </span>
          <span className="text-[10px] font-mono text-purple-300/80 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            10 credits
          </span>
        </div>
      </div>

      {/* Large rounded rectangle placeholder with subtle smoke animation */}
      <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#09090b] border border-white/10 shadow-2xl flex items-center justify-center">
        {/* Pure dark background foundation */}
        <div className="absolute inset-0 bg-[#09090b]" />

        {/* Subtle flowing, rotating and morphing grey mist / smoke clouds */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.06, 0.96, 1]
          }}
          transition={{
            rotate: { duration: 24, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-[-30%] w-[160%] h-[160%] flex items-center justify-center filter blur-[42px] sm:blur-[56px] opacity-85 pointer-events-none"
        >
          {/* Cloud 1: Soft Silver & Light Smoke */}
          <motion.div 
            animate={{
              x: [-15, 20, -15],
              y: [-10, 15, -10],
              borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 40% 50% 60% 50%']
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[58%] h-[58%] bg-gradient-to-tr from-[#25282f] via-[#484c56] to-[#1c1e23] -top-6 -left-6 opacity-75"
          />

          {/* Cloud 2: Medium Slate & Charcoal Smoke */}
          <motion.div 
            animate={{
              x: [20, -15, 20],
              y: [15, -20, 15],
              borderRadius: ['50% 50% 40% 60% / 60% 40% 60% 40%', '40% 60% 60% 40% / 40% 60% 40% 60%', '50% 50% 40% 60% / 60% 40% 60% 40%']
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[62%] h-[62%] bg-gradient-to-br from-[#333740] via-[#565c69] to-[#202227] top-8 right-0 opacity-70"
          />

          {/* Cloud 3: Ethereal Light Grey Cloud Puff */}
          <motion.div 
            animate={{
              scale: [0.92, 1.15, 0.92],
              opacity: [0.55, 0.8, 0.55]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[52%] h-[52%] bg-gradient-to-tl from-[#424752] via-[#656b7a] to-[#282a30] -bottom-8 right-4 opacity-65"
          />

          {/* Cloud 4: Deep Shadow Mist Base */}
          <div 
            className="absolute w-[46%] h-[46%] rounded-full bg-gradient-to-r from-[#1c1d22] to-[#343842] bottom-4 left-4 opacity-60" 
          />

          {/* Core Ambient Smoke Center */}
          <motion.div 
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            className="absolute w-[44%] h-[44%] rounded-full bg-gradient-to-tr from-[#31353e] via-[#494e5b] to-[#23252b] opacity-75" 
          />
        </motion.div>

        {/* Soft radial vignette overlay to keep edges velvety dark */}
        <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/75 pointer-events-none" />

        {/* Prompt Preview Overlay */}
        {prompt && (
          <div className="relative z-10 px-5 py-2.5 max-w-[85%] rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-center shadow-lg">
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
            <span>Progress</span>
            <span className="text-zinc-200 font-bold">{percent}%</span>
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {elapsedSec} elapsed • Rendering pixels…
          </span>
        </div>

        {/* Progress bar reflecting actual generation time elapsed */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-[0.5px]">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.35)]"
            initial={{ width: '10%' }}
            animate={{ width: `${percent}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
};
export default ImageGenerationLoader;
