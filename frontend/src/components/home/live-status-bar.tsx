"use client";

import { cityDisplayName } from "@/lib/safety-copy";
import { api } from "@/lib/api";
import { useCity } from "@/hooks/use-city";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LiveStatusBar() {
  const { city } = useCity();
  const [cctv, setCctv] = useState(0);
  const [alerts, setAlerts] = useState(0);
  const [safetyIndex, setSafetyIndex] = useState(82);

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city)]).then(([c, r]) => {
      setCctv(c.count);
      setAlerts(r.reports.length);
      setSafetyIndex(Math.min(95, 72 + Math.min(20, Math.floor(c.count / 15))));
    });
  }, [city]);

  const items = [
    { label: "City", value: cityDisplayName(city) },
    { label: "Safety Index", value: String(safetyIndex), live: true },
    { label: "CCTV", value: cctv.toLocaleString() },
    { label: "Alerts", value: String(alerts), warn: alerts > 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-[#222222] bg-[#111111] px-4 py-4"
        >
          {item.live && (
            <span className="absolute right-3 top-3 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
            </span>
          )}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">{item.label}</p>
          <p
            className={`mt-1.5 text-xl font-semibold tracking-tight ${
              item.warn ? "text-[#ef4444]" : "text-white"
            }`}
          >
            {item.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}
