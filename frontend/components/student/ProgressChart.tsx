'use client';

import React from 'react';

interface ProgressProps {
  progress?: {
    courses_enrolled: number;
    completed_modules: number;
    average_score: number;
    grade_letter: string;
  };
}

export function ProgressChart({ progress }: ProgressProps) {
  const p = progress || {
    courses_enrolled: 4,
    completed_modules: 18,
    average_score: 92.5,
    grade_letter: 'A',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-2">
        <span className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] block tracking-wider">
          Enrolled Courses
        </span>
        <span className="font-dala-heading text-2xl text-white">
          {p.courses_enrolled}
        </span>
      </div>

      <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-2">
        <span className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] block tracking-wider">
          Completed Units
        </span>
        <span className="font-dala-heading text-2xl text-white">
          {p.completed_modules}
        </span>
      </div>

      <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md space-y-2">
        <span className="font-dala-nav text-[10px] uppercase text-[#9a9a9a] block tracking-wider">
          Average Score
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-dala-heading text-2xl text-[#8052ff]">
            {p.average_score}%
          </span>
          <span className="font-mono text-xs text-[#ffb829]">
            ({p.grade_letter})
          </span>
        </div>
      </div>
    </div>
  );
}
