import { CitySwitcher } from "@/components/layout/CitySwitcher";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LowDataToggle } from "@/components/layout/LowDataToggle";
import { SafetyIntelligenceWidget } from "@/components/safety/safety-intelligence-widget";
import { getCityConfig } from "@/config/cities";
import { UserMenu } from "@/features/auth";
import { useI18n } from "@/i18n/use-i18n";
import { useCityStore } from "@/stores/city.store";
import { cn } from "@/lib/utils";
import { ArrowDownUp, Home, Map, Route, Shield, Siren } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

type NavChild = { to: string; key: string; icon: typeof Route };
type NavItem = { to: string; key: string; icon: typeof Home; children?: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { to: "/home", key: "nav.dashboard", icon: Home },
  {
    to: "/routes",
    key: "nav.routes",
    icon: Route,
    children: [{ to: "/routes/compare", key: "nav.compare", icon: ArrowDownUp }],
  },
  { to: "/trip", key: "nav.trip", icon: Map },
  { to: "/safety", key: "nav.safety", icon: Shield },
  { to: "/emergency", key: "nav.sos", icon: Siren },
];
export function AppShell() {
  const path = useLocation().pathname;
  const isSafety = path.startsWith("/safety");
  const { city, revision } = useCityStore();
  const cityConfig = getCityConfig(city);
  const t = useI18n().t;

  function isNavActive(to: string, exact?: boolean) {
    if (exact) return path === to;
    if (to === "/routes") return path === "/routes";
    return path.startsWith(to);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/15">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
          </div>
          <div>
            <p className="font-bold text-white">Safar</p>
            <p className="text-[10px] text-[#71717A]">{t("app.tagline")}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, key, icon: Icon, children }) => {
            const active = isNavActive(to, to === "/routes");
            const label = t(key);
            return (
              <div key={to}>
                <Link
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
                {children?.map(({ to: childTo, key: childKey, icon: ChildIcon }) => {
                  const childActive = path.startsWith(childTo);
                  return (
                    <Link
                      key={childTo}
                      to={childTo}
                      className={cn(
                        "ml-7 mt-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                        childActive
                          ? "bg-[#3B82F6]/10 text-[#93C5FD]"
                          : "text-[#71717A] hover:bg-[#18181d] hover:text-white"
                      )}
                    >
                      <ChildIcon className={cn("h-3.5 w-3.5", childActive && "text-[#3B82F6]")} />
                      {t(childKey)}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {isSafety && <SafetyIntelligenceWidget />}
      </aside>

      <div className="lg:pl-64 pb-20 lg:pb-8">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg)]/80 px-5 py-3 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link to="/home" className="font-bold text-white lg:hidden">
              Safar
            </Link>
            <CitySwitcher />
            <LanguageSwitcher />
            <LowDataToggle />
            <UserMenu className="ml-1" />
          </div>
        </header>

        <div className="border-b border-[var(--border-subtle)] bg-[#3B82F6]/5 px-5 py-2 text-center text-xs text-[#A1A1AA] md:px-8">
          {t("city.showing")}{" "}
          <span className="font-semibold text-white">
            {cityConfig.name}, {cityConfig.state}
          </span>
        </div>

        <main className={cn("px-5 py-6 md:px-8", isSafety && "py-5")}>
          <div className={cn("mx-auto", isSafety ? "max-w-[1600px]" : "max-w-6xl")}>
            <Outlet key={revision} />
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 inset-x-0 z-50 flex border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
          const active =
            to === "/routes" ? path.startsWith("/routes") : path.startsWith(to);
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
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
