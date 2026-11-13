'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Loader2,
  Trash2,
} from 'lucide-react';

export default function TeamManagementPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New member state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'WEBSITE_OPERATOR' | 'VIEWER'>('WEBSITE_OPERATOR');
  const [error, setError] = useState<string | null>(null);

  const loadTeam = () => {
    setLoading(true);
    fetch('/api/team')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setTeam(data.team);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Team member "${name}" added successfully.`);
        setName('');
        setEmail('');
        setPassword('');
        loadTeam();
      } else {
        setError(data.error || 'Failed to add team member');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Team Management</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage Earthin team roles, permissions, and website creation operators
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Member Form (1 col) */}
        <div className="bg-card border border-card-border rounded-2xl p-6 glow-card">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Add Team Member</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-subtle border border-error/30 text-error flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-text-secondary font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-9 pr-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@earthin.online"
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-9 pr-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Initial Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-9 pr-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-sidebar border border-card-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="WEBSITE_OPERATOR">WEBSITE OPERATOR (Create sites, themes, branding)</option>
                <option value="ADMIN">ADMIN (Hosting, websites, releases)</option>
                <option value="SUPER_ADMIN">SUPER ADMIN (Full Factory control)</option>
                <option value="VIEWER">VIEWER (Read-only access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg shadow-md shadow-primary/20 transition flex items-center justify-center gap-1.5 mt-2"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Create Account</span>
            </button>
          </form>
        </div>

        {/* Right: Team Members List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading team members...</span>
            </div>
          ) : team.length === 0 ? (
            <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center text-xs text-text-muted">
              No team members found.
            </div>
          ) : (
            team.map((member) => (
              <div
                key={member.id}
                className="bg-card border border-card-border rounded-2xl p-5 glow-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-sidebar border border-card-border flex items-center justify-center font-bold text-sm text-primary">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text-primary">{member.name}</h3>
                      <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-mono font-semibold">
                        {member.role || 'OPERATOR'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{member.email}</div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-success text-[10px] uppercase font-bold bg-success-subtle px-2 py-0.5 rounded-full">
                    {member.status}
                  </span>
                  <div className="text-[10px] text-text-muted mt-1">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

