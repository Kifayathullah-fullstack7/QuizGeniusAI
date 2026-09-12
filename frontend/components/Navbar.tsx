'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Sparkles,
  User,
  LogOut,
  Shield,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getAIStatus, AIStatus } from '@/lib/api';
import { QuizGeniusLogo } from '@/components/branding/QuizGeniusLogo';
import QChatDrawer from '@/components/QChatDrawer';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isQChatOpen, setIsQChatOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAIStatusOpen, setIsAIStatusOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    getAIStatus().then(setAIStatus).catch(() => {});
    const interval = setInterval(() => {
      getAIStatus().then(setAIStatus).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const isLpuReady = aiStatus?.groq_available !== false;
  const statusLabel = isLpuReady ? 'LPU Engine Ready' : 'Fallback Active';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#08090E]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <QuizGeniusLogo />

          {/* Desktop Navigation Segmented Pill Bar */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                pathname === '/'
                  ? 'bg-white/[0.09] text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Workspace
            </Link>

            <Link
              href="/arena"
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                pathname === '/arena'
                  ? 'bg-white/[0.09] text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Challenge Arena
            </Link>

            <Link
              href="/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                pathname.startsWith('/dashboard') || pathname.startsWith('/student')
                  ? 'bg-white/[0.09] text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Student Hub
            </Link>

            <button
              type="button"
              onClick={() => setIsQChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-violet-300 hover:text-violet-100 hover:bg-violet-500/15 border border-transparent hover:border-violet-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Q-Chat</span>
            </button>
          </nav>

          {/* Right Area: Status Pill & Auth */}
          <div className="flex items-center gap-3">
            
            {/* AI Runtime Telemetry Status Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAIStatusOpen(!isAIStatusOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.16] text-[12px] text-zinc-200 transition-all cursor-pointer backdrop-blur-md shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLpuReady ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isLpuReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </span>
                <span className="font-medium text-[11.5px] tracking-tight">{statusLabel}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isAIStatusOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-[#11131E] border border-white/[0.12] rounded-[14px] p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
                  onMouseLeave={() => setIsAIStatusOpen(false)}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2.5">
                    <span className="text-[12px] font-medium text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-violet-400" />
                      Runtime Telemetry
                    </span>
                    <span className="text-[10px] uppercase font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                      {aiStatus?.active_provider || 'Groq LPU'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#08090E] border border-white/[0.05]">
                      <div>
                        <p className="text-white font-medium">Groq LPU Cloud</p>
                        <p className="text-[10px] text-zinc-500">{aiStatus?.groq_model || 'llama-3.3-70b'}</p>
                      </div>
                      <span className={`text-[10px] font-semibold ${aiStatus?.groq_available !== false ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {aiStatus?.groq_available !== false ? 'ONLINE' : 'STANDBY'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#08090E] border border-white/[0.05]">
                      <div>
                        <p className="text-white font-medium">Autonomous Fallback</p>
                        <p className="text-[10px] text-zinc-500">Self-Healing Decks</p>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-400">ACTIVE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-[13px] text-zinc-200 transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 text-[10px] font-bold">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline capitalize font-medium">{user.username}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-[#11131E] border border-white/[0.12] rounded-[14px] p-1.5 shadow-2xl z-50 backdrop-blur-2xl"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <Link
                      href="/student"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-[12px] text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      Scholar Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-amber-400 hover:bg-white/[0.05] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Admin Center
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[12.5px] font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-violet-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Log In
              </Link>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#08090E]/95 backdrop-blur-2xl px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === '/' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Workspace
            </Link>
            <Link
              href="/arena"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === '/arena' ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Challenge Arena
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                pathname.startsWith('/dashboard') || pathname.startsWith('/student')
                  ? 'bg-white/[0.08] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Student Hub
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsQChatOpen(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-violet-300 hover:bg-violet-500/10"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              Q-Chat Diagnostic Tutor
            </button>
          </div>
        )}
      </header>

      {/* Persistent Q-Chat Drawer */}
      <QChatDrawer 
        isOpen={isQChatOpen} 
        onClose={() => setIsQChatOpen(false)} 
        initialTopic="Cognitive Diagnostics & Distributed Reasoning"
      />
    </>
  );
}
