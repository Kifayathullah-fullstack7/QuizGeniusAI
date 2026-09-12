'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Terminal, CornerDownLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { ChallengeQuestion } from '@/lib/api';

interface QuestionCardProps {
  question: ChallengeQuestion;
  selectedOptionId: string | null;
  onSelectOption: (optionId: 'A' | 'B' | 'C' | 'D') => void;
  onSubmit: () => void;
  showHint: boolean;
  onToggleHint: () => void;
  isSubmitting?: boolean;
}

export function QuestionCard({
  question,
  selectedOptionId,
  onSelectOption,
  onSubmit,
  showHint,
  onToggleHint,
  isSubmitting = false,
}: QuestionCardProps) {
  const numberKeyMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Prompt Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-violet-400 font-semibold px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20">
              {question.type} Challenge
            </span>
            {question.source_document && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1">
                📚 Based on: {question.source_document}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleHint}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30"
            title="Press 'H' for hint"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? 'Hide Hint' : 'Reveal Hint'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-amber-950/60 rounded border border-amber-500/40 text-amber-200">
              H
            </kbd>
          </button>
        </div>

        <h2 className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed mb-4">
          {question.prompt}
        </h2>

        {/* Code Snippet Box */}
        {question.code_snippet && (
          <div className="mt-4 mb-2 rounded-xl bg-[#030407] border border-white/10 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02] text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                <span>source_code</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
            </div>
            <pre className="p-4 text-xs md:text-sm font-mono text-cyan-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              <code>{question.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* Collapsible Hint Drawer */}
        <AnimatePresence>
          {showHint && question.hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs md:text-sm flex items-start gap-2.5"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Cognitive Clue: </span>
                {question.hint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options List */}
      <div className="grid grid-cols-1 gap-3.5">
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const shortcutKey = idx + 1;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onSelectOption(option.id)}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.992 }}
              className={`w-full text-left p-4 md:p-5 rounded-xl transition-all relative flex items-center justify-between border ${isSelected
                ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-violet-400/50'
                : 'glass-panel hover:border-white/20 hover:bg-white/[0.04]'
                }`}
            >
              <div className="flex items-start gap-3.5 flex-1 pr-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${isSelected
                    ? 'bg-violet-500 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 border border-white/10'
                    }`}
                >
                  {option.id}
                </span>
                <span className={`text-sm md:text-base leading-relaxed ${isSelected ? 'text-white font-medium' : 'text-slate-200'}`}>
                  {option.text}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-violet-400"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                )}
                <kbd className="hidden sm:inline-block px-2 py-1 text-[11px] font-mono rounded bg-white/5 border border-white/10 text-slate-400">
                  {shortcutKey}
                </kbd>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Select 1-4 · Enter to Lock</span>
        </div>

        <button
          type="button"
          disabled={!selectedOptionId || isSubmitting}
          onClick={onSubmit}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${selectedOptionId && !isSubmitting
            ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-95 cursor-pointer'
            : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
        >
          {isSubmitting ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Analyzing Cognitive Pattern...</span>
            </>
          ) : (
            <>
              <span>Submit Answer</span>
              <CornerDownLeft className="w-4 h-4 text-cyan-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
