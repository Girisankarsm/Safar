import { useAuthStore } from "@/stores/auth.store";
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

const CITIES = [
  { id: "chennai" as const, name: "Chennai" },
  { id: "trivandrum" as const, name: "Trivandrum" },
  { id: "bangalore" as const, name: "Bengaluru" },
];

export function AppShell() {
  const path = useLocation().pathname;
  const { profile } = useAuthStore();
  const { city, setCity } = useCityStore();
  const name = profile?.full_name?.split(" ")[0] ?? "User";

  return (
    <div className="min-h-screen bg-[#050505]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-[#262626] bg-[#0A0A0A] lg:flex">
        <div className="flex items-center gap-3 border-b border-[#262626] px-5 py-5">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
          <div>
            <p className="font-bold text-white">Safar</p>
            <p className="text-[10px] text-[#A1A1AA]">Travel Smarter. Travel Safer.</p>
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
                  active ? "bg-[#3B82F6]/15 text-white" : "text-[#A1A1AA] hover:bg-[#171717]"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-60 pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#262626] bg-[#050505]/90 px-5 py-3 backdrop-blur-md">
          <Link to="/home" className="font-bold text-white lg:hidden">Safar</Link>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value as typeof city)}
            className="ml-auto rounded-xl border border-[#262626] bg-[#171717] px-3 py-2 text-sm text-white"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Link to="/profile" className="ml-3 hidden rounded-xl border border-[#262626] bg-[#111111] px-3 py-2 text-sm font-semibold text-white sm:inline hover:border-[#3B82F6]/40">
            {name}
          </Link>
        </header>
        <main className="px-5 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-50 flex border-t border-[#262626] bg-[#0A0A0A]/95 lg:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold",
              path.startsWith(to) ? "text-[#3B82F6]" : "text-[#A1A1AA]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
