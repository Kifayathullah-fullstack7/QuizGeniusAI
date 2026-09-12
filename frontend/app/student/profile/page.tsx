'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { ProfileCard } from '@/components/student/ProfileCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { UserCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';

export default function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [program, setProgram] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(user);

  useEffect(() => {
    if (user) {
      setProfileUser(user);
      setFullName(user.profile?.full_name || '');
      setProgram(user.profile?.program || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/student/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          program: program.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfileUser(updated);
        await refreshUser();
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('Network error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profileUser) {
    return <LoadingSpinner text="Loading profile details..." />;
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCheck className="w-5 h-5 text-[#8B5CF6]" />
          <h1 className="text-[24px] font-bold text-white tracking-tight">
            Student Profile
          </h1>
        </div>
        <p className="text-[13px] text-[#9A9AA6]">
          View your enrolled student record and manage your personal details.
        </p>
      </div>

      <ProfileCard user={profileUser} />

      {/* Self-edit form (restricted to personal info, role/status immutable) */}
      <form onSubmit={handleUpdate} className="glass-panel p-6 sm:p-8 rounded-[16px] flex flex-col gap-4">
        <h3 className="text-[16px] font-bold text-white mb-2">Edit Details</h3>

        <div>
          <label className="micro-label text-[#8B5CF6] mb-1.5 block">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div>
          <label className="micro-label text-[#8B5CF6] mb-1.5 block">Degree / Major Program</label>
          <input
            type="text"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="Computer Science & Engineering"
            className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="p-3 rounded-[8px] bg-white/[0.02] border border-white/5 text-[12px] text-[#6B6B76]">
          Note: Account security roles, email identity, and enrollment status are managed exclusively by academic administrators.
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
