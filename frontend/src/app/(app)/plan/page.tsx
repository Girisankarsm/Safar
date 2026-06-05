"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Moon, MapPin, Navigation, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { PageContainer } from "@/components/layout/page-container";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";
import { getCityConfig } from "@/config/cities";
import { CitySwitcher } from "@/components/layout/city-switcher";

export default function PlanPage() {
  const router = useRouter();
  const {
    city, source, destination, setSource, setDestination,
    womenSafetyMode, nightSafeMode,
    setWomenSafetyMode, setNightSafeMode, setRoutes,
  } = useAppStore();
  const cityConfig = getCityConfig(city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    setLoading(true);
    setError("");
    try {
      const { routes } = await api.searchRoutes({
        source,
        destination,
        city,
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
    <PageContainer narrow>
      <PageHeader
        title="Plan Your Journey"
        description={`Compare fastest, safest, and greenest routes in ${cityConfig.displayName} — scored with real OSM CCTV + community data`}
      />

      <CitySwitcher />

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

        <div className="mb-6 space-y-3">
          <p className="text-label">Safety Preferences</p>
          <Toggle
            checked={womenSafetyMode}
            onChange={setWomenSafetyMode}
            label="Women Safety Mode"
            description="Prioritize well-lit, verified safe routes"
            icon={<Shield className="h-5 w-5 text-pink-600" />}
          />
          <Toggle
            checked={nightSafeMode}
            onChange={setNightSafeMode}
            label="Night-Safe Routes"
            description="24/7 transport + safer last-mile only"
            icon={<Moon className="h-5 w-5 text-indigo-600" />}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>
        )}

        <Button className="w-full" size="lg" onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? "Analyzing routes..." : "Find Optimal Routes"}
        </Button>
      </Card>
    </PageContainer>
  );
}
