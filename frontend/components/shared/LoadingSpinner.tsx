import React from 'react';

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#8B5CF6] animate-spin" />
      <span className="text-[13px] text-[#9A9AA6]">{text}</span>
    </div>
  );
}
