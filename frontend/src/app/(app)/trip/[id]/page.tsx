"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Shield, Share2, AlertTriangle, CheckCircle, BellOff, Radio,
  Navigation, Video, MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SafetyMeter } from "@/components/routes/safety-meter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";
import { useLiveLocation } from "@/hooks/use-live-location";
import { getCityConfig } from "@/config/cities";
import type { CctvCamera, SafetyFactor } from "@/lib/types";

const SafetyMap = dynamic(() => import("@/components/maps/safety-map").then((m) => m.SafetyMap), { ssr: false });

interface LiveSafety {
  score: number;
  label: string;
  breakdown: SafetyFactor[];
  cctvCount: number;
  communityReports: number;
  cctvCameras: CctvCamera[];
}

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { city, activeTrip, setActiveTrip } = useAppStore();
  const cityConfig = getCityConfig(city);

  const [completing, setCompleting] = useState(false);
  const [reward, setReward] = useState<{ tokens_earned: number; co2_saved_kg: number; message: string } | null>(null);
  const [sosSent, setSosSent] = useState(false);
  const [deviation, setDeviation] = useState(false);
  const [pathTrail, setPathTrail] = useState<[number, number][]>([]);
  const [liveSafety, setLiveSafety] = useState<LiveSafety | null>(null);
  const [previousScore, setPreviousScore] = useState<number | undefined>();
  const positionRef = useRef<import("@/hooks/use-live-location").LivePosition | null>(null);

  const trip = activeTrip?.id === id ? activeTrip : null;
  const route = trip?.route;

  const { position, error: gpsError, tracking } = useLiveLocation(!!trip && !reward);
  positionRef.current = position;

  // Sync GPS → backend + live safety score every 4 seconds
  useEffect(() => {
    if (!trip || reward) return;

    async function syncLocation() {
      const pos = positionRef.current;
      if (!pos) return;

      const { lat, lng } = pos;

      setPathTrail((prev) => {
        const last = prev[prev.length - 1];
        if (last && last[0] === lat && last[1] === lng) return prev;
        return [...prev, [lat, lng] as [number, number]].slice(-50);
      });

      try {
        const [tripRes, ctx] = await Promise.all([
          api.updateTripLocation(id, lat, lng),
          api.getLocationSafetyContext(lat, lng, 400, city),
        ]);
        if (tripRes.deviation_alert) setDeviation(true);
        setLiveSafety((prev) => {
          if (prev && prev.score !== ctx.safety_score) {
            setPreviousScore(prev.score);
          }
          return {
            score: ctx.safety_score,
            label: ctx.safety_label,
            breakdown: ctx.safety_breakdown,
            cctvCount: ctx.cctv_count,
            communityReports: ctx.community_reports_nearby,
            cctvCameras: ctx.cctv_cameras ?? [],
          };
        });
      } catch {
        /* retry on next interval */
      }
    }

    syncLocation();
    const interval = setInterval(syncLocation, 4000);
    return () => clearInterval(interval);
  }, [trip, id, city, reward]);

  async function handleSOS(silent: boolean) {
    const lat = position?.lat ?? cityConfig.center[0];
    const lng = position?.lng ?? cityConfig.center[1];
    await api.triggerSOS({ trip_id: id, silent, latitude: lat, longitude: lng });
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

  const displayScore = liveSafety?.score ?? route.safety_score;
  const displayLabel = liveSafety?.label ?? route.safety_label;
  const mapCenter: [number, number] = position
    ? [position.lat, position.lng]
    : cityConfig.center;
  const userPosition: [number, number] | null = position
    ? [position.lat, position.lng]
    : null;

  const cctvFactor = liveSafety?.breakdown.find((f) => f.factor.includes("CCTV"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Trip"
        description={`${route.source} → ${route.destination}`}
        badge={
          <Badge className="animate-pulse border-red-200 bg-red-50 text-red-600">
            <Radio className="mr-1 h-3 w-3" /> LIVE GPS
          </Badge>
        }
      />

      {/* GPS status */}
      <div className="flex flex-wrap items-center gap-2">
        {tracking && position && (
          <Badge variant="safe" className="gap-1">
            <Navigation className="h-3 w-3" />
            GPS active · ±{Math.round(position.accuracy)}m
          </Badge>
        )}
        {gpsError && (
          <Badge variant="risky">GPS unavailable — using route baseline score</Badge>
        )}
        {liveSafety && liveSafety.cctvCount > 0 && (
          <Badge className="border-blue-200 bg-blue-50 text-blue-700 gap-1">
            <Video className="h-3 w-3" />
            {liveSafety.cctvCount} CCTV nearby
          </Badge>
        )}
        {position && (
          <span className="text-xs text-muted">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </span>
        )}
      </div>

      {deviation && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">Route deviation detected — you&apos;ve left the safe path.</p>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <SafetyMap
          reports={[]}
          cctvCameras={liveSafety?.cctvCameras}
          center={mapCenter}
          userPosition={userPosition}
          pathTrail={pathTrail}
          followUser={!!position}
          zoom={15}
          height="300px"
        />
      </Card>

      <Card>
        <SafetyMeter
          score={displayScore}
          label={displayLabel}
          live={!!liveSafety}
          previousScore={previousScore}
        />

        {liveSafety && (
          <div className="mt-4 space-y-2 rounded-xl border border-primary/10 bg-primary-light/20 px-4 py-3">
            <p className="text-label">Live safety factors at your location</p>
            {liveSafety.breakdown
              .filter((f) => Math.abs(f.impact) >= 5)
              .slice(0, 4)
              .map((f) => (
                <p key={f.factor} className="text-xs font-medium text-foreground">
                  <span className={f.impact >= 0 ? "text-accent" : "text-danger"}>
                    {f.impact >= 0 ? "+" : ""}{f.impact}
                  </span>
                  {" · "}{f.description}
                </p>
              ))}
            {cctvFactor && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                <Video className="h-3.5 w-3.5" /> {cctvFactor.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-label">Next Segment</p>
          <p className="mt-1 font-semibold capitalize">
            {route.legs[0]?.mode} · {route.legs[0]?.from} → {route.legs[0]?.to}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-accent">
            <MapPin className="h-3.5 w-3.5" />
            Earning ~{route.reward_tokens} tokens on completion
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="danger" size="lg" onClick={() => handleSOS(false)} disabled={sosSent}>
          <Shield className="h-5 w-5" /> SOS Alert
        </Button>
        <Button variant="secondary" size="lg" onClick={() => handleSOS(true)} disabled={sosSent}>
          <BellOff className="h-5 w-5" /> Silent SOS
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigator.clipboard.writeText(trip?.share_link || "")}>
          <Share2 className="h-5 w-5" /> Share Trip
        </Button>
        <Button variant="accent" size="lg" onClick={handleComplete} disabled={completing}>
          <CheckCircle className="h-5 w-5" /> End Trip
        </Button>
      </div>

      {sosSent && (
        <p className="text-center text-sm font-semibold text-danger">
          SOS alert sent with your live GPS coordinates
        </p>
      )}
    </div>
  );
}
