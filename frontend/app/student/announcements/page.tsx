'use client';

import React, { useState, useEffect } from 'react';
import { AnnouncementsFeed } from '@/components/student/AnnouncementsFeed';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Megaphone, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/student/announcements`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        toast.error('Failed to load announcements');
      }
    } catch {
      toast.error('Network error loading announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-[#8B5CF6]" />
            <h1 className="text-[24px] font-bold text-white tracking-tight">
              Academic Announcements
            </h1>
          </div>
          <p className="text-[13px] text-[#9A9AA6]">
            Notices, deadlines, and official institutional broadcasts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnnouncements}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#11131E] hover:bg-[#1A1D2D] border border-white/10 text-white text-[13px] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Retrieving campus bulletin..." />
      ) : (
        <AnnouncementsFeed announcements={announcements} />
      )}
    </div>
  );
}
