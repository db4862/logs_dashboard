"use client";

/**
 * Navigation Component
 * 
 * React/Three.js Bridge:
 * Think of this as the "camera controls" - it determines what view
 * (page/scene) the user is looking at. Just like OrbitControls
 * doesn't change the scene, this doesn't change data - only the view.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  List, 
  Plus, 
  FileText,
  Activity
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/logs", label: "Log List", icon: List },
  { href: "/logs/new", label: "Create Log", icon: Plus },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-[var(--card)] border-r border-[var(--border)] p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <Activity className="w-8 h-8 text-[var(--accent)]" />
        <div>
          <h1 className="font-bold text-lg">Logs Dashboard</h1>
          <p className="text-xs text-[var(--muted)]">Analytics & Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || 
            (href !== "/" && pathname.startsWith(href) && href !== "/logs/new");
          
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${isActive 
                  ? "bg-[var(--accent)] text-white" 
                  : "text-[var(--muted)] hover:text-white hover:bg-[var(--card-hover)]"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 px-2 text-xs text-[var(--muted)]">
          <FileText className="w-4 h-4" />
          <span>FastAPI + Next.js + PostgreSQL</span>
        </div>
      </div>
    </nav>
  );
}

