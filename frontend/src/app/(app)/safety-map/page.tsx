"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, ThumbsUp, CheckCircle, Video } from "lucide-react";
import { api } from "@/lib/api/client";
import type { SafetyReport, CctvCamera } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { CitySwitcher } from "@/components/layout/city-switcher";
import { useAppStore } from "@/lib/stores/app-store";
import { getCityConfig } from "@/config/cities";

const SafetyMap = dynamic(() => import("@/components/maps/safety-map").then((m) => m.SafetyMap), { ssr: false });

export default function SafetyMapPage() {
  const city = useAppStore((s) => s.city);
  const cityConfig = getCityConfig(city);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [segments, setSegments] = useState<Array<{ latitude: number; longitude: number; color: string; rating: number; condition: string }>>([]);
  const [cctvCameras, setCctvCameras] = useState<CctvCamera[]>([]);
  const [cctvCount, setCctvCount] = useState(0);
  const [selected, setSelected] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getReports(city), api.getRoadRatings(city), api.getCctvMap(city)])
      .then(([r, s, c]) => {
        setReports(r.reports);
        setSegments(s.segments);
        setCctvCameras(c.cameras);
        setCctvCount(c.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city]);

  async function handleVote(type: string) {
    if (!selected) return;
    const updated = await api.voteReport(selected.id, type);
    setSelected(updated as SafetyReport);
    setReports((prev) => prev.map((r) => (r.id === selected.id ? (updated as SafetyReport) : r)));
  }

  if (loading) return <LoadingSpinner label="Loading safety map..." />;

  return (
    <PageContainer>
      <PageHeader
        title="Safety Map"
        description={`Real OSM CCTV cameras + community reports across ${cityConfig.displayName}`}
        action={<ButtonLink href="/report" size="sm">+ Report Issue</ButtonLink>}
      />

      <CitySwitcher />

      <div className="flex flex-wrap gap-2">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          <Video className="mr-1 h-3 w-3" /> {cctvCount} OSM CCTV cameras
        </Badge>
        <Badge variant="risky">Harassment</Badge>
        <Badge variant="moderate">Broken light</Badge>
        <Badge>Pothole</Badge>
        <Badge variant="safe">Road: Good</Badge>
      </div>

      <Card className="overflow-hidden p-0">
        <SafetyMap
          reports={reports}
          roadSegments={segments}
          cctvCameras={cctvCameras}
          center={cityConfig.center}
          height="420px"
        />
      </Card>

      {selected && (
        <Card className="border-primary/20 bg-primary-light/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold capitalize">{selected.report_type.replace("_", " ")}</h3>
              <p className="mt-1 text-sm text-muted">{selected.description}</p>
              <p className="mt-2 flex items-center gap-2 text-xs font-medium text-muted">
                <ThumbsUp className="h-3.5 w-3.5" /> {selected.upvotes} upvotes
                <span>·</span>
                <CheckCircle className="h-3.5 w-3.5" /> {selected.verifications} verifications
                {selected.is_verified && <Badge variant="safe" className="ml-1">Verified</Badge>}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleVote("upvote")}>Upvote</Button>
            <Button size="sm" onClick={() => handleVote("verify")}>Verify Report</Button>
          </div>
        </Card>
      )}

      <div>
        <p className="text-label mb-3">Recent Reports</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.slice(0, 6).map((r) => (
            <Card
              key={r.id}
              className="cursor-pointer transition hover:border-primary/30 hover:shadow-md"
              onClick={() => setSelected(r)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize">{r.report_type.replace("_", " ")}</p>
                  <p className="text-xs text-muted line-clamp-2">{r.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
