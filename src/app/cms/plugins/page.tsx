'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Puzzle, CheckCircle2, ShieldCheck, Tag, Loader2, Search } from 'lucide-react';

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/cms/plugins')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plugins) setPlugins(data.plugins);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Newsroom Plugins</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Verified PHP extensions & broadcasting widgets approved for Earthin news portals
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-text-muted ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter plugins by name, slug, or category..."
          className="bg-transparent border-none text-xs text-text-primary placeholder:text-text-muted focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading approved plugins...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plug) => (
            <div key={plug.slug} className="bg-card border border-card-border rounded-2xl p-5 glow-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sidebar border border-card-border flex items-center justify-center text-primary">
                      <Puzzle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-text-primary">{plug.name}</h3>
                      <div className="text-[10px] text-text-muted font-mono">{plug.slug}</div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-card px-1.5 py-0.5 rounded text-text-muted uppercase font-semibold">
                    v{plug.version}
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mt-2">
                  {plug.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-card-border/60 flex items-center justify-between text-[11px]">
                <span className="text-text-muted bg-sidebar px-2 py-0.5 rounded border border-card-border/60">
                  {plug.category || 'Editorial'}
                </span>
                <span className="text-success font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Approved
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

