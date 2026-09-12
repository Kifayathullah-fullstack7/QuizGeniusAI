'use client';

import React from 'react';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  published_at: string;
  priority: string;
}

export function AnnouncementsFeed({ announcements }: { announcements: AnnouncementItem[] }) {
  if (announcements.length === 0) {
    return (
      <div className="py-6 font-dala-body-muted text-sm">
        No dispatches at this time.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((item) => (
        <article
          key={item.id}
          className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm space-y-2 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white font-medium">{item.title}</span>
            <span className="text-[#9a9a9a]">{item.published_at}</span>
          </div>
          <p className="font-dala-body-muted text-xs leading-relaxed">
            {item.content}
          </p>
        </article>
      ))}
    </div>
  );
}
