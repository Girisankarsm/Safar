"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { api, type Wallet } from "@/lib/api";
import { ArrowUpRight, Leaf } from "lucide-react";
import { useEffect, useState } from "react";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    api.wallet().then(setWallet);
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">GreenMiles</h1>
      <p className="mt-1 text-[#a1a1aa]">Rewards for choosing safer, greener transit.</p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-2xl border border-[#222222] bg-[#111111] p-8 text-center"
      >
        <Leaf className="mx-auto h-8 w-8 text-[#22c55e]" />
        <p className="mt-4 text-5xl font-semibold tracking-tight text-white">{wallet?.balance ?? "—"}</p>
        <p className="mt-1 text-sm text-[#a1a1aa]">available to redeem</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Lifetime tokens" value={wallet?.lifetime_tokens ?? "—"} />
        <Stat label="CO₂ saved" value={wallet ? `${wallet.lifetime_co2_kg} kg` : "—"} accent="success" />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-white">Recent earnings</h2>
        <ul className="mt-3 space-y-2">
          {(wallet?.transactions || []).slice(0, 5).map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-[#222222] px-4 py-3 text-sm"
            >
              <span className="text-[#a1a1aa]">{t.description || "Trip reward"}</span>
              <span className="font-medium text-[#22c55e]">+{t.amount}</span>
            </li>
          ))}
          {!wallet?.transactions?.length && (
            <li className="py-8 text-center text-sm text-[#a1a1aa]">Complete a trip to earn your first GreenMiles</li>
          )}
        </ul>
      </div>

      <ButtonLink href="/home" variant="secondary" className="mt-8 w-full" size="lg">
        Earn more <ArrowUpRight className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
