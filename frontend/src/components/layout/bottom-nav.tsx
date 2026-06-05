"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Map, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: Route },
  { href: "/safety-map", label: "Safety", icon: Map },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(15,23,42,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2 safe-area-pb">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition",
                active ? "text-primary" : "text-muted"
              )}
            >
              <span className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition",
                active && "gradient-primary text-white shadow-sm"
              )}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
