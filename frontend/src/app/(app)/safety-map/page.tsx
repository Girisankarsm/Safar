"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api/client";
import type { SafetyReport } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const SafetyMap = dynamic(() => import("@/components/maps/safety-map").then((m) => m.SafetyMap), { ssr: false });

export default function SafetyMapPage() {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [segments, setSegments] = useState<Array<{ latitude: number; longitude: number; color: string; rating: number; condition: string }>>([]);
  const [selected, setSelected] = useState<SafetyReport | null>(null);

  useEffect(() => {
    api.getReports().then((r) => setReports(r.reports)).catch(() => {});
    api.getRoadRatings().then((r) => setSegments(r.segments)).catch(() => {});
  }, []);

  async function handleVote(type: string) {
    if (!selected) return;
    const updated = await api.voteReport(selected.id, type);
    setSelected(updated as SafetyReport);
    setReports((prev) => prev.map((r) => (r.id === selected.id ? (updated as SafetyReport) : r)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Safety Map</h1>
          <p className="text-muted">Community reports + road intelligence</p>
        </div>
        <Link href="/report"><Button size="sm">+ Report</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge>🔴 Harassment</Badge>
        <Badge>🟡 Broken light</Badge>
        <Badge>🟣 Pothole</Badge>
        <Badge variant="safe">🟢 Road: Good</Badge>
        <Badge variant="moderate">🟡 Road: Moderate</Badge>
        <Badge variant="risky">🔴 Road: Poor</Badge>
      </div>

      <SafetyMap reports={reports} roadSegments={segments} height="420px" />

      {selected && (
        <Card>
          <h3 className="font-semibold capitalize">{selected.report_type.replace("_", " ")}</h3>
          <p className="text-sm text-muted">{selected.description}</p>
          <p className="mt-2 text-xs">↑ {selected.upvotes} · {selected.verifications} verifications {selected.is_verified && "✓"}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleVote("upvote")}>Upvote</Button>
            <Button size="sm" onClick={() => handleVote("verify")}>Verify</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {reports.slice(0, 4).map((r) => (
          <Card key={r.id} className="cursor-pointer hover:ring-2 hover:ring-primary/20" onClick={() => setSelected(r)}>
            <p className="text-sm font-medium capitalize">{r.report_type.replace("_", " ")}</p>
            <p className="text-xs text-muted line-clamp-1">{r.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
