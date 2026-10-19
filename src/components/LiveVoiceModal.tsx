import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, FileText, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { VoiceOrb, VoiceState } from './VoiceOrb';
import { cn } from '../lib/utils';
import { getChatResponseStream } from '../services/geminiService';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  idToken?: string | null;
  history?: { role: 'user' | 'assistant'; content: string }[];
  onMessageLogged?: (userText: string, assistantText: string) => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  idToken,
  history = [],
  onMessageLogged
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Audio & Speech references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const currentTurnTextRef = useRef('');

  // Clean, deep warm masculine voice selector
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) {
      setVoiceState('listening');
      return;
    }

    // Clean markdown, symbols, or formatting tags for pure natural speech
    const cleanSpeech = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .trim();

    if (!cleanSpeech) {
      setVoiceState('listening');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    // Deep warm masculine parameters
    utterance.pitch = 0.88;
    utterance.rate = 1.02;

    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural deep masculine voice in English / Hindi / Hinglish
    const maleVoice = voices.find(v => 
      (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George') || v.name.includes('Natural')) && 
      (v.lang.startsWith('en') || v.lang.startsWith('hi'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setVoiceState('listening');
      // Restart recognition for continuous natural turn-taking
      try {
        recognitionRef.current?.start();
      } catch {}
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setVoiceState('listening');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Send turn to AI backend
  const processTurn = useCallback(async (spokenText: string) => {
    if (!spokenText.trim()) {
      setVoiceState('listening');
      return;
    }

    setVoiceState('thinking');
    setUserTranscript(spokenText);
    setAiTranscript('Thinking…');

    try {
      const stream = getChatResponseStream(
        spokenText,
        history,
        'fast',
        [],
        0.7,
        false,
        idToken
      );

      let fullAiText = '';
      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          fullAiText += chunk.content;
          setAiTranscript(fullAiText);
        }
      }

      if (!fullAiText.trim()) {
        fullAiText = "I heard you, let's continue.";
      }

      setAiTranscript(fullAiText);
      onMessageLogged?.(spokenText, fullAiText);
      speakText(fullAiText);
    } catch (err: any) {
      console.warn("Live voice stream error:", err);
      const fallbackMsg = "I encountered an issue processing that. Could you please say that again?";
      setAiTranscript(fallbackMsg);
      speakText(fallbackMsg);
    }
  }, [history, idToken, onMessageLogged, speakText]);

  // Audio Analysis Loop (Web Audio API AnalyserNode)
  const monitorAudio = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1.0, avg / 85);
      setAudioLevel(normalized);

      // Support Natural Interruption: if user speaks over AI voice, cut off AI speech immediately
      if (isSpeakingRef.current && normalized > 0.35) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
        setVoiceState('listening');
      }

      animFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, []);

  // Initialize Microphone & Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initVoice() {
      try {
        setPermissionError(null);
        // 1. Microphone Web Audio API Analyser
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone input is not available in this browser environment. Please verify microphone permissions.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            try {
              await audioCtx.resume();
            } catch {}
          }
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          monitorAudio();
        }

        // 2. Continuous Speech Recognition
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
          console.warn("Speech recognition not natively supported; operating in live Web Audio visualizer mode.");
          setVoiceState('listening');
          return;
        }

        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';

        recognition.onresult = (event: any) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentTurnTextRef.current += ' ' + transcript;
            } else {
              interimText += transcript;
            }
          }

          const currentSpoken = (currentTurnTextRef.current + ' ' + interimText).trim();
          if (currentSpoken) {
            setUserTranscript(currentSpoken);
            setVoiceState('listening');

            // Reset silence timer (1.2s of silence after speech ends triggers turn)
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            silenceTimerRef.current = setTimeout(() => {
              if (currentTurnTextRef.current.trim() && !isSpeakingRef.current) {
                const textToProcess = currentTurnTextRef.current.trim();
                currentTurnTextRef.current = '';
                processTurn(textToProcess);
              }
            }, 1200);
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            setPermissionError("Microphone access was denied in browser permissions. Please grant microphone access to chat live.");
          } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn("Speech recognition event:", e.error);
          }
        };

        recognition.onend = () => {
          // Restart recognition unless modal was closed or AI is speaking
          if (isMounted && !isSpeakingRef.current && !isMuted) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {}
        setVoiceState('listening');

      } catch (err: any) {
        console.error("Microphone setup failed:", err);
        setPermissionError(err.message || "Microphone access was denied. Please grant microphone permission to use Live Voice.");
      }
    }

    initVoice();

    return () => {
      isMounted = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, monitorAudio, processTurn, isMuted]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (micStreamRef.current) {
      const enabled = isMuted;
      micStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsMuted(!isMuted);
      if (!enabled) {
        try {
          recognitionRef.current?.stop();
        } catch {}
      } else {
        try {
          recognitionRef.current?.start();
        } catch {}
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0c0d0f]/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 select-none text-white overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between z-20 w-full max-w-4xl mx-auto">
          {/* INFBOTT Branding & Status Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-white">INFBOTT</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#c4c7c5] border border-white/10">
                  Live Voice
                </span>
              </div>
              <div className="text-xs font-medium text-[#8e918f] flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  voiceState === 'listening' ? "bg-emerald-400 animate-pulse" :
                  voiceState === 'speaking' ? "bg-blue-400 animate-pulse" :
                  voiceState === 'thinking' ? "bg-purple-400 animate-pulse" : "bg-zinc-500"
                )} />
                <span className="capitalize">
                  {isMuted ? "Microphone Muted" :
                   voiceState === 'listening' ? "Listening to you…" :
                   voiceState === 'speaking' ? "INFBOTT Speaking…" :
                   voiceState === 'thinking' ? "Thinking…" : "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* Close / Exit Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all border border-white/10 cursor-pointer shadow-lg"
            title="Exit Live Voice"
          >
            <X size={20} />
          </button>
        </div>

        {/* Center Section: Animated Voice Orb & Permission Alerts */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto relative z-10">
          {permissionError ? (
            <div className="max-w-sm p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
              <AlertCircle size={36} className="text-red-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Microphone Required</h3>
              <p className="text-xs text-[#c4c7c5] leading-relaxed">{permissionError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
              >
                Allow Microphone & Reload
              </button>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <VoiceOrb 
                state={isMuted ? 'idle' : voiceState} 
                audioLevel={isMuted ? 0 : audioLevel} 
                size={240} 
              />

              {/* Status Hint */}
              <div className="text-xs text-[#8e918f] font-medium tracking-wide mt-2">
                {isMuted ? "Microphone is muted" : "Speak naturally in Hindi, Hinglish, or English"}
              </div>
            </div>
          )}

          {/* Real-time Subtitles / Live Transcript Bar */}
          {showTranscript && !permissionError && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl mt-6 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl text-center space-y-1 shadow-2xl"
            >
              {userTranscript && (
                <p className="text-xs text-white/90 font-medium italic">
                  "{userTranscript}"
                </p>
              )}
              {aiTranscript && (
                <p className="text-xs text-[#a8c7fa] font-medium pt-1 border-t border-white/5">
                  {aiTranscript}
                </p>
              )}
              {!userTranscript && !aiTranscript && (
                <p className="text-[11px] text-white/40 italic">
                  Start speaking to start conversation…
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-center gap-4 z-20 pb-4">
          {/* Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={cn(
              "px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer shadow-lg",
              showTranscript
                ? "bg-white/15 text-white border-white/20"
                : "bg-white/5 text-[#8e918f] border-white/5 hover:text-white"
            )}
            title="Toggle live captions & transcript"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">{showTranscript ? "Hide Transcript" : "Show Transcript"}</span>
          </button>

          {/* Mute Microphone Button */}
          <button
            onClick={handleToggleMute}
            className={cn(
              "p-4 rounded-full border transition-all cursor-pointer shadow-2xl active:scale-95",
              isMuted
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                : "bg-white/10 hover:bg-white/20 text-white border-white/15"
            )}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {/* End Call / Close */}
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all border border-red-500/40 cursor-pointer shadow-lg shadow-red-600/20 active:scale-95"
          >
            End Conversation
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default LiveVoiceModal;
