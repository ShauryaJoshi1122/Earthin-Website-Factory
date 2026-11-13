'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 text-white font-extrabold text-2xl shadow-xl shadow-primary/25 mb-4">
            E
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Earthin Website Factory</h1>
          <p className="text-sm text-text-muted mt-1.5">
            Automated News Website Creation & Deployment Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-2xl glow-card backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Sign in to your account</h2>
            <p className="text-xs text-text-muted mt-0.5">Enter your operator or administrator credentials</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-error-subtle border border-error/30 text-error flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@earthin.online"
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-hover transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-sidebar border border-card-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary hover:bg-primary-hover text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/25 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-card-border/60 text-center text-xs text-text-muted">
            Protected by Earthin RBAC & Encrypted Sessions
          </div>
        </div>

        {/* Target domain pill */}
        <div className="text-center mt-6">
          <span className="text-[11px] text-text-muted font-mono bg-sidebar px-3 py-1 rounded-full border border-card-border">
            Deployment target: factory.earthin.online
          </span>
        </div>
      </div>
    </div>
  );
}
