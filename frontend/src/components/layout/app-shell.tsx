"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Leaf, LayoutDashboard, Route, GitCompare, Map, AlertTriangle,
  Wallet, Trophy, User, Settings, ChevronRight,
} from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/app-store";
import { navGroups, siteConfig } from "@/config/site";

const iconMap = {
  LayoutDashboard, Route, GitCompare, Map, AlertTriangle, Wallet, Trophy, User, Settings,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const womenSafetyMode = useAppStore((s) => s.womenSafetyMode);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {womenSafetyMode && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
                <Shield className="h-3 w-3" />
                Women Safety Active
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-3 py-1 text-xs font-medium text-muted">
              <Leaf className="h-3 w-3 text-accent" />
              {siteConfig.city}
            </span>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 transition hover:bg-slate-50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                P
              </div>
              <span className="text-sm font-medium">Priya</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 pb-24 lg:px-6 md:pb-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="glass sticky top-[4.5rem] space-y-6 rounded-2xl p-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-label mb-2 px-2">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map((link) => {
                    const Icon = iconMap[link.icon as keyof typeof iconMap];
                    const active = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:bg-white hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                        {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
