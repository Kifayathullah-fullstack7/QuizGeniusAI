'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ScrollText,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { StatsCards } from '@/components/admin/StatsCards';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getApiBaseUrl } from '@/lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<{ total_students: number; active_users: number; recent_logins: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const baseUrl = getApiBaseUrl();
    fetch(`${baseUrl}/admin/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-10 text-white max-w-6xl">
      {/* Top Header & System Posture */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 font-mono">
              Control Center
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            System Overview & Operations
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Academic system administration, real-time AI telemetry feeds, and scholar account management.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
          </Link>
          <Link
            href="/admin/logs"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white text-xs font-medium transition-all"
          >
            <ScrollText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Platform Metrics
          </h2>
          <span className="text-[11px] text-zinc-500 font-mono">Live Telemetry</span>
        </div>
        {isLoading ? (
          <LoadingSpinner text="Fetching administrative telemetry..." />
        ) : (
          <StatsCards stats={stats || undefined} />
        )}
      </div>

      {/* Direct Operations & Infrastructure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Operations Card */}
        <div className="p-6 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                Direct Operations
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Administrative toolset for overseeing enrolled students, role permissions, and historical audit entries.
            </p>

            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                      User Management
                    </p>
                    <p className="text-[11px] text-zinc-500">View users, adjust permissions, and manage credentials</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/admin/logs"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-cyan-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      System Audit Logs
                    </p>
                    <p className="text-[11px] text-zinc-500">Security events, auth activities, and telemetry logs</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Infrastructure & Intelligence Status */}
        <div className="p-6 rounded-2xl bg-[#0e101a]/70 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                AI & Retrieval Infrastructure
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Runtime orchestration, multi-provider model routing, and vector knowledge indexing.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Groq LPU Inference</p>
                    <p className="text-[11px] text-zinc-500">llama-3.3-70b-versatile • Sub-second response</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">ChromaDB Vector Store</p>
                    <p className="text-[11px] text-zinc-500">MiniLM-L6-v2 Embeddings • Semantic Retrieval</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
