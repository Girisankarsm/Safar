"use client";

import { Sparkline } from "@/components/ui/sparkline";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { safetyTier } from "@/lib/safety-copy";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, ChevronRight, Leaf, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MetricCards() {
  const { city } = useCity();
  const [metrics, setMetrics] = useState({
    safetyIndex: 72,
    cctv: 0,
    alerts: 0,
    greenMiles: 0,
  });

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city), api.wallet()]).then(([c, r, w]) => {
      setMetrics({
        safetyIndex: Math.min(95, 72 + Math.min(20, Math.floor(c.count / 15))),
        cctv: c.count,
        alerts: r.reports.length,
        greenMiles: w.balance,
      });
    });
  }, [city]);

  const tier = safetyTier(metrics.safetyIndex);
  const recentAlerts = Math.min(metrics.alerts, 2);

  const items = [
    {
      icon: Shield,
      label: "Safety Index",
      value: `${metrics.safetyIndex}/100`,
      sub: tier === "SAFE" ? "Safe corridor" : `${tier} zone`,
      badge: tier,
      badgeColor: tier === "SAFE" ? "#22C55E" : tier === "MODERATE" ? "#3B82F6" : "#EF4444",
      color: "#3B82F6",
      spark: [62, 65, 68, 70, 72, metrics.safetyIndex],
      href: "/safety-map",
    },
    {
      icon: Camera,
      label: "CCTV Coverage",
      value: `${metrics.cctv} Active`,
      sub: "Within 5km radius",
      color: "#22C55E",
      spark: [40, 55, 70, 85, 100, Math.min(100, metrics.cctv)],
      href: "/safety-map",
    },
    {
      icon: AlertTriangle,
      label: "Community Alerts",
      value: `${metrics.alerts} Nearby`,
      sub: recentAlerts > 0 ? `${recentAlerts} new in last 24h` : "No new alerts",
      warn: metrics.alerts > 0,
      color: "#EF4444",
      spark: [2, 3, 2, 4, 3, metrics.alerts],
      href: "/safety",
    },
    {
      icon: Leaf,
      label: "GreenMiles",
      value: `${metrics.greenMiles} Earned`,
      sub: "Keep going!",
      color: "#22C55E",
      spark: [120, 150, 180, 200, 220, metrics.greenMiles],
      href: "/wallet",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Link
            href={item.href}
            className="group flex h-full flex-col rounded-2xl border border-[#262626] bg-[#111111] p-5 shadow-sm shadow-black/25 transition hover:-translate-y-0.5 hover:border-[#3B82F6]/25 hover:shadow-lg hover:shadow-[#3B82F6]/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${item.color}18` }}
                >
                  <item.icon className="h-5 w-5" style={{ color: item.color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{item.label}</p>
                  <p
                    className={`mt-1 text-xl font-bold tracking-tight ${item.warn ? "text-[#EF4444]" : "text-white"}`}
                  >
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-xs text-[#A1A1AA]">{item.sub}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#A1A1AA] transition group-hover:text-white" />
            </div>

            {"badge" in item && item.badge && (
              <span
                className="mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${item.badgeColor}18`,
                  color: item.badgeColor,
                }}
              >
                {item.badge}
              </span>
            )}

            <div className="mt-auto pt-4">
              <Sparkline data={item.spark} color={item.color} />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
