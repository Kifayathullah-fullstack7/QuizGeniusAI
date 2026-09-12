'use client';

import React from 'react';

interface LogItem {
  id: string;
  user_id?: string;
  action: string;
  details?: string;
  created_at: string;
}

export function AuditLogTable({ logs }: { logs: LogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-[#9A9AA6] glass-panel rounded-[12px]">
        No audit log records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-panel rounded-[12px]">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-white/10 bg-white/[0.02] text-[#6B6B76] micro-label">
          <tr>
            <th className="p-3.5">Timestamp</th>
            <th className="p-3.5">Action</th>
            <th className="p-3.5">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-[#9A9AA6]">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-white/[0.02]">
              <td className="p-3.5 font-mono text-[11px] whitespace-nowrap text-[#6B6B76]">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="p-3.5">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-medium">
                  {log.action}
                </span>
              </td>
              <td className="p-3.5 text-[12px] text-white/80 max-w-md truncate">
                {log.details || '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
