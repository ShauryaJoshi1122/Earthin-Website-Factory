'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ScrollText, Shield, User, Clock, Terminal, Search, Loader2 } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.logs) setLogs(data.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resourceType.toLowerCase().includes(search.toLowerCase()) ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Audit Trail</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Immutable security ledger of all administrative and operator actions
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-text-muted ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit trail by action, user, or resource..."
          className="bg-transparent border-none text-xs text-text-primary placeholder:text-text-muted focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading audit trail...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center text-xs text-text-muted">
          No audit records found.
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden glow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sidebar border-b border-card-border text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-sidebar/40 transition">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-primary font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                      {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-text-primary font-medium whitespace-nowrap">
                      {log.userName || log.userEmail || 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted font-mono text-[11px] whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5 text-text-muted font-mono text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

