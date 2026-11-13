'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Server,
  Globe,
  Loader2,
  Filter,
} from 'lucide-react';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

  const loadDeployments = () => {
    setLoading(true);
    fetch('/api/deployments')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.deployments) setDeployments(data.deployments);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeployments();
  }, []);

  const filtered = deployments.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Deployment Center</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Durable workflow execution history across all newsroom installations
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-card-border pb-3 text-xs">
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'running', label: 'Running / In Progress' },
          { id: 'completed', label: 'Completed' },
          { id: 'failed', label: 'Failed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary hover:bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading deployments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center text-xs text-text-muted">
          No deployments matching the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dep) => (
            <Link
              key={dep.id}
              href={`/deployments/${dep.id}`}
              className="block bg-card border border-card-border rounded-2xl p-5 glow-card hover:border-primary/50 transition group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      dep.status === 'completed'
                        ? 'bg-success/20 text-success'
                        : dep.status === 'running'
                        ? 'bg-primary/20 text-primary animate-pulse'
                        : 'bg-error/20 text-error'
                    }`}
                  >
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition">
                        {dep.websiteName}
                      </h3>
                      <span className="text-xs text-text-muted font-mono">Job #{dep.id}</span>
                      <span className="text-[10px] bg-sidebar px-2 py-0.5 rounded font-mono text-text-muted">
                        {dep.jobType}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1 font-mono flex items-center gap-3">
                      <span>{dep.domain}</span>
                      <span>•</span>
                      <span>Host: {dep.hostingName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase inline-block ${
                      dep.status === 'completed'
                        ? 'bg-success-subtle text-success'
                        : dep.status === 'running'
                        ? 'bg-primary-subtle text-primary'
                        : 'bg-error-subtle text-error'
                    }`}
                  >
                    {dep.status}
                  </span>
                  <div className="text-[11px] text-text-muted mt-1">
                    Step {dep.currentStepNumber}/{dep.totalSteps} ({dep.progressPercentage}%)
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-sidebar rounded-full h-1.5 mt-4 overflow-hidden border border-card-border/40">
                <div
                  className={`h-full transition-all duration-300 ${
                    dep.status === 'failed'
                      ? 'bg-error'
                      : dep.status === 'completed'
                      ? 'bg-success'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${dep.progressPercentage}%` }}
                />
              </div>

              {dep.errorMessage && (
                <div className="mt-3 p-2.5 rounded-lg bg-error-subtle border border-error/30 text-error text-[11px]">
                  {dep.errorMessage}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

