"use client";

import { useActiveTrip } from "@/hooks/use-active-trip";
import { AlertTriangle, MapPin, Play } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    href: "/home",
    label: "Plan route",
    desc: "Compare fastest, safest, greenest",
    icon: MapPin,
  },
  {
    href: "/trip",
    label: "Start trip",
    desc: "Resume or begin live tracking",
    icon: Play,
    dynamic: true,
  },
  {
    href: "/safety?report=1",
    label: "Report issue",
    desc: "Help others stay safe",
    icon: AlertTriangle,
  },
];

export function QuickActions() {
  const tripId = useActiveTrip((s) => s.tripId);

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ href, label, desc, icon: Icon, dynamic }) => {
        const link = dynamic && tripId ? `/trip/${tripId}` : href;
        return (
          <Link
            key={label}
            href={link}
            className="rounded-2xl border border-[#222222] bg-[#111111] p-4 transition hover:border-[#333333]"
          >
            <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-white">{label}</p>
            <p className="mt-0.5 text-[10px] text-[#a1a1aa]">{desc}</p>
          </Link>
        );
      })}
    </div>
  );
}
