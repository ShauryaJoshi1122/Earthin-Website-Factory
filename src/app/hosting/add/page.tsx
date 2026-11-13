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
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';

function cleanCpanelUrl(raw: string): string {
  let u = (raw || '').trim().replace(/\/+$/, '');
  if (!u) return '';
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = `https://${u}`;
  }
  if (!u.match(/:\d+$/)) {
    u = `${u}:2083`;
  }
  return u;
}

export default function AddHostingPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'internal_cpanel' | 'external_cpanel'>('internal_cpanel');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState<'password' | 'api_token'>('password');
  const [apiToken, setApiToken] = useState('');

  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!serverUrl || !username || !apiToken) {
      alert(`Please fill in Server URL, Username, and ${authType === 'password' ? 'Password' : 'API Token'} first.`);
      return;
    }

    const normalizedUrl = cleanCpanelUrl(serverUrl);
    setServerUrl(normalizedUrl);

    setTesting(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const res = await fetch('/api/hosting/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: normalizedUrl, username: username.trim(), apiToken: apiToken.trim(), authType }),
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

    const normalizedUrl = cleanCpanelUrl(serverUrl);
    setServerUrl(normalizedUrl);

    try {
      const res = await fetch('/api/hosting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          serverUrl: normalizedUrl,
          username: username.trim(),
          apiToken: apiToken.trim(),
          authType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add hosting connection.');
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div>
          <Link
            href="/hosting"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Hosting Accounts
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Connect cPanel Hosting</h1>
              <p className="text-xs text-text-muted mt-0.5">
                Add an internal Earthin cPanel or customer cPanel server for automated website provisioning
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 shadow-sm">
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
                onBlur={() => {
                  if (serverUrl.trim()) {
                    setServerUrl(cleanCpanelUrl(serverUrl));
                  }
                }}
                placeholder="https://cpanel.domain.com:2083 or yourdomain.com"
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

            {/* Auth Method Selection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Authentication Method</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAuthType('password')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    authType === 'password'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border bg-sidebar text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  cPanel Password (Simple)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType('api_token')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                    authType === 'api_token'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border bg-sidebar text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  API Token
                </button>
              </div>

              <div className="relative">
                {authType === 'password' ? (
                  <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Key className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type="password"
                  required
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={
                    authType === 'password'
                      ? 'Enter your regular cPanel login password...'
                      : 'Paste API token from cPanel (Manage API Tokens)...'
                  }
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1.5">
                {authType === 'password'
                  ? 'If your hosting provider disabled "Manage API Tokens", simply use your cPanel login password. Encrypted with AES-256-GCM.'
                  : 'Tokens are generated in cPanel -> Manage API Tokens and encrypted with AES-256-GCM.'}
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
                {testing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Test Connection
                  </>
                )}
              </button>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-card-border flex items-center justify-end gap-3">
              <Link
                href="/hosting"
                className="text-xs px-4 py-2.5 rounded-lg border border-card-border hover:bg-sidebar text-text-muted hover:text-text-primary transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving Connection...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Save & Encrypt Connection
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
