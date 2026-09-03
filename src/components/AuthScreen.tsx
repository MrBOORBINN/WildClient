import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import LiquidBackground from './LiquidBackground';

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [devKey, setDevKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, password, dev_key: devKey };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success - reload page to trigger checkAuth in App.tsx
      window.location.reload();
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#131314]">
      <LiquidBackground imageUrl={null} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 rounded-[40px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center mb-6 shadow-2xl overflow-hidden border border-white/10">
            <Sparkles size={40} className="text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">INFBOTT</h1>
          <p className="text-[#8e918f] max-w-[280px] leading-relaxed text-sm">Your intelligent, production-ready AI companion.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#4285f4]/50 transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#4285f4]/50 transition-all"
                required
              />
            </div>
            {!isLogin && (
              <div className="relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" size={18} />
                <input
                  type="text"
                  placeholder="Developer Key (Optional)"
                  value={devKey}
                  onChange={(e) => setDevKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#4285f4]/50 transition-all"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#4285f4] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#4285f4]/80 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#8e918f] hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-10 text-[10px] text-[#8e918f] leading-relaxed text-center opacity-50">
          By continuing, you agree to INFBOTT's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
