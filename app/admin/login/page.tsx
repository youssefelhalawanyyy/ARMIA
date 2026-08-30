'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await loginAdmin(email.trim(), password);
      success('Authenticated to ARMIA Boutique Administration', 'Admin Access Granted');
      router.replace('/admin');
    } catch (err: unknown) {
      console.error('Admin login error:', err);
      const authErr = err as { code?: string; message?: string };
      let msg = authErr.message || 'Unauthorized access.';
      if (authErr.code === 'auth/invalid-credential') {
        msg = 'Invalid administrator email or password.';
      } else if (authErr.code === 'auth/user-not-found') {
        msg = 'No administrator account found with this email.';
      }
      setErrorMessage(msg);
      error(msg, 'Admin Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#F6F3EE] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#DCC9A6] selection:text-[#1F1F1F]">
      <div className="w-full max-w-md bg-[#1F1F1F] border border-[#333333] p-8 shadow-2xl space-y-6">
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <BrandLogo variant="gold" size="md" showTagline={false} href="" />
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#000000] border border-[#333333] text-[#DCC9A6] text-[10px] font-sans font-bold uppercase tracking-[0.25em]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B67355]" />
              <span>Admin Management Portal</span>
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mt-3">
            Secure Administrator Login
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Strict Email & Password authentication for boutique managers and staff.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider text-[#DCC9A6] mb-1.5 font-medium">
              Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@armia.com"
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-3 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6]"
              />
              <Mail className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider text-[#DCC9A6] mb-1.5 font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141414] border border-[#333333] text-white px-3.5 py-3 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6]"
              />
              <Lock className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#DCC9A6] text-[#1F1F1F] py-3.5 text-xs uppercase tracking-[0.25em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Security Note & Quick Access Info */}
        <div className="pt-4 border-t border-[#333333] text-center space-y-2">
          <p className="text-[10px] text-[#8E8A85]">
            Note: Admin credentials require Firebase Auth email & password credentials.
          </p>
          <p className="text-[10px] text-[#DCC9A6]">
            (e.g., <code className="bg-[#000000] px-1 py-0.5 text-white">admin@armia.com</code>)
          </p>
        </div>
      </div>
    </div>
  );
}
