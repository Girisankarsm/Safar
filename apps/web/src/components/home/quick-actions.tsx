"use client";

import { useActiveTrip } from "@/hooks/use-active-trip";
import { AlertTriangle, ChevronRight, Map, Shield, Siren, Wallet } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    href: "/safety-map",
    label: "Safety Map",
    desc: "Open city safety heatmap",
    icon: Shield,
    tone: "blue",
  },
  {
    href: "/trip",
    label: "Start Live Trip",
    desc: "Jump into active tracking",
    icon: Map,
    dynamic: true,
    tone: "slate",
  },
  {
    href: "/emergency",
    label: "Emergency Shield",
    desc: "SOS & safe waiting spots",
    icon: Siren,
    tone: "red",
    highlight: true,
  },
  {
    href: "/safety?report=1",
    label: "Report Issue",
    desc: "Submit community report",
    icon: AlertTriangle,
    tone: "orange",
    highlight: true,
  },
  {
    href: "/wallet",
    label: "Wallet",
    desc: "View GreenMiles",
    icon: Wallet,
    tone: "green",
  },
];

export function QuickActions() {
  const tripId = useActiveTrip((s) => s.tripId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {actions.map(({ href, label, desc, icon: Icon, dynamic, tone, highlight }) => {
        const link = dynamic && tripId ? `/trip/${tripId}` : href;
        const border =
          tone === "red"
            ? "border-[#EF4444]/30 hover:border-[#EF4444]/50"
            : tone === "orange"
              ? "border-[#F97316]/30 hover:border-[#F97316]/50"
              : tone === "blue"
                ? "border-[#262626] hover:border-[#3B82F6]/40"
                : "border-[#262626] hover:border-white/15";
        const iconBg =
          tone === "red"
            ? "bg-[#EF4444]/15 text-[#EF4444]"
            : tone === "orange"
              ? "bg-[#F97316]/15 text-[#F97316]"
              : tone === "blue"
                ? "bg-[#3B82F6]/15 text-[#3B82F6]"
                : tone === "green"
                  ? "bg-[#22C55E]/15 text-[#22C55E]"
                  : "bg-white/8 text-white";

        return (
          <Link
            key={label}
            href={link}
            className={[
              "group flex items-center justify-between rounded-2xl border bg-[#111111] p-4 shadow-sm shadow-black/25 transition",
              "hover:-translate-y-0.5 hover:shadow-lg",
              border,
              highlight ? "ring-1 ring-inset ring-white/5" : "",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-[10px] text-[#A1A1AA]">{desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#A1A1AA] transition group-hover:text-white" />
          </Link>
        );
      })}
    </div>
  );
}
