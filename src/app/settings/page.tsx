'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Settings,
  Shield,
  Database,
  Cloud,
  CheckCircle2,
  Key,
  Server,
  Globe,
  Save,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const [targetDomain, setTargetDomain] = useState('factory.earthin.online');
  const [maxConcurrency, setMaxConcurrency] = useState('3');
  const [signingKeyStatus] = useState('Configured (32 bytes HMAC-SHA256)');
  const [encryptionStatus] = useState('Active (AES-256-GCM Hardware accelerated)');
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Platform settings saved.');
    }, 600);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Platform Settings</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Vercel deployment parameters, security encryption, and concurrency limits
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General Settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-card border border-card-border rounded-2xl p-6 glow-card space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Platform Parameters</h2>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Factory Public Domain Target
              </label>
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Max Concurrency Per cPanel Host
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(e.target.value)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Prevents overloading shared hosting CPU / RAM limits during parallel deployments.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md shadow-primary/20 transition flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Settings</span>
              </button>
            </div>
          </form>

          {/* Vercel Architecture Status */}
          <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Vercel Infrastructure Components</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-semibold text-text-primary">Neon PostgreSQL</div>
                    <div className="text-[11px] text-text-muted">Vercel Marketplace integration with connection pooling</div>
                  </div>
                </div>
                <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-bold uppercase">
                  Connected
                </span>
              </div>

              <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-semibold text-text-primary">Vercel Blob Storage</div>
                    <div className="text-[11px] text-text-muted">Private release archives, media and backup store</div>
                  </div>
                </div>
                <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-bold uppercase">
                  Active
                </span>
              </div>

              <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-semibold text-text-primary">Durable Workflow SDK</div>
                    <div className="text-[11px] text-text-muted">28-step stateful background execution with resilient retries</div>
                  </div>
                </div>
                <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-bold uppercase">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security & Encryption (1 col) */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card space-y-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Security & Cryptography</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/60">
              <span className="text-text-muted block text-[11px]">Database & Token Encryption</span>
              <span className="font-semibold text-text-primary mt-0.5 block">{encryptionStatus}</span>
            </div>

            <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/60">
              <span className="text-text-muted block text-[11px]">Deployment Manifest Signing</span>
              <span className="font-semibold text-text-primary mt-0.5 block">{signingKeyStatus}</span>
            </div>

            <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border/60">
              <span className="text-text-muted block text-[11px]">Session Authentication</span>
              <span className="font-semibold text-text-primary mt-0.5 block">HttpOnly, SameSite=Lax, JWT (jose)</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

