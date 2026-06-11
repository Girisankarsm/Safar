import { CitySwitcher } from "@/components/layout/CitySwitcher";
import { getCityConfig } from "@/config/cities";
import { UserMenu } from "@/features/auth";
import { useCityStore } from "@/stores/city.store";
import { cn } from "@/lib/utils";
import { Home, Map, Route, Shield, Siren } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

const NAV = [
  { to: "/home", label: "Dashboard", icon: Home },
  { to: "/routes", label: "Routes", icon: Route },
  { to: "/trip", label: "Trip", icon: Map },
  { to: "/safety", label: "Safety", icon: Shield },
  { to: "/emergency", label: "SOS", icon: Siren },
];

export function AppShell() {
  const path = useLocation().pathname;
  const { city, revision } = useCityStore();
  const cityConfig = getCityConfig(city);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/15">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
          </div>
          <div>
            <p className="font-bold text-white">Safar</p>
            <p className="text-[10px] text-[#71717A]">Travel Smarter. Travel Safer.</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[#3B82F6]/15 text-white shadow-sm"
                    : "text-[#A1A1AA] hover:bg-[#18181d] hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-[#3B82F6]")} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64 pb-20 lg:pb-8">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg)]/80 px-5 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link to="/home" className="font-bold text-white lg:hidden">
              Safar
            </Link>
            <CitySwitcher />
            <UserMenu className="ml-1" />
          </div>
        </header>

        <div className="border-b border-[var(--border-subtle)] bg-[#3B82F6]/5 px-5 py-2 text-center text-xs text-[#A1A1AA] md:px-8">
          Showing places, maps & safety data for{" "}
          <span className="font-semibold text-white">
            {cityConfig.name}, {cityConfig.state}
          </span>
        </div>

        <main className="px-5 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet key={revision} />
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-50 flex border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition",
                active ? "text-[#3B82F6]" : "text-[#71717A]"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
