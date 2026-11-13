'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Globe,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Server,
  Calendar,
  MoreVertical,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface WebsiteItem {
  id: number;
  uuid: string;
  name: string;
  title: string;
  primaryDomain: string;
  status: string;
  sslStatus: string;
  selectedThemeSlug: string;
  lastDeployedAt: string | null;
  createdAt: string;
  hostingName: string;
  hostingType: string;
  mainLogoUrl: string | null;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadWebsites = () => {
    setLoading(true);
    fetch('/api/websites')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.websites) {
          setWebsites(data.websites);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete website "${name}"? This action requires confirmation.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebsites((prev) => prev.filter((w) => w.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete website');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = websites.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.primaryDomain.toLowerCase().includes(search.toLowerCase()) ||
      w.hostingName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">News Websites</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage deployed Earthin newsrooms, domains, branding, and updates
          </p>
        </div>
        <Link
          href="/websites/create"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Website</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-text-muted ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter websites by channel name, domain, or hosting..."
          className="bg-transparent border-none text-xs text-text-primary placeholder:text-text-muted focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading websites...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center">
          <Globe className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-text-primary">No websites found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {search ? 'No websites match your filter criteria.' : 'Create your first automated news portal through the guided wizard.'}
          </p>
          <div className="mt-4">
            <Link
              href="/websites/create"
              className="inline-flex items-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-hover transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Launch Website Wizard</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((site) => (
            <div
              key={site.id}
              className="bg-card border border-card-border rounded-2xl p-5 glow-card hover:border-primary/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar border border-card-border flex items-center justify-center overflow-hidden shrink-0">
                      {site.mainLogoUrl ? (
                        <img src={site.mainLogoUrl} alt={site.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Globe className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary line-clamp-1">{site.name}</h3>
                      <a
                        href={`https://${site.primaryDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-mono mt-0.5"
                      >
                        <span>{site.primaryDomain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      site.status === 'active'
                        ? 'bg-success-subtle text-success'
                        : site.status === 'provisioning'
                        ? 'bg-primary-subtle text-primary animate-pulse'
                        : 'bg-error-subtle text-error'
                    }`}
                  >
                    {site.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-text-secondary mt-4 pt-3 border-t border-card-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" /> Hosting
                    </span>
                    <span className="font-medium text-text-primary">{site.hostingName || 'cPanel'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> SSL Status
                    </span>
                    <span
                      className={`font-medium ${
                        site.sslStatus === 'active' ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {site.sslStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Created
                    </span>
                    <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-card-border/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${site.primaryDomain}/admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-sidebar hover:bg-card-border text-text-primary px-2.5 py-1.5 rounded-lg border border-card-border transition flex items-center gap-1"
                  >
                    <span>CMS Admin</span>
                    <ExternalLink className="w-3 h-3 text-text-muted" />
                  </a>
                  <Link
                    href={`/websites/${site.id}`}
                    className="text-xs bg-primary/10 hover:bg-primary/20 text-primary font-medium px-2.5 py-1.5 rounded-lg border border-primary/20 transition flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition"
                  title="Delete Website"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

