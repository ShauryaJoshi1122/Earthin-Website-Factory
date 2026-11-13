'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Globe,
  Rocket,
  Server,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Activity,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalWebsites: number;
  activeWebsites: number;
  deployingCount: number;
  failedCount: number;
  hostingCount: number;
  releasesCount: number;
}

interface DeploymentSummary {
  id: number;
  uuid: string;
  websiteName: string;
  domain: string;
  status: string;
  progress: number;
  currentStep: number;
  startedAt: string;
  completedAt: string | null;
}

interface DegradedHosting {
  id: number;
  name: string;
  serverUrl: string;
  status: string;
  lastError: string | null;
}

interface ActivityItem {
  id: number;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDeployments, setRecentDeployments] = useState<DeploymentSummary[]>([]);
  const [degradedHosting, setDegradedHosting] = useState<DegradedHosting[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/dashboard/activity').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([statsData, actData]) => {
        if (statsData) {
          setStats(statsData.stats);
          setRecentDeployments(statsData.recentDeployments || []);
          setDegradedHosting(statsData.degradedHosting || []);
        }
        if (actData) {
          setActivities(actData.activity || []);
        }
      })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading Factory dashboard metrics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Top Banner / Hero */}
      <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl glow-card">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Earthin Production Fleet
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
            Automated News Website Engine
          </h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            Create independent, broadcast-grade news portals with automated cPanel provisioning, database setup, branding injection, and durable background deployment.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/websites/create"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-primary/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Website</span>
            </Link>
            <Link
              href="/hosting"
              className="inline-flex items-center gap-2 bg-sidebar hover:bg-sidebar/80 text-text-primary border border-card-border text-xs font-medium px-4 py-2.5 rounded-lg transition"
            >
              <Server className="w-4 h-4 text-text-muted" />
              <span>Manage Hosting</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hosting Capacity / Error Warnings */}
      {degradedHosting.length > 0 && (
        <div className="p-4 rounded-xl bg-warning-subtle border border-warning/30 text-warning flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold text-sm">Hosting Connection Alert</div>
            <p className="mt-1">
              One or more cPanel hosting accounts encountered authentication or capacity errors. Please verify credentials in Hosting Connections.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Websites */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">Total Websites</span>
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats?.totalWebsites ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Configured newsrooms</div>
        </div>

        {/* Active Websites */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">Active Online</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-success">{stats?.activeWebsites ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Live & verified</div>
        </div>

        {/* Deploying */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">In Deployment</span>
            <Rocket className="w-4 h-4 text-primary animate-bounce" />
          </div>
          <div className="text-2xl font-bold text-primary">{stats?.deployingCount ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Durable workflow active</div>
        </div>

        {/* Failed */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">Failed</span>
            <ShieldAlert className="w-4 h-4 text-error" />
          </div>
          <div className="text-2xl font-bold text-error">{stats?.failedCount ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Retryable jobs</div>
        </div>

        {/* Hosting Accounts */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">cPanel Hosts</span>
            <Server className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats?.hostingCount ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Connected accounts</div>
        </div>

        {/* CMS Releases */}
        <div className="bg-card border border-card-border rounded-xl p-4 glow-card">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-medium">CMS Releases</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{stats?.releasesCount ?? 0}</div>
          <div className="text-[11px] text-text-muted mt-1">Available versions</div>
        </div>
      </div>

      {/* Main Grid: Recent Deployments & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Deployments (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-6 glow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Recent Deployments</h2>
              <p className="text-xs text-text-muted">Live execution status across all newsrooms</p>
            </div>
            <Link
              href="/deployments"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentDeployments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-card-border/80 rounded-xl">
              <Rocket className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <div className="text-sm font-medium text-text-primary">No deployment jobs yet</div>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Once you generate a news website, its durable step-by-step installation progress will appear here.
              </p>
              <Link
                href="/websites/create"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                Create your first website &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeployments.map((job) => (
                <Link
                  key={job.id}
                  href={`/deployments/${job.id}`}
                  className="block p-4 rounded-xl bg-sidebar/60 border border-card-border/80 hover:border-primary/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary group-hover:text-primary transition">
                        {job.websiteName}
                      </div>
                      <div className="text-xs text-text-muted font-mono">{job.domain}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${
                          job.status === 'completed'
                            ? 'bg-success-subtle text-success'
                            : job.status === 'running'
                            ? 'bg-primary-subtle text-primary animate-pulse'
                            : job.status === 'failed'
                            ? 'bg-error-subtle text-error'
                            : 'bg-card text-text-muted'
                        }`}
                      >
                        {job.status.toUpperCase()}
                      </span>
                      <div className="text-[11px] text-text-muted mt-1">
                        Step {job.currentStep}/28 ({job.progress}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-card rounded-full h-1.5 mt-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        job.status === 'failed'
                          ? 'bg-error'
                          : job.status === 'completed'
                          ? 'bg-success'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Activity Audit (1 col) */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
              <p className="text-xs text-text-muted">Security & audit event stream</p>
            </div>
            <Link
              href="/audit-logs"
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
            >
              <span>Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-card-border/80 rounded-xl">
              <Activity className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <div className="text-xs text-text-muted">No recent activity logged.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="p-3 rounded-lg bg-sidebar/40 border border-card-border/50 text-xs">
                  <div className="flex items-center justify-between text-text-primary font-medium">
                    <span className="font-mono text-primary">{act.action}</span>
                    <span className="text-[10px] text-text-muted">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-text-secondary mt-1 text-[11px]">
                    {act.userName || act.userEmail || 'System Operator'} on {act.resourceType}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

