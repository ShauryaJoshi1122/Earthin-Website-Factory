'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    setLoading(true);
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Notifications</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Deployment milestones, hosting health alerts, and platform events
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 text-xs bg-sidebar hover:bg-card-border text-text-primary px-3 py-2 rounded-lg border border-card-border transition shrink-0"
        >
          <CheckCheck className="w-3.5 h-3.5 text-text-muted" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-text-muted gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span>Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-dashed border-card-border rounded-2xl p-12 text-center text-xs text-text-muted">
          No notifications recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-card border-card-border text-text-secondary'
                  : 'bg-card border-primary/40 shadow-sm text-text-primary'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'success'
                      ? 'bg-success/20 text-success'
                      : n.type === 'error'
                      ? 'bg-error/20 text-error'
                      : n.type === 'warning'
                      ? 'bg-warning/20 text-warning'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {n.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : n.type === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : n.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-text-primary">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-text-muted mt-1.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="text-xs bg-sidebar hover:bg-card-border text-primary px-3 py-1.5 rounded-lg border border-card-border transition flex items-center gap-1 shrink-0 font-medium"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

