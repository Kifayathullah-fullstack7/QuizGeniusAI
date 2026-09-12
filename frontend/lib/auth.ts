'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from './api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'student';
  status: string;
  profile?: {
    full_name?: string;
    program?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  role: 'admin' | 'student' | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (token: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data: AuthUser = await res.json();
        setUser(data);
        setRole(data.role);
      } else {
        // Token invalid, clear
        sessionStorage.removeItem('access_token');
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userObj: AuthUser) => {
    sessionStorage.setItem('access_token', token);
    setUser(userObj);
    setRole(userObj.role);
    if (userObj.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/student');
    }
  };

  const logout = async () => {
    const token = sessionStorage.getItem('access_token');
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Ignore network errors on logout
    }
    sessionStorage.removeItem('access_token');
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, role, isLoading, login, logout, refreshUser } },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
