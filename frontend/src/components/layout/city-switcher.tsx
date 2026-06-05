"use client";

import { MapPin } from "lucide-react";
import { cities } from "@/config/cities";
import { useAppStore } from "@/lib/stores/app-store";
import { cn } from "@/lib/utils";

export function CitySwitcher({ compact }: { compact?: boolean }) {
  const { city, setCity } = useAppStore();

  return (
    <div className={cn("flex items-center gap-2", compact ? "" : "rounded-xl border border-border bg-white p-1")}>
      {!compact && <MapPin className="ml-2 h-4 w-4 text-primary" />}
      {Object.values(cities).map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setCity(c.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            city === c.id
              ? "gradient-primary text-white shadow-sm"
              : "text-muted hover:bg-slate-50 hover:text-foreground"
          )}
        >
          {c.displayName}
        </button>
      ))}
    </div>
  );
}
