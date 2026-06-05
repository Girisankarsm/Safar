"use client";

import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, Leaf, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function MetricCards() {
  const { city } = useCity();
  const [metrics, setMetrics] = useState({
    safetyIndex: 82,
    cctv: 0,
    alerts: 0,
    greenMiles: "—",
  });

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city), api.wallet()]).then(([c, r, w]) => {
      setMetrics({
        safetyIndex: Math.min(95, 72 + Math.min(20, Math.floor(c.count / 15))),
        cctv: c.count,
        alerts: r.reports.length,
        greenMiles: String(w.balance),
      });
    });
  }, [city]);

  const items = [
    { icon: Shield, label: "Safety Index", value: metrics.safetyIndex, color: "#3B82F6", live: true },
    { icon: Camera, label: "CCTV Coverage", value: metrics.cctv.toLocaleString(), color: "#22C55E" },
    { icon: AlertTriangle, label: "Community Alerts", value: metrics.alerts, color: "#EF4444", warn: metrics.alerts > 0 },
    { icon: Leaf, label: "GreenMiles", value: metrics.greenMiles, color: "#22C55E" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="relative rounded-2xl border border-[#262626] bg-[#171717] p-5"
        >
          {item.live && (
            <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
          )}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${item.color}18` }}
          >
            <item.icon className="h-5 w-5" style={{ color: item.color }} strokeWidth={2} />
          </div>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-[#A1A1AA]">{item.label}</p>
          <p
            className={`mt-1 text-2xl font-bold tracking-tight ${item.warn ? "text-[#EF4444]" : "text-white"}`}
          >
            {item.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
