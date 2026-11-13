'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Calendar,
  Download,
  Loader2,
  Package,
} from 'lucide-react';

export default function CmsReleasesPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // New release modal state
  const [version, setVersion] = useState('2.1.0');
  const [name, setName] = useState('Earthin News CMS');
  const [minPhp, setMinPhp] = useState('8.3.0');
  const [changelogStr, setChangelogStr] = useState('Added automated factory deployment security enhancements\nUpdated theme engine');
  const [isDefault, setIsDefault] = useState(false);

  const loadReleases = () => {
    setLoading(true);
    fetch('/api/cms/releases')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.releases) setReleases(data.releases);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);

    const changelog = changelogStr.split('\n').filter((l) => l.trim().length > 0);

    try {
      const res = await fetch('/api/cms/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          name,
          minPhp,
          changelog,
          isStable: true,
          isDefault,
        }),
      });

      if (res.ok) {
        alert(`Release v${version} registered successfully.`);
        loadReleases();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register release');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">CMS Releases</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Registered Earthin News CMS core distributions, checksums, and update channels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Register New Release Form (1 col) */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Register CMS Release</h2>
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="block text-text-secondary font-medium mb-1">Release Version</label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2.0.0"
                className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Distribution Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Minimum PHP Requirement</label>
              <input
                type="text"
                value={minPhp}
                onChange={(e) => setMinPhp(e.target.value)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Changelog (one entry per line)</label>
              <textarea
                rows={3}
                value={changelogStr}
                onChange={(e) => setChangelogStr(e.target.value)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="text-primary rounded"
              />
              <label htmlFor="isDefault" className="text-text-secondary select-none">
                Set as Default Production Release
              </label>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full mt-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg shadow-md shadow-primary/20 transition flex items-center justify-center gap-1.5"
            >
              {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
              <span>Register Release</span>
            </button>
          </form>
        </div>

        {/* Right: Releases List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading releases...</span>
            </div>
          ) : releases.length === 0 ? (
            <div className="bg-card border border-dashed border-card-border rounded-2xl p-10 text-center text-xs text-text-muted">
              No releases recorded. Default 2.0.0 will be seeded on sync.
            </div>
          ) : (
            releases.map((rel) => (
              <div key={rel.id} className="bg-card border border-card-border rounded-2xl p-6 glow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar border border-card-border flex items-center justify-center text-primary">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">v{rel.version}</h3>
                        {rel.isDefault && (
                          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-semibold uppercase">
                            Default
                          </span>
                        )}
                        <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded font-semibold uppercase">
                          Stable
                        </span>
                      </div>
                      <div className="text-xs text-text-muted">{rel.name} • PHP {rel.minPhp}+</div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-text-muted">
                    <div>{new Date(rel.releasedAt).toLocaleDateString()}</div>
                    {rel.packageSizeBytes > 0 && (
                      <div className="text-[11px] font-mono mt-0.5">
                        {Math.round(rel.packageSizeBytes / 1048576)} MB
                      </div>
                    )}
                  </div>
                </div>

                {/* Changelog */}
                {Array.isArray(rel.changelog) && rel.changelog.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-card-border/60">
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                      Release Notes
                    </span>
                    <ul className="space-y-1 text-xs text-text-secondary list-disc pl-4">
                      {rel.changelog.map((entry: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{entry}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

