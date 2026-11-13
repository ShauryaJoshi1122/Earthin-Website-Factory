'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { User, Shield, Key, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-64 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading user profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Operator Profile</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Your credentials and role permissions inside Earthin Website Factory
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 glow-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-primary/25">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{user?.name || 'Operator'}</h2>
              <div className="text-xs text-text-muted font-mono">{user?.email || 'admin@earthin.online'}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                <Shield className="w-3 h-3" />
                <span>{user?.role || 'SUPER_ADMIN'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border/60">
            <h3 className="text-xs font-semibold text-text-primary mb-3">Effective Platform Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {(user?.permissions || ['*']).map((perm: string) => (
                <span
                  key={perm}
                  className="text-[11px] font-mono bg-sidebar px-2.5 py-1 rounded-md border border-card-border text-primary"
                >
                  {perm === '*' ? 'ALL PERMISSIONS (*)' : perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

