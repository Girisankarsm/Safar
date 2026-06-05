"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/stores/app-store";
import { getCityConfig } from "@/config/cities";

const REPORT_TYPES = [
  { id: "unsafe_area", label: "Unsafe Area" },
  { id: "harassment", label: "Harassment" },
  { id: "broken_light", label: "Broken Street Light" },
  { id: "pothole", label: "Pothole" },
  { id: "flooded_road", label: "Flooded Road" },
  { id: "dangerous_crossing", label: "Dangerous Crossing" },
];

export default function ReportPage() {
  const router = useRouter();
  const city = useAppStore((s) => s.city);
  const cityConfig = getCityConfig(city);
  const [type, setType] = useState("broken_light");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const lat = coords?.lat ?? cityConfig.center[0];
      const lng = coords?.lng ?? cityConfig.center[1];
      await api.createReport({
        report_type: type,
        description,
        latitude: lat,
        longitude: lng,
        city,
      });
      router.push("/safety-map");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title="Report Safety Issue"
        description={`Help make commuting safer for everyone in ${cityConfig.displayName}`}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-label mb-3 block">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    type === t.id
                      ? "border-primary bg-primary-light/50 text-primary shadow-sm"
                      : "border-border bg-white text-foreground hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label mb-2 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              required
            />
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-muted">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            {locating
              ? "Getting your GPS location..."
              : coords
                ? `Report will be pinned at your location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).`
                : "GPS unavailable — report will use default Hyderabad coordinates."}
          </p>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
