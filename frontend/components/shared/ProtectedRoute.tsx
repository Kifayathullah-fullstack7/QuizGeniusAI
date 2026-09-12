'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'student';
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <LoadingSpinner text="Authenticating session..." />;
  }

  if (!user) {
    return null;
  }

  if (allowedRole && role !== allowedRole) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Forbidden</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          This area requires <span className="font-semibold text-white">{allowedRole}</span> privileges.
          Your current account role is <span className="font-semibold text-violet-400">{role}</span>.
        </p>
        <button
          type="button"
          onClick={() => router.push(role === 'admin' ? '/admin' : '/student')}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
