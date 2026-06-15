import { CitySwitcher } from "@/components/layout/CitySwitcher";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LowDataToggle } from "@/components/layout/LowDataToggle";
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
  const { city, revision } = useCityStore();
  const cityConfig = getCityConfig(city);
  const { t } = useI18n();

  function isNavActive(to: string, exact?: boolean) {
    if (exact) return path === to;
    if (to === "/routes") return path === "/routes";
    return path.startsWith(to);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* ── Desktop sidebar ── */}
      <aside className="panel-glass fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-w)] flex-col lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/20">
            <Shield className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-white">Safar</p>
            <p className="text-[10px] font-medium text-[var(--text-dim)]">{t("app.tagline")}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="mb-2 px-3 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
            Navigation
          </p>
          {NAV_ITEMS.map(({ to, key, icon: Icon, children }) => {
            const active = isNavActive(to, to === "/routes");
            return (
              <div key={to}>
                <Link
                  to={to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                    active
                      ? "bg-[#3B82F6]/12 text-white shadow-sm ring-1 ring-[#3B82F6]/15"
                      : "text-[#A1A1AA] hover:bg-[var(--bg-surface)] hover:text-white"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "text-[#71717A] group-hover:text-white"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {t(key)}
                </Link>
                {children?.map(({ to: childTo, key: childKey, icon: ChildIcon }) => {
                  const childActive = path.startsWith(childTo);
                  return (
                    <Link
                      key={childTo}
                      to={childTo}
                      className={cn(
                        "ml-[42px] mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                        childActive
                          ? "bg-[#3B82F6]/10 text-[#93C5FD]"
                          : "text-[#71717A] hover:bg-[var(--bg-surface)] hover:text-white"
                      )}
                    >
                      <ChildIcon className="h-3 w-3" />
                      {t(childKey)}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* City switcher */}
        <div className="border-t border-[var(--border-subtle)] px-4 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-surface)] px-2 py-1.5 ring-1 ring-[var(--border-subtle)]">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E] shadow-[0_0_5px_#22C55E]" />
            <CitySwitcher />
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex min-h-screen flex-col lg:pl-[var(--sidebar-w)]">

        {/* Header — single compact bar (combines brand + city + controls) */}
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg)]/92 backdrop-blur-xl"
          style={{ height: "var(--header-h)" }}>
          <div className="flex h-full items-center gap-2 px-4 md:px-6">

            {/* Mobile: brand + city inline */}
            <Link to="/home" className="flex shrink-0 items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3B82F6]/15">
                <Shield className="h-3.5 w-3.5 text-[#3B82F6]" />
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-white">Safar</p>
                <p className="text-[9px] font-medium text-[var(--text-dim)]">
                  {cityConfig.name}
                </p>
              </div>
            </Link>

            {/* Desktop: breadcrumb */}
            <div className="hidden flex-1 lg:block">
              <p className="text-xs text-[var(--text-dim)]">
                {cityConfig.name} · {cityConfig.state}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-end gap-1.5 lg:flex-none lg:gap-2">
              {/* Mobile city switcher (compact) */}
              <div className="lg:hidden">
                <CitySwitcher compact />
              </div>
              <LanguageSwitcher compact />
              <LowDataToggle compact />
              <div className="mx-0.5 h-4 w-px bg-[var(--border-subtle)]" />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* City context banner — desktop only */}
        <div className="hidden items-center justify-center border-b border-[var(--border-subtle)] bg-[#3B82F6]/5 lg:flex"
          style={{ height: "var(--city-banner-h)" }}>
          <p className="text-[11px] font-medium text-[var(--text-dim)]">
            {t("city.showing")}{" "}
            <span className="font-semibold text-white">
              {cityConfig.name}, {cityConfig.state}
            </span>
          </p>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet key={revision} />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
          const active =
            to === "/routes" ? path.startsWith("/routes") : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-semibold transition-colors",
                active ? "text-[#3B82F6]" : "text-[#71717A]"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#3B82F6]" />
              )}
              <Icon className="h-[18px] w-[18px]" />
              <span className="leading-none">{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
