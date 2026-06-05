"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Shield, Share2, AlertTriangle, CheckCircle, BellOff, Radio } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SafetyMeter } from "@/components/routes/safety-meter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";

const SafetyMap = dynamic(() => import("@/components/maps/safety-map").then((m) => m.SafetyMap), { ssr: false });

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeTrip, setActiveTrip } = useAppStore();
  const [completing, setCompleting] = useState(false);
  const [reward, setReward] = useState<{ tokens_earned: number; co2_saved_kg: number; message: string } | null>(null);
  const [sosSent, setSosSent] = useState(false);
  const [deviation, setDeviation] = useState(false);

  const trip = activeTrip?.id === id ? activeTrip : null;
  const route = trip?.route;

  useEffect(() => {
    if (!trip) return;
    const interval = setInterval(() => {
      api.updateTripLocation(id, 17.44 + Math.random() * 0.02, 78.45 + Math.random() * 0.02)
        .then((r) => { if (r.deviation_alert) setDeviation(true); })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [id, trip]);

  async function handleSOS(silent: boolean) {
    await api.triggerSOS({ trip_id: id, silent, latitude: 17.44, longitude: 78.45 });
    setSosSent(true);
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const result = await api.completeTrip(id);
      setReward(result);
      setActiveTrip(null);
    } finally {
      setCompleting(false);
    }
  }

  if (!route) {
    return (
      <Card className="mx-auto max-w-md py-12 text-center">
        <p className="text-muted">No active trip found.</p>
        <Button className="mt-4" onClick={() => router.push("/plan")}>Plan New Trip</Button>
      </Card>
    );
  }

  if (reward) {
    return (
      <Card className="mx-auto max-w-md overflow-hidden p-0 text-center">
        <div className="gradient-accent px-6 py-10 text-white">
          <CheckCircle className="mx-auto mb-4 h-16 w-16" />
          <h2 className="text-2xl font-bold">Trip Complete!</h2>
          <p className="mt-2 text-green-100">{reward.message}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <div className="rounded-xl bg-accent-light p-4">
            <p className="text-3xl font-bold text-accent">+{reward.tokens_earned}</p>
            <p className="text-label mt-1">Tokens Earned</p>
          </div>
          <div className="rounded-xl bg-accent-light p-4">
            <p className="text-3xl font-bold text-accent">{reward.co2_saved_kg}</p>
            <p className="text-label mt-1">kg CO₂ Saved</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <Button className="w-full" size="lg" onClick={() => router.push("/wallet")}>View Wallet</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Trip"
        description={`${route.source} → ${route.destination}`}
        badge={
          <Badge className="animate-pulse border-red-200 bg-red-50 text-red-600">
            <Radio className="mr-1 h-3 w-3" /> LIVE
          </Badge>
        }
      />

      {deviation && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">Route deviation detected — you&apos;ve left the safe path.</p>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <SafetyMap reports={[]} center={[17.44, 78.45]} height="300px" />
      </Card>

      <Card>
        <SafetyMeter score={route.safety_score} label={route.safety_label} />
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-label">Next Segment</p>
          <p className="mt-1 font-semibold capitalize">
            {route.legs[0]?.mode} · {route.legs[0]?.from} → {route.legs[0]?.to}
          </p>
          <p className="mt-1 text-sm text-accent">Earning ~{route.reward_tokens} tokens on completion</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button variant="danger" onClick={() => handleSOS(false)} disabled={sosSent}>
          <Shield className="h-4 w-4" /> SOS
        </Button>
        <Button variant="secondary" onClick={() => handleSOS(true)} disabled={sosSent}>
          <BellOff className="h-4 w-4" /> Silent
        </Button>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(trip?.share_link || "")}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button variant="accent" onClick={handleComplete} disabled={completing}>
          <CheckCircle className="h-4 w-4" /> End Trip
        </Button>
      </div>

      {sosSent && (
        <p className="text-center text-sm font-semibold text-danger">SOS alert sent to emergency contacts</p>
      )}
    </div>
  );
}
