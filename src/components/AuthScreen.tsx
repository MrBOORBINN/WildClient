import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import LiquidBackground from './LiquidBackground';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  const handleSubmit = async (e: React.FormEvent, forceSignup = false) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowSignUpPrompt(false);

    try {
      if (isLogin && !forceSignup) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (loginErr: any) {
          // If user doesn't exist or invalid credentials, offer to create account automatically
          if (loginErr?.code === 'auth/invalid-credential' || loginErr?.code === 'auth/user-not-found' || loginErr?.message?.includes('invalid-credential')) {
            setShowSignUpPrompt(true);
            throw new Error('Account not found with these credentials. Would you like to create a new account with 70 free credits?');
          }
          throw loginErr;
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let errMsg = err.message || 'Authentication failed';
      if (errMsg.includes('auth/invalid-credential') || errMsg.includes('auth/user-not-found') || errMsg.includes('auth/wrong-password')) {
        errMsg = 'Invalid email or password. Please check your credentials or click below to create a new account.';
        setShowSignUpPrompt(true);
      } else if (errMsg.includes('auth/email-already-in-use')) {
        errMsg = 'Email already in use. Please sign in instead.';
        setIsLogin(true);
      } else if (errMsg.includes('auth/weak-password')) {
        errMsg = 'Password should be at least 6 characters long.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSignup = async () => {
    if (!email || password.length < 6) {
      setError('Please enter a valid email and password (min 6 characters) to create your account.');
      setIsLogin(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Quick Signup Error:', err);
      setError(err.message || 'Failed to create account');
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
        className="w-full max-w-md glass-card p-10 rounded-[40px] relative z-10 border border-white/10 bg-[#1e1f20]/85 backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#4285f4] to-[#9b72cb] flex items-center justify-center mb-6 shadow-2xl overflow-hidden border border-white/10 animate-pulse">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">INFBOTT</h1>
          <p className="text-[#8e918f] max-w-[280px] leading-relaxed text-sm">Your intelligent, production-ready AI companion with 70 free credits.</p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#4285f4]/50 transition-all text-sm"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f]" size={18} />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#4285f4]/50 transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#4285f4] text-white font-bold py-4 px-6 rounded-2xl hover:bg-[#4285f4]/80 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? 'Sign In' : 'Create Account (70 Credits Free)'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center space-y-3">
              <p>{error}</p>
              {showSignUpPrompt && (
                <button
                  type="button"
                  onClick={handleQuickSignup}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
                >
                  <UserPlus size={16} />
                  <span>Create Account with this email & get 70 Free Credits</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setShowSignUpPrompt(false);
            }}
            className="text-sm text-[#8e918f] hover:text-white transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="mt-8 text-[10px] text-[#8e918f] leading-relaxed text-center opacity-50">
          By continuing, you agree to INFBOTT's Terms of Service and Privacy Policy. All chats and messages are saved securely.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
