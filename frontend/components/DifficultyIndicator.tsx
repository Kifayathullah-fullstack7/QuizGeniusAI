'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, TrendingDown, TrendingUp } from 'lucide-react';

interface DifficultyIndicatorProps {
  conceptTag: string;
  difficulty: number; // 1 to 5
  lastDelta?: number; // +1, -1, or 0
}

export function DifficultyIndicator({
  conceptTag,
  difficulty,
  lastDelta = 0,
}: DifficultyIndicatorProps) {
  const clampedDifficulty = Math.max(1, Math.min(5, difficulty));

  const getDifficultyLabel = (lvl: number) => {
    switch (lvl) {
      case 1: return { text: 'Fundamental', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
      case 2: return { text: 'Intermediate', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' };
      case 3: return { text: 'Proficient', color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30' };
      case 4: return { text: 'Advanced', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
      case 5: return { text: 'Expert Architect', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' };
      default: return { text: 'Adaptive', color: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
    }
  };

  const badge = getDifficultyLabel(clampedDifficulty);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl glass-panel border border-white/10 text-sm">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-violet-400" />
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Concept:</span>
        <span className="font-mono text-xs text-slate-200 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 truncate max-w-[280px]">
          {conceptTag}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title={`Adaptive Difficulty: Level ${clampedDifficulty}/5`}>
          {[1, 2, 3, 4, 5].map((level) => {
            const active = level <= clampedDifficulty;
            return (
              <motion.div
                key={level}
                initial={false}
                animate={{
                  scale: active ? [1, 1.15, 1] : 1,
                  backgroundColor: active
                    ? clampedDifficulty >= 4
                      ? '#F43F5E'
                      : clampedDifficulty >= 3
                        ? '#8B5CF6'
                        : '#06B6D4'
                    : 'rgba(255, 255, 255, 0.1)',
                }}
                transition={{ duration: 0.3 }}
                className={`w-3.5 h-3.5 rounded-sm transition-all ${active ? 'shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''
                  }`}
              />
            );
          })}
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.color} ${badge.border}`}>
          <span>Level {clampedDifficulty}</span>
          <span className="hidden sm:inline">· {badge.text}</span>
        </div>

        <AnimatePresence>
          {lastDelta !== 0 && (
            <motion.div
              initial={{ opacity: 0, x: lastDelta > 0 ? -10 : 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${lastDelta > 0
                ? 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
                : 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30'
                }`}
            >
              {lastDelta > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  <span>+Difficulty</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" />
                  <span>Calibrated Down</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
