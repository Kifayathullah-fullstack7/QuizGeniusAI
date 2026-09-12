'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ContentSettingsPage() {
  const [config, setConfig] = useState<{
    maintenance_mode: boolean;
    announcement_banner: string;
    allow_registrations: boolean;
  }>({
    maintenance_mode: false,
    announcement_banner: '',
    allow_registrations: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/admin/config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('System settings saved successfully');
      } else {
        toast.error('Failed to update system settings');
      }
    } catch {
      toast.error('Network error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading system configuration..." />;
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-[#8B5CF6]" />
          <h1 className="text-[24px] font-bold text-white tracking-tight">
            System & Content Settings
          </h1>
        </div>
        <p className="text-[13px] text-[#9A9AA6]">
          Configure portal-wide runtime flags, banners, and operational controls.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-6 sm:p-8 rounded-[16px] flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium text-white">
            System Announcement Banner
          </label>
          <input
            type="text"
            value={config.announcement_banner}
            onChange={(e) => setConfig({ ...config, announcement_banner: e.target.value })}
            placeholder="e.g. Welcome to the Academic Portal"
            className="w-full px-4 py-2.5 rounded-[10px] bg-[#0A0C14] border border-white/10 text-white text-[13px] focus:outline-none focus:border-[#8B5CF6]"
          />
          <p className="text-[12px] text-[#6B6B76]">
            Broadcasted to all student and admin dashboards at the top of the interface.
          </p>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-white">Maintenance Mode</p>
              <p className="text-[12px] text-[#6B6B76]">
                When enabled, non-admin users will receive a maintenance notice upon login.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.maintenance_mode}
              onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
              className="w-5 h-5 accent-[#8B5CF6] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-[14px] font-medium text-white">Allow Self Registrations</p>
              <p className="text-[12px] text-[#6B6B76]">
                Permit incoming student account registrations without administrator invitation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.allow_registrations}
              onChange={(e) => setConfig({ ...config, allow_registrations: e.target.checked })}
              className="w-5 h-5 accent-[#8B5CF6] rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
