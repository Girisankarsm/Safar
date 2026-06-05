"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { QuickActions } from "@/components/home/quick-actions";
import { Stat } from "@/components/ui/stat";
import { useCity } from "@/hooks/use-city";
import { api, type Wallet } from "@/lib/api";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { city } = useCity();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    api.me().then((r) => setGreeting(r.user.name.split(" ")[0])).catch(() => setGreeting("there"));
    api.wallet().then(setWallet).catch(() => null);
  }, []);

  const todayImpact = wallet ? `${(wallet.lifetime_co2_kg * 0.12).toFixed(1)} kg` : "—";

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm text-[#a1a1aa]">Good {getTimeOfDay()}, {greeting}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Where are you going?
        </h1>
        <p className="mt-2 text-[#a1a1aa]">
          Safest public transit in {city === "chennai" ? "Chennai" : "Hyderabad"} — built for women commuters.
        </p>
      </motion.div>

      <div className="mt-8">
        <HeroSearch />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-10 grid grid-cols-3 gap-3">
        <Stat label="Safety avg" value="82" sub="across your city" />
        <Stat label="GreenMiles" value={wallet?.balance ?? "—"} sub="ready to redeem" accent="success" />
        <Stat label="Today's impact" value={todayImpact} sub="CO₂ vs driving" accent="success" />
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
