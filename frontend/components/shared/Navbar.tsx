'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Brain, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { user, role, logout } = useAuth();

  return (
    <nav className="w-full border-b border-[rgba(255,255,255,0.08)] bg-[rgba(8,9,14,0.9)] backdrop-blur-[16px] sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-[8px] bg-[#11131E] border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6]">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-bold text-[15px] text-white">QuizGenius AI</span>
        </Link>
        {role && (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-white/10 text-[#9A9AA6] bg-white/[0.02]">
            {role} Portal
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#9A9AA6]">
              <UserIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="text-white font-medium">{user.username}</span>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-white/10 text-[12px] text-[#9A9AA6] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
