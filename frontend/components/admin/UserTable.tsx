'use client';

import React from 'react';

interface UserItem {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  last_login_at?: string;
}

interface UserTableProps {
  users: UserItem[];
  onDeactivate?: (userId: string) => void;
}

export function UserTable({ users, onDeactivate }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-[#9A9AA6] glass-panel rounded-[12px]">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-panel rounded-[12px]">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-white/10 bg-white/[0.02] text-[#6B6B76] micro-label">
          <tr>
            <th className="p-3.5">User</th>
            <th className="p-3.5">Role</th>
            <th className="p-3.5">Status</th>
            <th className="p-3.5">Last Login</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-[#9A9AA6]">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/[0.02]">
              <td className="p-3.5">
                <span className="font-medium text-white block">{u.username}</span>
                <span className="text-[11px] font-mono text-[#6B6B76]">{u.email}</span>
              </td>
              <td className="p-3.5">
                <span className="capitalize px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/10 text-white">
                  {u.role}
                </span>
              </td>
              <td className="p-3.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    u.status === 'active'
                      ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20'
                      : 'bg-[#F472B6]/10 text-[#F472B6] border border-[#F472B6]/20'
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="p-3.5 font-mono text-[11px]">
                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
              </td>
              <td className="p-3.5 text-right">
                {u.status === 'active' && onDeactivate && (
                  <button
                    type="button"
                    onClick={() => onDeactivate(u.id)}
                    className="px-2.5 py-1 rounded-[6px] text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
