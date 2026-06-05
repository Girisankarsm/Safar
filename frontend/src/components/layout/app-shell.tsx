"use client";

import { CitySwitcher } from "@/components/layout/city-switcher";
import { cn } from "@/lib/utils";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { Home, Map, Route, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/trip", label: "Trip", icon: Map, dynamic: true },
  { href: "/safety", label: "Safety", icon: Shield },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const tripId = useActiveTrip((s) => s.tripId);

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r border-[#222222] bg-black p-5 md:flex">
        <Link href="/home" className="mb-10 block">
          <p className="text-xl font-semibold tracking-tight text-white">SafarAI</p>
          <p className="text-xs text-[#a1a1aa]">Safer transit, every ride</p>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon, dynamic }) => {
            const tripHref = tripId ? `/trip/${tripId}` : "/trip";
            const link = dynamic ? tripHref : href;
            const active = dynamic ? path.startsWith("/trip") : path.startsWith(href);
            return (
              <Link
                key={href}
                href={link}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-white text-black" : "text-[#a1a1aa] hover:bg-[#111111] hover:text-white"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto text-[10px] text-[#a1a1aa]">OneJourney Hackathon 2026</p>
      </aside>

      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-[#222222] px-4 py-3 md:px-8">
          <Link href="/home" className="text-lg font-semibold md:hidden">
            SafarAI
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] uppercase tracking-wider text-[#a1a1aa] sm:inline">
              Live · GTFS + OSM
            </span>
            <CitySwitcher />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {/* Mobile bottom nav — Uber-style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#222222] bg-black px-2 py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon, dynamic }) => {
          const tripHref = tripId ? `/trip/${tripId}` : "/trip";
          const link = dynamic ? tripHref : href;
          const active = dynamic ? path.startsWith("/trip") : path.startsWith(href);
          return (
            <Link
              key={href}
              href={link}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium",
                active ? "text-white" : "text-[#a1a1aa]"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
