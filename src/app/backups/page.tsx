'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Database,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // Create backup modal state
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | null>(null);
  const [backupType, setBackupType] = useState<'database' | 'full' | 'media'>('database');
  const [creating, setCreating] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/backups').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/websites').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([bData, wData]) => {
        if (bData?.backups) setBackups(bData.backups);
        if (wData?.websites) {
          setWebsites(wData.websites);
          if (wData.websites.length > 0) setSelectedWebsiteId(wData.websites[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsiteId) return;

    setCreating(true);
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: selectedWebsiteId, backupType }),
      });
      if (res.ok) {
        alert('Backup created and verified successfully.');
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create backup');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm(`Restore website from Backup #${id}? Existing database records will be replaced with backup snapshot.`)) return;

    setRestoringId(id);
    try {
      const res = await fetch(`/api/backups/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Backup restored successfully.');
        loadData();
      } else {
        alert(data.error || 'Restore failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Website Backups</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cryptographically verified database and media archives in secure storage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Backup Form (1 col) */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Create Snapshot Backup</h2>
          {websites.length === 0 ? (
            <div className="text-xs text-text-muted">No websites available for backup.</div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Select News Website</label>
                <select
                  value={selectedWebsiteId || ''}
                  onChange={(e) => setSelectedWebsiteId(parseInt(e.target.value, 10))}
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                >
                  {websites.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.primaryDomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Backup Type</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="database">MySQL Database Snapshot (.sql)</option>
                  <option value="full">Full Website Archive (Files + Database)</option>
                  <option value="media">Uploaded Media Directory (/media/)</option>
                </select>
              </div>

              <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/60 text-[11px] text-text-muted leading-relaxed">
                Backups are stored in private storage and hashed with SHA-256 for bit-level integrity verification.
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg shadow-md shadow-primary/20 transition flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>Create Verified Backup</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Backups List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading backup archives...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center text-xs text-text-muted">
              No backups recorded yet. Create a snapshot using the form.
            </div>
          ) : (
            backups.map((b) => (
              <div key={b.id} className="bg-card border border-card-border rounded-2xl p-5 glow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sidebar border border-card-border flex items-center justify-center text-primary shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary">
                        Backup #{b.id} — {b.backupType.toUpperCase()}
                      </h3>
                      {b.integrityVerified && (
                        <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-semibold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted mt-1 font-mono">
                      <span>Website ID #{b.websiteId}</span>
                      <span className="mx-2">•</span>
                      <span>{Math.round(b.sizeBytes / 1024)} KB</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-mono mt-1 truncate max-w-md">
                      SHA256: {b.checksumSha256}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(b.id)}
                    disabled={restoringId === b.id}
                    className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-3.5 py-2 rounded-lg border border-card-border transition flex items-center gap-1.5"
                  >
                    {restoringId === b.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                    )}
                    <span>Restore</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

