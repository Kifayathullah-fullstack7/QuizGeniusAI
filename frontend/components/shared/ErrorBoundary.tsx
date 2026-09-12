'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 glass-panel m-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-[#F472B6] mx-auto mb-3" />
          <h3 className="text-[18px] font-bold text-white mb-2">Something went wrong</h3>
          <p className="text-[13px] text-[#9A9AA6] mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
