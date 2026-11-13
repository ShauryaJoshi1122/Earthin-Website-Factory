'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  Server,
  Rocket,
  Layers,
  Palette,
  Puzzle,
  Database,
  Users,
  Bell,
  ScrollText,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Websites', href: '/websites', icon: Globe },
  { label: 'Create Website', href: '/websites/create', icon: PlusCircle, highlight: true },
  { label: 'Hosting Connections', href: '/hosting', icon: Server },
  { label: 'Deployment Center', href: '/deployments', icon: Rocket },
  { label: 'CMS Releases', href: '/cms/releases', icon: Layers },
  { label: 'Themes', href: '/cms/themes', icon: Palette },
  { label: 'Plugins', href: '/cms/plugins', icon: Puzzle },
  { label: 'Backups', href: '/backups', icon: Database },
  { label: 'Team Management', href: '/team', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar border-r border-card-border flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-card-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center font-bold text-white shadow-md shadow-primary/20">
          E
        </div>
        <div>
          <div className="font-semibold text-text-primary tracking-wide text-sm flex items-center gap-1.5">
            EARTHIN
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
              FACTORY
            </span>
          </div>
          <div className="text-[11px] text-text-muted">Newsroom Engine</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 mb-3 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-card text-primary font-medium border border-card-border shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="p-4 border-t border-card-border/60">
        <div className="bg-card/50 p-3 rounded-lg border border-card-border/40 text-xs">
          <div className="flex items-center gap-2 text-success font-medium mb-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Vercel Platform Engine</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Durable Workflow SDK & Neon PostgreSQL active.
          </p>
        </div>
      </div>
    </aside>
  );
}
