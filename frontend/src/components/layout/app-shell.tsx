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
  const isLiveTrip = /^\/trip\/[^/]+$/.test(path) && !path.endsWith("/complete");

  return (
    <div className="min-h-screen bg-[#050505] md:pl-[5.5rem] lg:pl-0">
      {/* Floating desktop sidebar */}
      <aside className="fixed left-4 top-4 z-50 hidden w-[4.5rem] flex-col items-center gap-2 rounded-2xl border border-[#262626] bg-[#111111]/95 py-4 shadow-2xl backdrop-blur-xl lg:left-6 lg:top-1/2 lg:w-56 lg:-translate-y-1/2 lg:items-stretch lg:px-4 lg:py-5">
        <Link href="/home" className="mb-2 hidden px-2 lg:block">
          <p className="text-lg font-bold tracking-tight text-white">SafarAI</p>
          <p className="text-[10px] text-[#A1A1AA]">Safer transit</p>
        </Link>
        <nav className="flex flex-col gap-1 lg:gap-0.5">
          {NAV.map(({ href, label, icon: Icon, dynamic }) => {
            const tripHref = tripId ? `/trip/${tripId}` : "/trip";
            const link = dynamic ? tripHref : href;
            const active = dynamic ? path.startsWith("/trip") : path.startsWith(href);
            return (
              <Link
                key={href}
                href={link}
                title={label}
                className={cn(
                  "group flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition lg:justify-start lg:py-2.5",
                  active
                    ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25"
                    : "text-[#A1A1AA] hover:bg-[#171717] hover:text-white"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col pb-[4.5rem] lg:pb-0 lg:pl-[13rem]">
        <header
          className={cn(
            "sticky top-0 z-40 flex items-center justify-between border-b border-[#262626] bg-[#050505]/90 px-5 py-4 backdrop-blur-md",
            isLiveTrip && "lg:hidden"
          )}
        >
          <Link href="/home" className="text-lg font-bold text-white lg:hidden">
            SafarAI
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#3B82F6] sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3B82F6]" />
              Live
            </span>
            <CitySwitcher />
          </div>
        </header>

        <main
          className={cn(
            "flex-1",
            isLiveTrip ? "p-0" : "px-5 py-8 md:px-8 md:py-10 lg:px-10"
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#262626] bg-[#111111]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {NAV.map(({ href, label, icon: Icon, dynamic }) => {
          const tripHref = tripId ? `/trip/${tripId}` : "/trip";
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
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
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
