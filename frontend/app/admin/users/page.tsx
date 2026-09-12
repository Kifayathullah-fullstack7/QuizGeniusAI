'use client';

import React, { useState, useEffect } from 'react';
import { UserTable } from '@/components/admin/UserTable';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { UserPlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newProgram, setNewProgram] = useState('Computer Science');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${baseUrl}/admin/users${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this account?')) return;

    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/users/${userId}/deactivate`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast.success('Account deactivated successfully');
        fetchUsers();
      } else {
        toast.error('Failed to deactivate account');
      }
    } catch {
      toast.error('Network error while deactivating account');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: 'student',
          full_name: newFullName.trim() || undefined,
          program: newProgram,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      toast.success(`Student ${data.username} created successfully!`);
      setShowAddModal(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating user';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">
            User Management
          </h1>
          <p className="text-[13px] text-[#9A9AA6] mt-1">
            Provision and audit student and administrative accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white text-[13px] font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student Account</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-[#0A0C14] border border-[rgba(255,255,255,0.08)] text-white text-[13px] placeholder-[#9A9AA6] focus:outline-none focus:border-[#8B5CF6]"
        />
        <Search className="w-4 h-4 text-[#6B6B76] absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : (
        <UserTable users={users} onDeactivate={handleDeactivate} />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-[16px] shadow-2xl">
            <h3 className="text-[18px] font-bold text-white mb-4">
              Provision Student Account
            </h3>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
              <div>
                <label className="micro-label text-[#8B5CF6] mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="micro-label text-[#8B5CF6] mb-1.5 block">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="janedoe"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
                  required
                />
              </div>

              <div>
                <label className="micro-label text-[#8B5CF6] mb-1.5 block">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane@university.edu"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
                  required
                />
              </div>

              <div>
                <label className="micro-label text-[#8B5CF6] mb-1.5 block">
                  Temporary Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
                  required
                />
              </div>

              <div>
                <label className="micro-label text-[#8B5CF6] mb-1.5 block">
                  Program
                </label>
                <input
                  type="text"
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-3 py-2 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-[8px] text-[13px] text-[#9A9AA6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-[8px] text-[13px] font-semibold bg-[#8B5CF6] text-white hover:bg-[#8B5CF6]/90 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
