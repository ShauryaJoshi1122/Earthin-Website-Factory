'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, PlusCircle, Shield, CheckCircle2 } from 'lucide-react';

interface AuthUserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) {
          const unread = data.notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-sidebar/80 backdrop-blur-md border-b border-card-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search / Context */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider bg-card px-2.5 py-1 rounded border border-card-border">
          Target: factory.earthin.online
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          href="/websites/create"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-primary/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create Website</span>
        </Link>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-ping" />
          )}
        </Link>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-card-border">
          <Link href="/profile" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-card border border-card-border flex items-center justify-center text-text-primary group-hover:border-primary transition">
              <User className="w-4 h-4 text-text-muted group-hover:text-primary transition" />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-medium text-text-primary group-hover:text-primary transition">
                {user ? user.name : 'Team Member'}
              </div>
              <div className="text-[10px] text-text-muted capitalize">
                {user ? user.role.toLowerCase().replace('_', ' ') : 'Operator'}
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
