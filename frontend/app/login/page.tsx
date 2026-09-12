'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Eye, EyeOff, Shield, GraduationCap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { QuizGeniusLogo } from '@/components/branding/QuizGeniusLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_or_email: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      toast.success(`Welcome back, ${data.username}!`);
      login(data.access_token, {
        id: data.user_id,
        username: data.username,
        email: usernameOrEmail,
        role: data.role,
        status: 'active',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-transparent text-white selection:bg-violet-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
        <div className="w-[600px] h-[400px] bg-violet-600/15 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Brand Logo Lockup */}
        <div className="mb-6">
          <QuizGeniusLogo showEditionBadge={false} />
        </div>

        {/* Header Text */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Sign In to Portal
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            Role-based access for Administrators and Scholars
          </p>
        </div>

        {/* Login Glass Panel */}
        <div className="w-full p-7 sm:p-8 rounded-3xl bg-[#0e101a]/80 border border-white/[0.12] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(139,92,246,0.1)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username / Email */}
            <div>
              <label
                htmlFor="login-username"
                className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 font-mono mb-2 block"
              >
                Username or Email
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or student@university.edu"
                  className="w-full px-4 py-3 rounded-xl bg-[#080911]/90 border border-white/[0.12] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 transition-all"
                  required
                />
                <User className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 font-mono"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#080911]/90 border border-white/[0.12] text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs leading-relaxed animate-in fade-in duration-150">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 mt-1 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 hover:from-violet-500 hover:via-indigo-500 hover:to-sky-400 shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Fill Credentials */}
            <div className="mt-3 pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              <span className="text-[11px] font-mono text-zinc-500 text-center uppercase tracking-wider">
                Quick Demo Credentials
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail('admin');
                    setPassword('AdminPassword123!');
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-violet-500/10 border border-white/[0.08] hover:border-violet-500/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 font-mono">
                      Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 group-hover:text-white transition-colors">
                    Click to Auto-Fill
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUsernameOrEmail('student');
                    setPassword('StudentPassword123!');
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-500/30 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <GraduationCap className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
                      Student
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 group-hover:text-white transition-colors">
                    Click to Auto-Fill
                  </p>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-violet-400 transition-colors inline-flex items-center gap-1.5">
            ← Back to QuizGenius Arena
          </Link>
        </div>
      </div>
    </div>
  );
}
