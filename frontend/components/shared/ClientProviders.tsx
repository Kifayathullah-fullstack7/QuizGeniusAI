'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#11131E',
            color: '#F1F5F9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            fontSize: '13px',
          },
        }}
      />
    </AuthProvider>
  );
}
