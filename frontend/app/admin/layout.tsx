'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen flex flex-col bg-transparent text-white">
        <Navbar />
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-10 min-w-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
