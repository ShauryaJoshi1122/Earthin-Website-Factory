'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Server,
  ArrowLeft,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';

export default function AddHostingPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'internal_cpanel' | 'external_cpanel'>('internal_cpanel');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [apiToken, setApiToken] = useState('');

  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!serverUrl || !username || !apiToken) {
      alert('Please fill in Server URL, Username, and API Token first.');
      return;
    }

    setTesting(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const res = await fetch('/api/hosting/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl, username, apiToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSuccess(
          `Connection verified! PHP ${data.capabilities?.phpVersion || '8.3'}, MySQL ${data.capabilities?.mysqlVersion || '8.0'} detected.`
        );
      } else {
        setTestError(data.error || 'Connection failed.');
      }
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/hosting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          serverUrl,
          username,
          apiToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save hosting connection');
      }

      router.push('/hosting');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/hosting"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary mb-3 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hosting Connections</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            Connect cPanel Hosting Account
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Add a hosting connection using standard cPanel UAPI authentication tokens
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 glow-card">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-subtle border border-error/30 text-error flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Error</div>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {testSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-success-subtle border border-success/30 text-success flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Connection Verified</div>
                <p className="mt-0.5">{testSuccess}</p>
              </div>
            </div>
          )}

          {testError && (
            <div className="mb-6 p-4 rounded-xl bg-error-subtle border border-error/30 text-error flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Authentication Failed</div>
                <p className="mt-0.5">{testError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Connection Label Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Earthin Main Shared cPanel"
                className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Hosting Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('internal_cpanel')}
                  className={`p-3 rounded-xl border text-left transition ${
                    type === 'internal_cpanel'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border bg-sidebar/50 text-text-secondary'
                  }`}
                >
                  <div className="text-xs font-semibold">Internal Earthin cPanel</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Corporate managed server infrastructure</div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('external_cpanel')}
                  className={`p-3 rounded-xl border text-left transition ${
                    type === 'external_cpanel'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border bg-sidebar/50 text-text-secondary'
                  }`}
                >
                  <div className="text-xs font-semibold">External Customer cPanel</div>
                  <div className="text-[10px] text-text-muted mt-0.5">Client-provided third party hosting</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                cPanel Server Host / URL <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://cpanel.domain.com:2083 or IP:2083"
                className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                cPanel Account Username <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. earthin"
                className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  cPanel API Token <span className="text-error">*</span>
                </label>
                <span className="text-[10px] text-text-muted">Generate in cPanel &rarr; Manage API Tokens</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Paste API token from cPanel..."
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1.5">
                Tokens are encrypted server-side with AES-256-GCM and never returned to the browser or logs.
              </p>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="text-xs bg-sidebar hover:bg-card-border text-text-primary font-medium px-4 py-2 rounded-lg border border-card-border transition flex items-center gap-2"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <RotateCcw className="w-3.5 h-3.5 text-text-muted" />}
                <span>Test cPanel Credentials</span>
              </button>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-card-border/60 flex items-center justify-end gap-3">
              <Link
                href="/hosting"
                className="text-xs text-text-muted hover:text-text-primary px-4 py-2 rounded-lg"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-md shadow-primary/25 disabled:opacity-60 transition flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                <span>Save & Connect Host</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

