"use client";

import { CitySwitcher } from "@/components/layout/city-switcher";
import { cn } from "@/lib/utils";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import {
  Bell,
  Bus,
  ChevronRight,
  Home,
  Leaf,
  Map,
  Route,
  Settings,
  Shield,
  Siren,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/home", label: "Dashboard", icon: Home },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/trip", label: "Trip", icon: Map, dynamic: true },
  { href: "/safety", label: "Safety", icon: Shield },
  { href: "/emergency", label: "SOS", icon: Siren },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const tripId = useActiveTrip((s) => s.tripId);
  const isLiveTrip = /^\/trip\/[^/]+$/.test(path) && !path.endsWith("/complete");
  const { city } = useCity();
  const [userName, setUserName] = useState("Ananya");
  const [greenMiles, setGreenMiles] = useState<number | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api.me().then((r) => setUserName(r.user.name.split(" ")[0])).catch(() => null);
    api.wallet().then((w) => setGreenMiles(w.balance)).catch(() => null);
  }, []);

  useEffect(() => {
    api.reports(city).then((r) => setAlertCount(Math.min(9, r.reports.length))).catch(() => null);
  }, [city]);

  return (
    <div className="min-h-screen bg-[#050505]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-[#262626] bg-[#0A0A0A] lg:flex">
        <div className="flex items-center gap-3 border-b border-[#262626] px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/15">
            <Shield className="h-5 w-5 text-[#3B82F6]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">Safar</p>
            <p className="text-[10px] font-medium text-[#A1A1AA]">Travel Smarter. Travel Safer.</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {NAV.map(({ href, label, icon: Icon, dynamic }) => {
            const tripHref = tripId ? `/trip/${tripId}` : "/routes";
            const link = dynamic ? tripHref : href;
            const active = dynamic ? path.startsWith("/trip") : path.startsWith(href);
            return (
              <Link
                key={href}
                href={link}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[#3B82F6]/15 text-white"
                    : "text-[#A1A1AA] hover:bg-[#171717] hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#3B82F6]" />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? "text-[#3B82F6]" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#262626] p-4">
          <Link
            href="/wallet"
            className="block overflow-hidden rounded-2xl border border-[#262626] bg-[#111111] transition hover:border-[#22C55E]/30"
          >
            <div className="flex items-center gap-3 bg-gradient-to-br from-[#3B82F6]/10 to-[#22C55E]/10 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111]/80">
                <Bus className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">Travel safe. Earn more.</p>
                <p className="text-[10px] text-[#A1A1AA]">Earn GreenMiles on every ride</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Balance</p>
                <p className="text-lg font-bold text-[#22C55E]">{greenMiles ?? "—"}</p>
              </div>
              <span className="flex items-center gap-1 rounded-lg bg-[#3B82F6] px-3 py-1.5 text-[10px] font-bold text-white">
                View Wallet <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col pb-[4.5rem] lg:pl-60 lg:pb-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#262626] bg-[#050505]/90 px-5 py-3.5 backdrop-blur-md lg:px-8">
          <Link href="/home" className="flex items-center gap-2 lg:hidden">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
            <span className="text-lg font-bold text-white">Safar</span>
          </Link>

          <div className="ml-auto flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#22C55E]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
              Live
            </span>
            <CitySwitcher />
            <IconLink href="/safety" label="Notifications" badge={alertCount || undefined}>
              <Bell className="h-4 w-4" />
            </IconLink>
            <Link
              href="/profile"
              className="hidden items-center gap-2.5 rounded-xl border border-[#262626] bg-[#111111] py-1.5 pl-1.5 pr-3 text-sm font-semibold text-white transition hover:border-[#3B82F6]/40 sm:flex"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-xs font-bold text-white">
                {userName.charAt(0)}
              </span>
              {userName}
            </Link>
            <IconLink href="/settings" label="Settings">
              <Settings className="h-4 w-4" />
            </IconLink>
          </div>
        </header>

        <main className={cn("flex-1 px-5 py-6 md:px-8", isLiveTrip ? "md:py-5" : "md:py-8")}>
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#262626] bg-[#0A0A0A]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {NAV.map(({ href, label, icon: Icon, dynamic }) => {
          const tripHref = tripId ? `/trip/${tripId}` : "/routes";
          const link = dynamic ? tripHref : href;
          const active = dynamic ? path.startsWith("/trip") : path.startsWith(href);
          return (
            <Link
              key={href}
              href={link}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition",
                active ? "text-[#3B82F6]" : "text-[#A1A1AA]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition",
                  active && "bg-[#3B82F6]/15"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
  badge,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#262626] bg-[#111111] text-[#A1A1AA] transition hover:border-[#3B82F6]/40 hover:text-white"
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
