'use client';

import React from 'react';
import { User, Mail, GraduationCap, Calendar } from 'lucide-react';

interface ProfileCardProps {
  user: {
    username: string;
    email: string;
    profile?: {
      full_name?: string;
      program?: string;
      enrollment_date?: string;
    };
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="p-6 rounded-[12px] glass-panel max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#11131E] border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] text-xl font-bold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-white">
            {user.profile?.full_name || user.username}
          </h2>
          <span className="text-[13px] text-[#9A9AA6]">Student Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
        <div className="p-3 rounded-[8px] bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <Mail className="w-4 h-4 text-[#8B5CF6]" />
          <div>
            <span className="text-[11px] text-[#6B6B76] block">Email</span>
            <span className="text-white font-mono text-[12px]">{user.email}</span>
          </div>
        </div>

        <div className="p-3 rounded-[8px] bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <GraduationCap className="w-4 h-4 text-[#22D3EE]" />
          <div>
            <span className="text-[11px] text-[#6B6B76] block">Program</span>
            <span className="text-white font-medium">{user.profile?.program || 'General Computer Science'}</span>
          </div>
        </div>

        <div className="p-3 rounded-[8px] bg-white/[0.02] border border-white/5 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[#4ADE80]" />
          <div>
            <span className="text-[11px] text-[#6B6B76] block">Status</span>
            <span className="text-[#4ADE80] font-medium">Active Enrolled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
