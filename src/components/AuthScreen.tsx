import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, UserPlus, LogIn, ArrowRight, Zap } from 'lucide-react';
import LiquidBackground from './LiquidBackground';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent, forceSignup = false) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin && !forceSignup) {
        // Attempt login first
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
          return;
        } catch (loginErr: any) {
          const code = loginErr?.code || '';
          
          // If credentials failed, modern Firebase Auth returns 'auth/invalid-credential'
          // whether the user does not exist OR the password was wrong.
          // Seamless flow: try creating the account so first-time users don't get blocked with an error!
          if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || loginErr?.message?.includes('invalid-credential')) {
            try {
              await createUserWithEmailAndPassword(auth, trimmedEmail, password);
              return; // Successfully created and signed in
            } catch (createErr: any) {
              const createCode = createErr?.code || '';
              if (createCode === 'auth/email-already-in-use') {
                // Email definitely exists, which means the password provided was incorrect
                setError('Incorrect password for this email. Please check your password and try again.');
              } else if (createCode === 'auth/weak-password') {
                setError('Password should be at least 6 characters long.');
              } else if (createCode === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
              } else {
                setError(createErr?.message || 'Authentication failed. Please verify your credentials.');
              }
              return;
            }
          } else if (code === 'auth/wrong-password') {
            setError('Incorrect password. Please verify your password and try again.');
            return;
          } else if (code === 'auth/too-many-requests') {
            setError('Too many failed attempts. Please wait a moment before trying again.');
            return;
          } else {
            setError(loginErr?.message || 'Failed to sign in. Please try again.');
            return;
          }
        }
      } else {
        // Explicit sign up mode
        try {
          await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          return;
        } catch (createErr: any) {
          const code = createErr?.code || '';
          if (code === 'auth/email-already-in-use') {
            // User already has an account, try signing in with the provided password
            try {
              await signInWithEmailAndPassword(auth, trimmedEmail, password);
              return;
            } catch {
              setError('An account with this email already exists. Please switch to Sign In or enter the correct password.');
              setIsLogin(true);
              return;
            }
          } else if (code === 'auth/weak-password') {
            setError('Password should be at least 6 characters long.');
            return;
          } else if (code === 'auth/invalid-email') {
            setError('Please enter a valid email address.');
            return;
          } else {
            setError(createErr?.message || 'Failed to create account.');
            return;
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (gErr: any) {
      if (gErr?.code === 'auth/popup-closed-by-user' || gErr?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no action needed
      } else {
        setError(gErr?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, 'guest@infbott.app', 'GuestPass123!');
    } catch (gErr: any) {
      setError(gErr?.message || 'Guest access is currently unavailable.');
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
                <span>{isLogin ? 'Sign In / Auto-Register' : 'Create Account (70 Credits Free)'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center">
              <p>{error}</p>
            </div>
          )}
        </form>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap size={15} />
            <span>Instant Demo / Guest Access (70 Free Credits)</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
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
