import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/utils";
import { ArrowDownUp, Route } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const TABS = [
  { to: "/routes", key: "nav.routes", icon: Route, exact: true },
  { to: "/routes/compare", key: "nav.compare", icon: ArrowDownUp, exact: false },
] as const;

export function RoutesSubNav() {
  const { t } = useI18n();
  const path = useLocation().pathname;

  return (
    <div className="flex gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 lg:hidden">
      {TABS.map(({ to, key, icon: Icon, exact }) => {
        const active = exact ? path === to : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition",
              active
                ? "bg-[#3B82F6]/20 text-[#93C5FD]"
                : "text-[#71717A] hover:text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(key)}
          </Link>
        );
      })}
    </div>
  );
}
