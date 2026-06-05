"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/button";
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
      <p className="text-sm font-semibold text-[#3B82F6]">Rewards</p>
      <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">GreenMiles</h1>
      <p className="mt-2 text-[#A1A1AA]">Earn tokens for every safer green trip.</p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 rounded-3xl border border-[#262626] bg-[#171717] p-10 text-center shadow-2xl shadow-black/40"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22C55E]/15">
          <Leaf className="h-7 w-7 text-[#22C55E]" />
        </div>
        <p className="mt-6 text-6xl font-bold tracking-tight text-white">{wallet?.balance ?? "—"}</p>
        <p className="mt-2 text-sm text-[#A1A1AA]">available balance</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#262626] bg-[#171717] p-5 shadow-sm shadow-black/30">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Lifetime</p>
          <p className="mt-2 text-2xl font-bold text-white">{wallet?.lifetime_tokens ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#171717] p-5 shadow-sm shadow-black/30">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">CO₂ saved</p>
          <p className="mt-2 text-2xl font-bold text-[#22C55E]">{wallet?.lifetime_co2_kg ?? "—"} kg</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-white">Recent earnings</h2>
        <ul className="mt-4 space-y-3">
          {(wallet?.transactions || []).slice(0, 5).map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#171717] px-5 py-4 text-sm"
            >
              <span className="text-[#A1A1AA]">{t.description || "Trip reward"}</span>
              <span className="font-bold text-[#22C55E]">+{t.amount}</span>
            </li>
          ))}
          {!wallet?.transactions?.length && (
            <li className="py-12 text-center text-[#A1A1AA]">Complete a trip to earn GreenMiles</li>
          )}
        </ul>
      </div>

      <ButtonLink href="/home" variant="primary" className="mt-10 w-full" size="lg">
        Earn more <ArrowUpRight className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
