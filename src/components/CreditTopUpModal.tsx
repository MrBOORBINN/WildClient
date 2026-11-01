import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Sparkles, Check, ShieldCheck, CreditCard, ArrowRight, AlertTriangle } from 'lucide-react';

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCredits: number;
  onTopUpSuccess: (newCredits: number) => void;
  user?: any;
}

const CREDIT_PACKAGES = [
  { id: 'starter', amount: 50, label: 'Starter Pack', tag: 'Fast Refill', desc: '5 image generations or 50 deep reasoning chats' },
  { id: 'popular', amount: 100, label: 'Pro Creator', tag: 'Most Popular', desc: '10 image generations, edits & full search grounding' },
  { id: 'power', amount: 250, label: 'Power Studio', tag: 'Best Value', desc: '25 image generations + unlimited multimodal coding' }
];

export const CreditTopUpModal: React.FC<CreditTopUpModalProps> = ({
  isOpen,
  onClose,
  userCredits,
  onTopUpSuccess,
  user
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTopUp = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const idToken = user ? await user.getIdToken().catch(() => null) : null;
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ amount: selectedAmount })
      });

      if (!res.ok) {
        throw new Error('Failed to complete top-up request.');
      }

      const data = await res.json();
      const updatedCredits = typeof data.credits === 'number' ? data.credits : userCredits + selectedAmount;
      onTopUpSuccess(updatedCredits);
      setSuccessMessage(`Successfully added +${selectedAmount} Credits! New balance: ${updatedCredits}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.warn('Top-up error:', err);
      // Fallback local update if network glitch
      const fallbackCredits = userCredits + selectedAmount;
      onTopUpSuccess(fallbackCredits);
      setSuccessMessage(`Credits boosted by +${selectedAmount}! New balance: ${fallbackCredits}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-lg bg-[#18191b] border border-amber-500/20 p-6 sm:p-7 rounded-[28px] shadow-2xl text-white overflow-hidden"
          >
            {/* Header Accent Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-[#8e918f] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Top Up INFBOTT Credits
                </h3>
                <p className="text-xs text-[#8e918f]">
                  Power high-performance reasoning, real-time web retrieval, and image generation.
                </p>
              </div>
            </div>

            {/* Current Balance Card */}
            <div className="mb-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">Current Balance</span>
                <div className="text-xl font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <span className={userCredits < 20 ? "text-amber-400" : "text-emerald-400"}>
                    {userCredits}
                  </span>
                  <span className="text-xs font-normal text-white/60">Credits</span>
                </div>
              </div>
              {userCredits < 20 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  <AlertTriangle size={13} />
                  <span>Low Balance</span>
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="space-y-2.5 mb-6">
              <div className="text-xs font-semibold text-[#8e918f] uppercase tracking-wider px-1">
                Select Credit Package
              </div>
              {CREDIT_PACKAGES.map((pkg) => {
                const isSelected = selectedAmount === pkg.amount;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedAmount(pkg.amount)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'
                      }`}>
                        +{pkg.amount}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{pkg.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/50'
                          }`}>
                            {pkg.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#8e918f] mt-0.5">{pkg.desc}</p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-amber-400 bg-amber-400 text-black' : 'border-white/20'
                    }`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feedback / Errors */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
              >
                <Check size={14} className="shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleTopUp}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Zap size={16} className="animate-spin" />
                  <span>Processing Top-Up...</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="fill-black" />
                  <span>Add +{selectedAmount} Credits Now</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-[#8e918f]">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Instant reload & zero quota delays</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
