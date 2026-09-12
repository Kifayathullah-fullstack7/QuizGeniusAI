'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      setIsSubmitted(true);
      toast.success('Password reset instructions generated.');
    } catch {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#08090E] text-white">
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <h1 className="text-[22px] font-bold text-white tracking-tight mb-2">
          Reset Password
        </h1>
        <p className="text-[13px] text-[#9A9AA6] mb-6 text-center">
          Enter your registered email to receive recovery instructions.
        </p>

        <div className="w-full glass-panel p-6 sm:p-8 rounded-[16px] shadow-2xl">
          {isSubmitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] mx-auto flex items-center justify-center mb-4">
                ✓
              </div>
              <h3 className="text-[16px] font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-[13px] text-[#9A9AA6] mb-6">
                If an account exists with {email}, password reset instructions have been generated.
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="micro-label text-[#8B5CF6] mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full px-4 py-3 rounded-[10px] bg-[#0A0C14] border border-[rgba(255,255,255,0.08)] text-white text-[14px] placeholder-[#9A9AA6] focus:outline-none focus:border-[#8B5CF6]"
                    required
                  />
                  <Mail className="w-4 h-4 text-[#6B6B76] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 mt-2 rounded-[12px] font-semibold text-[15px] text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{
                  background: 'linear-gradient(90deg, #8B5CF6, #38BDF8)',
                }}
              >
                {isLoading ? <span>Processing...</span> : <span>Send Reset Link →</span>}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-[12px] text-[#6B6B76]">
          <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
