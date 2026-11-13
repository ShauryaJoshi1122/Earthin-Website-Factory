'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Globe,
  Server,
  ShieldCheck,
  ExternalLink,
  Layers,
  Palette,
  Database,
  Rocket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Loader2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function WebsiteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetails = () => {
    fetch(`/api/websites/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData) setData(resData);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCreateBackup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: parseInt(id, 10), backupType: 'database' }),
      });
      if (res.ok) {
        alert('Database backup created and verified successfully.');
        loadDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create backup');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstallOrUpdate = async () => {
    if (!confirm('Trigger a new deployment execution for this website?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: parseInt(id, 10), jobType: 'update' }),
      });
      const resData = await res.json();
      if (res.ok && resData?.deployment?.id) {
        router.push(`/deployments/${resData.deployment.id}`);
      } else {
        alert(resData.error || 'Failed to trigger deployment');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-64 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading website details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.website) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-text-muted">Website not found.</div>
      </DashboardLayout>
    );
  }

  const { website, branding, domains, administrators, plugins, deployments, backups, databaseName } = data;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-card border border-card-border flex items-center justify-center overflow-hidden shrink-0">
            {branding?.mainLogoUrl ? (
              <img src={branding.mainLogoUrl} alt={website.name} className="w-full h-full object-contain p-1.5" />
            ) : (
              <Globe className="w-7 h-7 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-text-primary">{website.name}</h1>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  website.status === 'active'
                    ? 'bg-success-subtle text-success'
                    : website.status === 'provisioning'
                    ? 'bg-primary-subtle text-primary animate-pulse'
                    : 'bg-error-subtle text-error'
                }`}
              >
                {website.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
              <a
                href={`https://${website.primaryDomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono flex items-center gap-1"
              >
                <span>{website.primaryDomain}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <span>cPanel: {website.hostingName || 'Main Server'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`https://${website.primaryDomain}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-3.5 py-2 rounded-lg border border-card-border transition flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-text-muted" />
            <span>Visit Site</span>
          </a>

          <a
            href={`https://${website.primaryDomain}/admin`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-3.5 py-2 rounded-lg border border-card-border transition flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-text-muted" />
            <span>CMS Admin</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </a>

          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-3.5 py-2 rounded-lg border border-card-border transition flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-text-muted" />
            <span>Create Backup</span>
          </button>

          <button
            onClick={handleReinstallOrUpdate}
            disabled={actionLoading}
            className="text-xs bg-primary hover:bg-primary-hover text-white font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-primary/20 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trigger Update</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Config & Branding (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Website Configuration</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Title</span>
                <span className="font-medium text-text-primary">{website.title}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Tagline</span>
                <span className="font-medium text-text-primary">{website.tagline || 'None'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Document Root</span>
                <span className="font-mono text-text-primary">{website.documentRoot}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Contact Email</span>
                <span className="font-medium text-text-primary">{website.contactEmail}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Database Name</span>
                <span className="font-mono text-primary font-semibold">{databaseName || 'Provisioned on cPanel'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">SSL Status</span>
                <span className="font-semibold text-success">{website.sslStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Active Plugins */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Active Newsroom Plugins</h2>
            {plugins?.length === 0 ? (
              <div className="text-xs text-text-muted">No additional plugins activated.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plugins.map((plug: any) => (
                  <div key={plug.id} className="p-3 bg-sidebar/50 rounded-xl border border-card-border/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-text-primary">{plug.name}</div>
                      <div className="text-[10px] text-text-muted">{plug.category} • v{plug.version}</div>
                    </div>
                    <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deployment History */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">Deployment Runs</h2>
              <span className="text-xs text-text-muted">{deployments?.length || 0} jobs</span>
            </div>

            <div className="space-y-2.5">
              {deployments?.map((dep: any) => (
                <Link
                  key={dep.id}
                  href={`/deployments/${dep.id}`}
                  className="block p-3 rounded-xl bg-sidebar/50 border border-card-border hover:border-primary/50 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-text-primary">Job #{dep.id}</span>
                      <span className="text-text-muted font-mono text-[11px]">({dep.jobType})</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dep.status === 'completed'
                          ? 'bg-success-subtle text-success'
                          : dep.status === 'running'
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-error-subtle text-error'
                      }`}
                    >
                      {dep.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    {new Date(dep.createdAt).toLocaleString()} • Step {dep.currentStepNumber}/{dep.totalSteps}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Branding Preview & Backups (1 col) */}
        <div className="space-y-6">
          {/* Branding Palette */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Branding & Theme</h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Theme</span>
                <span className="font-semibold text-text-primary">{website.selectedThemeSlug}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-card-border"
                  style={{ backgroundColor: branding?.primaryColor || '#d60000' }}
                />
                <span className="font-mono text-xs">{branding?.primaryColor || '#d60000'}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Header Style</span>
                <span className="text-text-secondary">{branding?.headerStyle || 'aajtak_broadcast'}</span>
              </div>
            </div>
          </div>

          {/* Backups */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Backups</h2>
            {backups?.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6">
                No backups recorded yet. Click "Create Backup" above.
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((b: any) => (
                  <div key={b.id} className="p-3 bg-sidebar/50 rounded-xl border border-card-border text-xs">
                    <div className="flex items-center justify-between font-medium text-text-primary">
                      <span>Backup #{b.id} ({b.backupType})</span>
                      <span className="text-success text-[10px] uppercase font-bold">Verified</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1 font-mono">
                      {new Date(b.createdAt).toLocaleDateString()} • {Math.round(b.sizeBytes / 1024)} KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

