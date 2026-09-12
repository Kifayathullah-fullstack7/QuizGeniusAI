'use client';

import React from 'react';
import { Users, UserCheck, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats?: {
    total_students: number;
    active_users: number;
    recent_logins: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Students',
      value: stats?.total_students ?? '--',
      sublabel: 'Enrolled scholars',
      icon: Users,
      color: 'text-violet-400',
      bgGlow: 'from-violet-500/10 to-transparent',
      borderColor: 'border-violet-500/20',
    },
    {
      title: 'Active Accounts',
      value: stats?.active_users ?? '--',
      sublabel: 'Verified & active',
      icon: UserCheck,
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Recent Logins',
      value: stats?.recent_logins ?? '--',
      sublabel: 'Past 7 days active',
      icon: Clock,
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 to-transparent',
      borderColor: 'border-cyan-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative p-6 rounded-2xl bg-[#0e101a]/70 border ${card.borderColor} backdrop-blur-xl flex items-center justify-between shadow-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl overflow-hidden group`}
          >
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${card.bgGlow} blur-2xl pointer-events-none`} />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono block mb-1.5">
                {card.title}
              </span>
              <span className="text-3xl font-bold font-mono text-white tracking-tight block">
                {card.value}
              </span>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {card.sublabel}
              </span>
            </div>
            <div className={`p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] ${card.color} shadow-inner group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
