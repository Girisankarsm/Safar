"use client";

import { ButtonLink } from "@/components/ui/button";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TripHubPage() {
  const tripId = useActiveTrip((s) => s.tripId);
  const router = useRouter();

  useEffect(() => {
    if (tripId) router.replace(`/trip/${tripId}`);
  }, [tripId, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-surface shadow-sm">
        <MapPin className="h-8 w-8 text-muted" />
      </div>
      <h1 className="font-display mt-6 text-2xl font-bold text-foreground">No active trip</h1>
      <p className="mt-2 text-muted">Plan a route and start your safest commute.</p>
      <ButtonLink href="/home" className="mt-8" size="lg">
        Plan a route
      </ButtonLink>
    </div>
  );
}
