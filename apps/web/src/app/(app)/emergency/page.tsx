"use client";

import { SafeWaitingSpots } from "@/components/safety/safe-waiting-spots";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useCity } from "@/hooks/use-city";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Cross,
  Eye,
  EyeOff,
  Heart,
  Phone,
  Share2,
  Shield,
  Siren,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmergencyPage() {
  const { city } = useCity();
  const { coords } = useLiveLocation();
  const tripId = useActiveTrip((s) => s.tripId);
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [sosStatus, setSosStatus] = useState("");
  const [silent, setSilent] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    api.contacts().then((r) => setContacts(r.contacts)).catch(() => null);
  }, []);

  async function triggerSOS() {
    setTriggering(true);
    setSosStatus("");
    try {
      const result = await api.sos({
        trip_id: tripId ?? undefined,
        silent,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      setSosStatus(
        `Alert sent to ${result.notified}/${result.total_contacts} contacts${
          result.share_url ? ` · Share link active` : ""
        }`
      );
    } catch {
      setSosStatus("Could not send SOS. Check your connection and try again.");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EF4444]/15">
            <Shield className="h-6 w-6 text-[#EF4444]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Emergency Shield</h1>
            <p className="text-sm text-[#A1A1AA]">Always accessible within two taps</p>
          </div>
        </div>
      </motion.div>

      {/* One-tap SOS */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="!border-[#EF4444]/30 !bg-gradient-to-b !from-[#EF4444]/10 !to-[#111111] !p-8 text-center">
          <button
            type="button"
            onClick={triggerSOS}
            disabled={triggering}
            className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[#EF4444] shadow-2xl shadow-[#EF4444]/40 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            <Siren className="h-14 w-14 text-white" />
          </button>
          <p className="mt-5 text-lg font-bold text-white">
            {triggering ? "Sending alert…" : "Tap for SOS"}
          </p>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Notifies trusted contacts with your live location
          </p>

          <button
            type="button"
            onClick={() => setSilent((v) => !v)}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#050505] px-4 py-2 text-xs font-semibold text-[#A1A1AA] transition hover:text-white"
          >
            {silent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {silent ? "Silent SOS enabled" : "Enable silent SOS"}
          </button>

          {sosStatus && (
            <p className="mt-4 text-sm text-[#22C55E]">{sosStatus}</p>
          )}
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <EmergencyCard
          icon={Users}
          title="Trusted Contacts"
          desc={`${contacts.length} contacts configured`}
          action="View contacts"
          href="/profile"
        />
        <EmergencyCard
          icon={Share2}
          title="Live Trip Sharing"
          desc={tripId ? "Active trip — sharing enabled" : "Start a trip to share live"}
          action={tripId ? "Open trip" : "Plan route"}
          href={tripId ? `/trip/${tripId}` : "/home"}
        />
        <EmergencyCard
          icon={Shield}
          title="Police Stations"
          desc="Nearest booths via safe spots"
          action="Find nearest"
          href="#safe-spots"
        />
        <EmergencyCard
          icon={Cross}
          title="Hospitals"
          desc="24/7 emergency care nearby"
          action="Find nearest"
          href="#safe-spots"
        />
      </div>

      <Card className="!p-5">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#EC4899]" />
          <h3 className="text-sm font-bold text-white">Women&apos;s Emergency Resources</h3>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a href="tel:1091" className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition hover:border-[#EC4899]/30">
            <Phone className="h-4 w-4 text-[#EC4899]" />
            <div>
              <p className="text-sm font-semibold text-white">Women Helpline</p>
              <p className="text-xs text-[#A1A1AA]">1091 — National</p>
            </div>
          </a>
          <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition hover:border-[#EC4899]/30">
            <Phone className="h-4 w-4 text-[#EC4899]" />
            <div>
              <p className="text-sm font-semibold text-white">Domestic Violence</p>
              <p className="text-xs text-[#A1A1AA]">181 — 24/7 support</p>
            </div>
          </a>
        </div>
      </Card>

      <div id="safe-spots">
        <SafeWaitingSpots city={city} />
      </div>
    </div>
  );
}

function EmergencyCard({
  icon: Icon,
  title,
  desc,
  action,
  href,
}: {
  icon: typeof Shield;
  title: string;
  desc: string;
  action: string;
  href: string;
}) {
  return (
    <Card className="!p-5">
      <Icon className="h-5 w-5 text-[#3B82F6]" />
      <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-[#A1A1AA]">{desc}</p>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="mt-3 !px-0">
          {action} →
        </Button>
      </Link>
    </Card>
  );
}
