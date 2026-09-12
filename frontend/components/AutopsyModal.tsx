'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, ArrowRight, XCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AutopsyResponse } from '@/lib/api';

interface AutopsyModalProps {
  isOpen: boolean;
  autopsy: AutopsyResponse | null;
  chosenText: string;
  chosenOptionId: string;
  correctText: string;
  correctOptionId: string;
  onClose: () => void;
}

export function AutopsyModal({
  isOpen,
  autopsy,
  chosenText,
  chosenOptionId,
  correctText,
  correctOptionId,
  onClose,
}: AutopsyModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !autopsy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#08090E]/80 backdrop-blur-md overflow-y-auto">
      {/* Background glow pulse in Autopsy Pink */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-[#F472B6]/15 rounded-full blur-[140px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        className="relative w-full max-w-2xl rounded-[16px] bg-[rgba(17,19,30,0.92)] border border-[#F472B6]/40 p-6 md:p-8 shadow-[0_0_50px_rgba(244,114,182,0.25)] text-[#FFFFFF] overflow-hidden backdrop-blur-[16px]"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-[#F472B6]/15 text-[#F472B6] border border-[#F472B6]/30">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] uppercase tracking-[0.05em] text-[#F472B6] font-semibold">
                  Cognitive Autopsy
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/25">
                  Diagnosis Complete
                </span>
              </div>
              <h3 className="text-[18px] md:text-[20px] font-bold text-[#FFFFFF] tracking-tight mt-0.5">
                {autopsy.fallacy_name}
              </h3>
            </div>
          </div>
        </div>

        {/* Option Comparison Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Chosen Option */}
          <div className="p-3.5 rounded-[12px] bg-[#F472B6]/5 border border-[#F472B6]/25">
            <div className="flex items-center gap-1.5 text-[12px] text-[#F472B6] font-semibold mb-1.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>You Selected ({chosenOptionId})</span>
            </div>
            <p className="text-[12px] text-[#9A9AA6] font-mono leading-relaxed line-clamp-3">
              {chosenText}
            </p>
          </div>

          {/* Correct Option */}
          <div className="p-3.5 rounded-[12px] bg-[#4ADE80]/5 border border-[#4ADE80]/25">
            <div className="flex items-center gap-1.5 text-[12px] text-[#4ADE80] font-semibold mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correct Reality ({correctOptionId})</span>
            </div>
            <p className="text-[12px] text-[#9A9AA6] font-mono leading-relaxed line-clamp-3">
              {correctText}
            </p>
          </div>
        </div>

        {/* Mental Model Diagnostic */}
        <div className="mt-5 p-4 rounded-[12px] bg-[#08090E]/60 border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#8B5CF6] uppercase tracking-[0.05em] mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Why Your Brain Got It Wrong</span>
          </div>
          <p className="text-[13px] md:text-[14px] text-[#FFFFFF] leading-relaxed">
            {autopsy.mental_model_diagnostic}
          </p>
        </div>

        {/* 10-Second Mental Cure */}
        <div className="mt-4 p-4 rounded-[12px] bg-gradient-to-r from-[#8B5CF6]/15 via-[#22D3EE]/10 to-[#8B5CF6]/15 border border-[#22D3EE]/30 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[8px] bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#22D3EE] uppercase tracking-[0.05em]">
                The 10-Second Mental Fix
              </div>
              <p className="text-[13px] md:text-[14px] text-[#FFFFFF] font-medium leading-relaxed mt-1">
                {autopsy.ten_second_cure}
              </p>
            </div>
          </div>
        </div>

        {/* Grounded Study Material Source Reference */}
        {autopsy.source_reference && (
          <div className="mt-3 p-3 rounded-[10px] bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[12px] text-[#22D3EE] flex items-center gap-2">
            <span>📚 Grounded in study material: <strong>{autopsy.source_reference}</strong></span>
          </div>
        )}

        {/* Footer with Continue CTA */}
        <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="text-[12px] text-[#6B6B76] font-mono">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#FFFFFF]">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-[#FFFFFF]">Esc</kbd> to proceed
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-semibold text-[14px] bg-[#F472B6] hover:bg-[#F472B6]/90 text-[#FFFFFF] transition-all shadow-[0_0_20px_rgba(244,114,182,0.4)] cursor-pointer"
          >
            <span>Internalize & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
