'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Settings,
  Compass,
  BookOpen,
  Layers,
  Award,
  Bell,
  Zap,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const adminLinks = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
    { href: '/admin/settings', label: 'Content Settings', icon: Settings },
  ];

  const studentLinks = [
    { href: '/dashboard?tab=overview', label: 'Overview & DNA', icon: Compass },
    { href: '/dashboard?tab=study', label: 'Study Guides', icon: BookOpen },
    { href: '/dashboard?tab=flashcards', label: 'Flashcards', icon: Layers },
    { href: '/dashboard?tab=progress', label: 'Mastery Progress', icon: Award },
    { href: '/student/announcements', label: 'Dispatches', icon: Bell },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-full md:w-64 lg:w-72 shrink-0 border-r border-white/[0.08] bg-[#08090E]/60 backdrop-blur-xl p-6 flex flex-col justify-between self-stretch">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 px-1">
          {role === 'admin' ? (
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          ) : (
            <GraduationCap className="w-4 h-4 text-sky-400" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 font-mono">
            {role === 'admin' ? 'Admin Command' : 'Scholar Portal'}
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 text-[13px] font-medium py-2.5 px-3.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'text-white bg-violet-500/15 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/[0.08] mt-8 space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono block px-1">
          Challenge Mode
        </span>
        <Link
          href="/arena"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-[13px] text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200/50" />
          <span>Launch Arena</span>
        </Link>
      </div>
    </aside>
  );
}
