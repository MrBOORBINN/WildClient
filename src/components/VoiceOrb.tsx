import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0.0 to 1.0 from real Web Audio API AnalyserNode
  size?: number;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  audioLevel = 0,
  size = 220
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = phaseRef.current;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = (size / 2) * 0.65;

      // React to actual audio amplitude and current state
      const smoothedLevel = Math.min(1.0, Math.max(0, audioLevel));
      
      let scale = 1.0;
      let waveSpeed = 0.03;
      let rippleCount = 3;

      if (state === 'listening') {
        scale = 1.0 + smoothedLevel * 0.45;
        waveSpeed = 0.05 + smoothedLevel * 0.08;
      } else if (state === 'speaking') {
        scale = 1.02 + smoothedLevel * 0.38;
        waveSpeed = 0.06 + smoothedLevel * 0.07;
      } else if (state === 'thinking') {
        scale = 1.0 + Math.sin(localPhase * 3) * 0.04;
        waveSpeed = 0.08;
      } else {
        // idle
        scale = 1.0 + Math.sin(localPhase) * 0.02;
        waveSpeed = 0.02;
      }

      localPhase += waveSpeed;
      phaseRef.current = localPhase;

      const r = baseRadius * scale;

      // 1. Outermost subtle ambient acoustic ripples (Web Audio reactivity)
      if (state === 'listening' || state === 'speaking') {
        for (let i = 1; i <= rippleCount; i++) {
          const rippleR = r + (i * 18 * (0.4 + smoothedLevel * 0.8));
          const alpha = (0.28 / i) * (0.3 + smoothedLevel * 0.7);
          ctx.beginPath();
          ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(230, 230, 235, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 2. Outer Liquid Glass Glow Halo (Pure black, slate grey, white gradient)
      const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.5);
      outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
      outerGlow.addColorStop(0.5, 'rgba(160, 165, 175, 0.06)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // 3. Fluid Liquid Deformed Body
      ctx.save();
      ctx.beginPath();
      const points = 32;
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const wave = Math.sin(theta * 3 + localPhase) * (state === 'thinking' ? 6 : smoothedLevel * 14);
        const currentR = r + wave;
        const px = cx + Math.cos(theta) * currentR;
        const py = cy + Math.sin(theta) * currentR;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();

      // Liquid body gradient (Deep obsidian black, graphite, and polished silver grey)
      const bodyGrad = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.35,
        r * 0.1,
        cx,
        cy,
        r
      );
      bodyGrad.addColorStop(0, '#50545c');
      bodyGrad.addColorStop(0.3, '#2a2c31');
      bodyGrad.addColorStop(0.7, '#16171a');
      bodyGrad.addColorStop(1, '#0c0d0f');

      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Glass specular rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // 4. Liquid Glass Inner Specular Shimmer (Curved specular highlight)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.45, r * 0.22, -Math.PI / 4, 0, Math.PI * 2);
      const specGrad = ctx.createLinearGradient(
        cx - r * 0.4,
        cy - r * 0.5,
        cx,
        cy
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.fill();
      ctx.restore();

      // 5. Secondary bottom specular reflection
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.22, cy + r * 0.3, r * 0.35, r * 0.12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220, 225, 235, 0.15)';
      ctx.fill();
      ctx.restore();

      // 6. Thinking State: Subtle orbital particle shimmering
      if (state === 'thinking') {
        const orbitR = r * 0.9;
        for (let p = 0; p < 3; p++) {
          const orbitAngle = localPhase * 1.5 + (p * (Math.PI * 2)) / 3;
          const ox = cx + Math.cos(orbitAngle) * orbitR;
          const oy = cy + Math.sin(orbitAngle) * (orbitR * 0.6);
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, audioLevel, size]);

  return (
    <div className="relative flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={size * 1.8}
        height={size * 1.8}
        style={{ width: `${size * 1.8}px`, height: `${size * 1.8}px` }}
        className="pointer-events-none"
      />
    </div>
  );
};
export default VoiceOrb;
