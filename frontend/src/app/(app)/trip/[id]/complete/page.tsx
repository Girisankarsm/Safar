"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { api, type Trip, type Wallet } from "@/lib/api";
import { Leaf, Shield, Trophy } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TripCompletePage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (id) {
      api.getTrip(id).then(setTrip);
      api.wallet().then(setWallet);
    }
  }, [id]);

  const tokens = trip?.tokens_earned ?? trip?.route?.reward_tokens ?? 0;
  const co2 = trip?.co2_saved_kg ?? trip?.route?.carbon_saved_kg ?? 0;
  const weekly = wallet ? `${(wallet.lifetime_co2_kg * 0.25).toFixed(1)} kg` : "—";

  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e]/20"
      >
        <Trophy className="h-10 w-10 text-[#22c55e]" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-3xl font-semibold tracking-tight text-white"
      >
        Trip complete
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-2 text-[#a1a1aa]"
      >
        You chose a safer route. Every ride makes the city better.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 grid gap-3"
      >
        <Stat label="GreenMiles earned" value={`+${tokens}`} accent="success" />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="CO₂ saved" value={`${co2} kg`} sub="vs driving" accent="success" />
          <Stat label="Weekly impact" value={weekly} sub="your contribution" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 space-y-3 rounded-2xl border border-[#222222] bg-[#111111] p-5 text-left"
      >
        <Row icon={Shield} text="Safest route taken — CCTV-monitored corridor" />
        <Row icon={Leaf} text={`${co2} kg less carbon than a car trip`} />
        <Row icon={Trophy} text={`${tokens} GreenMiles added to your wallet`} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex flex-col gap-3"
      >
        <ButtonLink href="/wallet" size="lg" className="w-full">
          View wallet
        </ButtonLink>
        <ButtonLink href="/home" variant="secondary" size="lg" className="w-full">
          Plan another trip
        </ButtonLink>
      </motion.div>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#a1a1aa]">
      <Icon className="h-4 w-4 shrink-0 text-white" />
      <span>{text}</span>
    </div>
  );
}
