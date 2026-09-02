'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        success('Welcome back to ARMIA Boutique', 'Signed In');
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await signupWithEmail(email.trim(), password, name.trim());
        success('Your account has been created successfully', 'Welcome');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const authErr = err as { code?: string; message?: string };
      let msg = authErr.message || 'Authentication failed. Please check your credentials.';
      if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please try again.';
      } else if (authErr.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (authErr.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      }
      setErrorMessage(msg);
      error(msg, 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await loginWithGoogle();
      success('Signed in successfully with Google', 'Welcome');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/unauthorized-domain') {
        const msg = 'Domain "armiaboutique.com" is not yet added to Authorized Domains in Firebase. Please add it in Firebase Console > Authentication > Settings > Authorized domains.';
        setErrorMessage(msg);
        error('Please add armiaboutique.com to Authorized Domains in Firebase Console', 'Domain Not Authorized');
      } else if (authErr.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(authErr.message || 'Google sign-in failed');
        error('Google sign in failed', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#F6F3EE] border border-[#E8E2D8] shadow-2xl p-8 z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#8E8A85] hover:text-[#1F1F1F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <BrandLogo variant="dark" size="sm" showTagline={false} href="" />
            <h3 className="font-serif text-xl font-bold text-[#1F1F1F] mt-4">
              {mode === 'login' ? 'Sign in to ARMIA' : 'Create Your Account'}
            </h3>
            <p className="text-xs text-[#8E8A85] font-sans mt-1">
              {mode === 'login'
                ? 'Access your orders, saved addresses, and boutique perks'
                : 'Join our boutique family for exclusive fashion releases'}
            </p>
          </div>

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E2D8] py-3 text-xs font-sans font-medium text-[#1F1F1F] hover:bg-[#FAF8F5] hover:border-[#DCC9A6] transition-all shadow-sm mb-5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-[#E8E2D8]" />
            <span className="text-[10px] text-[#8E8A85] uppercase tracking-widest font-sans">
              or with email
            </span>
            <div className="flex-1 h-[1px] bg-[#E8E2D8]" />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mariam El-Sayed"
                    className="w-full bg-white border border-[#E8E2D8] px-3.5 py-2.5 pl-9 text-xs focus:outline-none focus:border-[#B67355] font-sans"
                  />
                  <User className="w-4 h-4 text-[#8E8A85] absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@domain.com"
                  className="w-full bg-white border border-[#E8E2D8] px-3.5 py-2.5 pl-9 text-xs focus:outline-none focus:border-[#B67355] font-sans"
                />
                <Mail className="w-4 h-4 text-[#8E8A85] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-white border border-[#E8E2D8] px-3.5 py-2.5 pl-9 text-xs focus:outline-none focus:border-[#B67355] font-sans"
                />
                <Lock className="w-4 h-4 text-[#8E8A85] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-md mt-4 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Toggle between Sign In & Sign Up */}
          <div className="mt-6 text-center text-xs font-sans text-[#8E8A85]">
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('signup');
                  }}
                  className="text-[#B67355] font-semibold underline underline-offset-4 hover:text-[#1F1F1F]"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setMode('login');
                  }}
                  className="text-[#B67355] font-semibold underline underline-offset-4 hover:text-[#1F1F1F]"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
