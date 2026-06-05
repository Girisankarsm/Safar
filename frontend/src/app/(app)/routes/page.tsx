"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/stores/app-store";
import { RouteCard } from "@/components/routes/route-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { InsightBanner } from "@/components/layout/insight-banner";
import { api } from "@/lib/api/client";
import type { RouteOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Route } from "lucide-react";

export default function RoutesPage() {
  const router = useRouter();
  const { routes, source, destination, selectRoute, setActiveTrip } = useAppStore();

  async function handleSelect(route: RouteOption) {
    selectRoute(route);
    try {
      const trip = await api.startTrip(route.id);
      setActiveTrip(trip);
      router.push(`/trip/${trip.id}`);
    } catch {
      router.push("/plan");
    }
  }

  if (!routes.length) {
    return (
      <EmptyState
        icon={Route}
        title="No routes found"
        description="Plan a journey first to compare fastest, safest, and greenest route options."
        actionLabel="Plan a Trip"
        onAction={() => router.push("/plan")}
      />
    );
  }

  const safest = routes.find((r) => r.route_type === "safest");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Route Comparison"
        description="AI-analyzed options ranked by speed, safety, and sustainability"
        action={
          <Link href="/plan">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Edit</Button>
          </Link>
        }
      />

      <div className="surface flex items-center gap-3 px-5 py-4">
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-label">Selected Journey</p>
          <p className="font-semibold">{source} → {destination}</p>
        </div>
      </div>

      {safest && (
        <InsightBanner
          variant="primary"
          message={`Safest route scores ${safest.safety_score}/100 — ${safest.eta_minutes - (routes.find(r => r.route_type === 'fastest')?.eta_minutes ?? 0)} min slower but significantly safer for your commute.`}
        />
      )}

      <div className="grid gap-6">
        {routes.map((route, i) => (
          <RouteCard
            key={route.id}
            route={route}
            onSelect={handleSelect}
            highlighted={route.route_type === "safest"}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
