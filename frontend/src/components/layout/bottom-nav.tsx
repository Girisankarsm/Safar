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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition",
                active ? "text-primary" : "text-muted"
              )}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition",
                active && "bg-primary-light text-primary"
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
