/**
 * TabNav — top navigation bar shown on every page
 *
 * Shows brand on the left, 4 tab links on the right.
 * Highlights the active tab using usePathname().
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/wellness", label: "Wellness", icon: "🌱" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/history", label: "History", icon: "📊" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold text-slate-800 hover:text-teal-600 transition-colors"
        >
          <span className="text-2xl">💚</span>
          <span>HealthBridge</span>
        </Link>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  flex items-center gap-2
                  ${
                    isActive
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
