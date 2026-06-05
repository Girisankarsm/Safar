"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, Leaf, LayoutDashboard, Route, GitCompare, Map, AlertTriangle,
  Wallet, Trophy, User, Settings, ChevronRight,
} from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { CitySwitcher } from "./city-switcher";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/app-store";
import { getCityConfig } from "@/config/cities";
import { navGroups } from "@/config/site";

const iconMap = {
  LayoutDashboard, Route, GitCompare, Map, AlertTriangle, Wallet, Trophy, User, Settings,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const womenSafetyMode = useAppStore((s) => s.womenSafetyMode);
  const city = useAppStore((s) => s.city);
  const cityConfig = getCityConfig(city);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/dashboard" className="rounded-lg transition hover:opacity-90">
            <Logo size="sm" />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <CitySwitcher compact />
            {womenSafetyMode && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700">
                <Shield className="h-3.5 w-3.5" />
                Women Safety Active
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted">
              <Leaf className="h-3.5 w-3.5 text-accent" />
              {cityConfig.displayName}
            </span>
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 transition hover:border-primary/30 hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-xs font-bold text-white shadow-sm">
                A
              </div>
              <span className="text-sm font-semibold">Ananya</span>
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
                          "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                          active
                            ? "gradient-primary text-white shadow-md"
                            : "text-muted hover:bg-white hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                        {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
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
