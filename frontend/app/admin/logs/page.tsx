'use client';

import React, { useState, useEffect } from 'react';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/audit-logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        toast.error('Failed to load activity logs');
      }
    } catch {
      toast.error('Network error loading logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-[#8B5CF6]" />
            <h1 className="text-[24px] font-bold text-white tracking-tight">
              Activity & Audit Logs
            </h1>
          </div>
          <p className="text-[13px] text-[#9A9AA6]">
            Append-only record of security events, administrative modifications, and logins.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#11131E] hover:bg-[#1A1D2D] border border-white/10 text-white text-[13px] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Retrieving audit stream..." />
      ) : (
        <AuditLogTable logs={logs} />
      )}
    </div>
  );
}
