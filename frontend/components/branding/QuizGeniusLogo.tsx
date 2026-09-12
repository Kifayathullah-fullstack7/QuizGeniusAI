'use client';

import React from 'react';
import Link from 'next/link';

interface QuizGeniusLogoProps {
  className?: string;
  showEditionBadge?: boolean;
}

export function QuizGeniusLogo({ className = '', showEditionBadge = true }: QuizGeniusLogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 select-none group shrink-0 ${className}`}>
      {/* Sleek rounded icon containing neural brain glyph */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#181926] to-[#090A10] border border-violet-500/40 flex items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.25)] transition-all duration-200 group-hover:border-violet-400 group-hover:shadow-[0_0_18px_rgba(139,92,246,0.45)] group-hover:scale-105">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-violet-400"
        >
          {/* Neural Brain / Node Glyph */}
          <path
            d="M9.5 2A4.5 4.5 0 0 0 5 6.5c0 .41.05.8.15 1.18A4.5 4.5 0 0 0 3 11.5c0 1.94 1.23 3.6 2.96 4.22A4.5 4.5 0 0 0 9.5 21h.5a4.5 4.5 0 0 0 4.5-4.5v-1a4.5 4.5 0 0 0 3.54-7.28A4.5 4.5 0 0 0 19 6.5 4.5 4.5 0 0 0 14.5 2h-5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="9" r="1.5" fill="#38BDF8" />
          <circle cx="15" cy="9" r="1.5" fill="#38BDF8" />
          <circle cx="12" cy="14" r="1.5" fill="#8B5CF6" />
          <path d="M9 9l3 5 3-5" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark & Edition Badge */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-[15px] tracking-tight text-white flex items-center gap-1">
          QuizGenius <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400 font-extrabold">AI</span>
        </span>

        {showEditionBadge && (
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase text-violet-300 border border-violet-500/25 bg-violet-500/10 backdrop-blur-sm">
            <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            Cognitive Autopsy
          </span>
        )}
      </div>
    </Link>
  );
}

export default QuizGeniusLogo;
