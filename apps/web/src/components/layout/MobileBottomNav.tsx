import { useActiveTripHref } from "@/hooks/use-active-trip-href";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/utils";
import { Home, Map, Route, Shield, Siren } from "lucide-react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/home", key: "nav.dashboard", icon: Home },
  { to: "/routes", key: "nav.routes", icon: Route },
  { to: "/trip", key: "nav.trip", icon: Map },
  { to: "/safety", key: "nav.safety", icon: Shield },
  { to: "/emergency", key: "nav.sos", icon: Siren },
] as const;

/** Fixed bottom nav — portaled to document.body so it never scrolls with page content */
export function MobileBottomNav() {
  const path = useLocation().pathname;
  const tripHref = useActiveTripHref();
  const { t } = useI18n();

  const nav = (
    <nav
      className="fixed inset-x-0 bottom-0 z-[99999] flex border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[0_-4px_24px_rgba(0,0,0,0.55)] pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      style={{ touchAction: "none" }}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
        const href = key === "nav.trip" ? tripHref : to;
        const active =
          to === "/routes" ? path.startsWith("/routes") : path.startsWith(to);
        return (
          <Link
            key={to}
            to={href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors select-none",
              active ? "text-[#3B82F6]" : "text-[#52525B]"
            )}
          >
            {active && (
              <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[#3B82F6]" />
            )}
            <Icon className="h-5 w-5 shrink-0" />
            <span className="leading-none tracking-wide">{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (typeof document === "undefined") return null;
  return createPortal(nav, document.body);
}
