'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  XCircle,
  ArrowLeft,
  Server,
  Globe,
  Loader2,
  Download,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export default function DeploymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deployment, setDeployment] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadJobData = () => {
    fetch(`/api/deployments/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDeployment(data.deployment);
          setSteps(data.steps || []);
          setLogs(data.logs || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobData();
  }, [id]);

  // Auto-poll every 3 seconds if job is currently running
  useEffect(() => {
    if (deployment?.status === 'running') {
      const timer = setInterval(() => {
        loadJobData();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [deployment?.status, id]);

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deployments/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        loadJobData();
      } else {
        const err = await res.json();
        alert(err.error || 'Retry failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this deployment?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deployments/${id}/cancel`, { method: 'POST' });
      if (res.ok) {
        loadJobData();
      } else {
        const err = await res.json();
        alert(err.error || 'Cancel failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const reportData = {
      deployment,
      steps,
      logs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-report-job-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-64 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading deployment job details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!deployment) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-text-muted">Deployment job not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/deployments"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deployments</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                deployment.status === 'completed'
                  ? 'bg-success/20 text-success'
                  : deployment.status === 'running'
                  ? 'bg-primary/20 text-primary animate-pulse'
                  : 'bg-error/20 text-error'
              }`}
            >
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-text-primary">{deployment.websiteName}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    deployment.status === 'completed'
                      ? 'bg-success-subtle text-success'
                      : deployment.status === 'running'
                      ? 'bg-primary-subtle text-primary animate-pulse'
                      : 'bg-error-subtle text-error'
                  }`}
                >
                  {deployment.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-1 font-mono">
                <a
                  href={`https://${deployment.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <span>{deployment.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <span>Job #{deployment.id}</span>
                <span>•</span>
                <span>cPanel: {deployment.hostingName}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {deployment.status === 'failed' && (
              <button
                onClick={handleRetry}
                disabled={actionLoading}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed Step</span>
              </button>
            )}

            {deployment.status === 'running' && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="bg-error/10 hover:bg-error/20 text-error text-xs font-medium px-4 py-2 rounded-lg border border-error/30 transition flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Workflow</span>
              </button>
            )}

            {deployment.status === 'completed' && (
              <a
                href={`https://${deployment.domain}/admin`}
                target="_blank"
                rel="noreferrer"
                className="bg-success text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-success/20 transition flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Open CMS Admin</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={handleDownloadReport}
              className="bg-sidebar hover:bg-card-border text-text-primary text-xs font-medium px-3.5 py-2 rounded-lg border border-card-border transition flex items-center gap-1.5"
              title="Download Full Report"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-4 border-t border-card-border/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-text-muted">
              Step {deployment.currentStepNumber} of {deployment.totalSteps}
            </span>
            <span className="font-semibold font-mono text-primary">{deployment.progressPercentage}%</span>
          </div>
          <div className="w-full bg-sidebar rounded-full h-2 overflow-hidden border border-card-border/40">
            <div
              className={`h-full transition-all duration-300 ${
                deployment.status === 'failed'
                  ? 'bg-error'
                  : deployment.status === 'completed'
                  ? 'bg-success'
                  : 'bg-primary'
              }`}
              style={{ width: `${deployment.progressPercentage}%` }}
            />
          </div>
        </div>

        {deployment.errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-error-subtle border border-error/30 text-error text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Step Error Occurred</div>
              <p className="mt-0.5 leading-relaxed">{deployment.errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: 28 Steps Timeline & Real-Time Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 28 Steps Timeline */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            Workflow Execution Timeline (28 Durable Steps)
          </h2>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {steps.map((st) => (
              <div
                key={st.stepNumber}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                  st.status === 'completed'
                    ? 'border-card-border/80 bg-sidebar/40 text-text-secondary'
                    : st.status === 'running'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : st.status === 'failed'
                    ? 'border-error/50 bg-error/10 text-error font-semibold'
                    : 'border-card-border/40 bg-sidebar/20 text-text-muted opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      st.status === 'completed'
                        ? 'bg-success text-white'
                        : st.status === 'running'
                        ? 'bg-primary text-white animate-spin'
                        : st.status === 'failed'
                        ? 'bg-error text-white'
                        : 'bg-sidebar text-text-muted border border-card-border'
                    }`}
                  >
                    {st.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : st.status === 'running' ? (
                      <Loader2 className="w-3.5 h-3.5" />
                    ) : (
                      st.stepNumber
                    )}
                  </span>
                  <div>
                    <div className="font-medium text-text-primary">
                      {st.stepNumber}. {st.stepName}
                    </div>
                    {st.errorDetails && (
                      <div className="text-[10px] text-error mt-0.5 line-clamp-1">{st.errorDetails}</div>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px]">
                  <span
                    className={`uppercase font-bold text-[10px] ${
                      st.status === 'completed'
                        ? 'text-success'
                        : st.status === 'running'
                        ? 'text-primary'
                        : st.status === 'failed'
                        ? 'text-error'
                        : 'text-text-muted'
                    }`}
                  >
                    {st.status}
                  </span>
                  {st.attemptCount > 1 && (
                    <div className="text-text-muted text-[10px]">Attempt {st.attemptCount}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-Time Execution Logs */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span>Execution Logs</span>
              </h2>
              <span className="text-xs text-text-muted font-mono">{logs.length} entries</span>
            </div>

            <div className="bg-sidebar border border-card-border/80 rounded-xl p-4 font-mono text-[11px] h-[480px] overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="text-text-muted text-center py-12">No logs recorded yet.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    <span className="text-text-muted mr-2">
                      [{new Date(log.createdAt).toLocaleTimeString()}]
                    </span>
                    <span
                      className={`mr-2 font-semibold ${
                        log.level === 'error'
                          ? 'text-error'
                          : log.level === 'warn'
                          ? 'text-warning'
                          : 'text-primary'
                      }`}
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    {log.stepNumber && (
                      <span className="text-text-muted mr-2">(Step {log.stepNumber})</span>
                    )}
                    <span className="text-text-secondary">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

