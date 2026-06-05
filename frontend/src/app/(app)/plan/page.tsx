"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Moon, MapPin, Navigation, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";

export default function PlanPage() {
  const router = useRouter();
  const {
    source, destination, setSource, setDestination,
    womenSafetyMode, nightSafeMode,
    setWomenSafetyMode, setNightSafeMode, setRoutes,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    try {
      const { routes } = await api.searchRoutes({
        source,
        destination,
        women_safety_mode: womenSafetyMode,
        prefer_night_safe: nightSafeMode,
      });
      setRoutes(routes);
      router.push("/routes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to search routes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Plan Your Journey"
        description="Compare fastest, safest, and greenest multi-modal routes with AI safety scoring"
      />

      <Card>
        <div className="mb-6 space-y-4">
          <div>
            <label className="text-label mb-2 block">Origin</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-accent" />
              <Input className="pl-10" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. HITEC City" />
            </div>
          </div>
          <div>
            <label className="text-label mb-2 block">Destination</label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
              <Input className="pl-10" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Secunderabad Station" />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border">
          <div className="border-b border-border bg-slate-50 px-4 py-3">
            <p className="text-label">Safety Preferences</p>
          </div>
          <div className="divide-y divide-border">
            <label className="flex cursor-pointer items-center justify-between px-4 py-4 transition hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-50">
                  <Shield className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Women Safety Mode</p>
                  <p className="text-xs text-muted">Prioritize well-lit, verified safe routes</p>
                </div>
              </div>
              <input type="checkbox" checked={womenSafetyMode} onChange={(e) => setWomenSafetyMode(e.target.checked)} className="h-5 w-5 rounded accent-primary" />
            </label>
            <label className="flex cursor-pointer items-center justify-between px-4 py-4 transition hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Moon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Night-Safe Routes</p>
                  <p className="text-xs text-muted">24/7 transport + safer last-mile only</p>
                </div>
              </div>
              <input type="checkbox" checked={nightSafeMode} onChange={(e) => setNightSafeMode(e.target.checked)} className="h-5 w-5 rounded accent-primary" />
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <Button className="w-full" size="lg" onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? "Analyzing routes..." : "Find Optimal Routes"}
        </Button>
      </Card>
    </div>
  );
}
