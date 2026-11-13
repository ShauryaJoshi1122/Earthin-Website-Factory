'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Server,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Layers,
  Database,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react';

export default function HostingPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<number | null>(null);

  const loadConnections = () => {
    setLoading(true);
    fetch('/api/hosting')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.connections) {
          setConnections(data.connections);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await fetch('/api/hosting/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('cPanel Connection Successful! Detected capabilities updated.');
        loadConnections();
      } else {
        alert(data.error || 'Connection test failed.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove hosting connection "${name}"?`)) return;
    try {
      const res = await fetch(`/api/hosting/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete connection');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Hosting Connections</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage authorized cPanel hosting servers and database provisioning engines
          </p>
        </div>
        <Link
          href="/hosting/add"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Hosting Connection</span>
        </Link>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading hosting connections...</span>
        </div>
      ) : connections.length === 0 ? (
        <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center">
          <Server className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-text-primary">No hosting connections configured</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Connect an internal Earthin cPanel or client cPanel account using authorized cPanel API Tokens.
          </p>
          <div className="mt-4">
            <Link
              href="/hosting/add"
              className="inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Connect First cPanel Account</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-card border border-card-border rounded-2xl p-6 glow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar border border-card-border flex items-center justify-center text-primary">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{conn.name}</h3>
                      <div className="text-xs text-text-muted font-mono">{conn.username}@{conn.serverUrl}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      conn.status === 'active'
                        ? 'bg-success-subtle text-success'
                        : 'bg-error-subtle text-error'
                    }`}
                  >
                    {conn.status}
                  </span>
                </div>

                {conn.lastError && (
                  <div className="mb-4 p-2.5 rounded-lg bg-error-subtle border border-error/30 text-error text-[11px]">
                    {conn.lastError}
                  </div>
                )}

                {/* Capabilities */}
                <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-sidebar/50 rounded-xl border border-card-border/60">
                  <div>
                    <span className="text-text-muted block text-[10px]">PHP Runtime</span>
                    <span className="font-medium text-text-primary">
                      PHP {conn.capabilities?.phpVersion || '8.3'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Database Engine</span>
                    <span className="font-medium text-text-primary">
                      MySQL {conn.capabilities?.mysqlVersion || '8.0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Disk Storage</span>
                    <span className="font-medium text-text-primary">
                      {conn.capabilities?.diskUsedMb ? `${conn.capabilities.diskUsedMb} MB` : 'Unlimited / Unmetered'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px]">Detected Domains</span>
                    <span className="font-medium text-primary">
                      {conn.capabilities?.detectedDomains?.length || 0} vhosts
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-card-border/60 flex items-center justify-between">
                <button
                  onClick={() => handleTest(conn.id)}
                  disabled={testingId === conn.id}
                  className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-3 py-1.5 rounded-lg border border-card-border transition flex items-center gap-1.5"
                >
                  {testingId === conn.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                  )}
                  <span>Test Health</span>
                </button>

                <button
                  onClick={() => handleDelete(conn.id, conn.name)}
                  className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition"
                  title="Remove Connection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

