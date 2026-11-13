'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Palette, CheckCircle2, ShieldCheck, Layers, Eye, Loader2 } from 'lucide-react';

export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms/themes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.themes) setThemes(data.themes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Editorial Themes</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Verified broadcast-grade public frontends bundled with Earthin News CMS
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading themes...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {themes.map((theme) => (
            <div key={theme.slug} className="bg-card border border-card-border rounded-2xl p-6 glow-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar border border-card-border flex items-center justify-center text-primary">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">{theme.name}</h3>
                      <div className="text-xs text-text-muted font-mono">{theme.slug} • v{theme.version}</div>
                    </div>
                  </div>

                  <span className="text-[10px] bg-success-subtle text-success px-2 py-0.5 rounded-full font-semibold uppercase">
                    Approved
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mt-2">{theme.description}</p>

                {/* Features */}
                {Array.isArray(theme.supportedFeatures) && theme.supportedFeatures.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-card-border/60">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                      Supported Layout Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {theme.supportedFeatures.map((feat: string) => (
                        <span key={feat} className="text-[10px] bg-sidebar px-2 py-0.5 rounded border border-card-border/60 text-text-muted">
                          {feat.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-card-border/60 flex items-center justify-between text-xs text-text-muted">
                <span>By {theme.author || 'Earthin News CMS'}</span>
                <span>Min CMS: v{theme.minCmsVersion || '1.0.0'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

