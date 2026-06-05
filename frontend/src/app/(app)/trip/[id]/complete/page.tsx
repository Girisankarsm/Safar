"use client";

import { motion } from "framer-motion";
import { AnimatedNumber, CelebrationGlow } from "@/components/trip/celebration";
import { ButtonLink } from "@/components/ui/button";
import { api, type Trip, type Wallet } from "@/lib/api";
import { Check, Leaf, Shield } from "lucide-react";
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
  const co2 = Number(trip?.co2_saved_kg ?? trip?.route?.carbon_saved_kg ?? 0);
  const weekly = wallet ? (wallet.lifetime_co2_kg * 0.25).toFixed(1) : "0";

  return (
    <div className="relative mx-auto max-w-md overflow-hidden py-12 text-center">
      <CelebrationGlow />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10"
      >
        <Check className="h-12 w-12 text-[#22c55e]" strokeWidth={2} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.55 }}
        className="relative mt-10 text-4xl font-semibold tracking-tight text-white"
      >
        You made it safely
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.48 }}
        className="relative mt-3 text-[#a1a1aa]"
      >
        Safer route chosen. Impact recorded.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.55 }}
        className="relative mt-12 rounded-3xl border border-[#222222] bg-[#111111] p-8"
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">GreenMiles earned</p>
        <p className="mt-2 text-6xl font-semibold tracking-tight text-[#22c55e]">
          +<AnimatedNumber value={tokens} />
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.68 }}
        className="relative mt-4 grid grid-cols-2 gap-3"
      >
        <ImpactCard label="CO₂ saved" value={co2} suffix=" kg" />
        <ImpactCard label="Weekly impact" value={parseFloat(weekly)} suffix=" kg" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.82 }}
        className="relative mt-8 space-y-4 rounded-2xl border border-[#222222] bg-[#111111] p-6 text-left"
      >
        <WinRow icon={Shield} text="Safest route — CCTV-monitored corridor" />
        <WinRow icon={Leaf} text={`${co2} kg less carbon than driving`} />
        <WinRow icon={Check} text={`${tokens} GreenMiles added to wallet`} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="relative mt-10 space-y-3"
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

function ImpactCard({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-2xl border border-[#222222] bg-[#111111] px-4 py-5">
      <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
    </div>
  );
}

function WinRow({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#a1a1aa]">
      <Icon className="h-4 w-4 shrink-0 text-white" />
      <span>{text}</span>
    </div>
  );
}
