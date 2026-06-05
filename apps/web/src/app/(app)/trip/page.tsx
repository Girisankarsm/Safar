"use client";

import { useActiveTrip } from "@/hooks/use-active-trip";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Trip hub — only redirects. Live trip appears after Start Trip from Routes. */
export default function TripHubPage() {
  const tripId = useActiveTrip((s) => s.tripId);
  const router = useRouter();

  useEffect(() => {
    if (tripId) {
      router.replace(`/trip/${tripId}`);
      return;
    }
    const hasSearch = sessionStorage.getItem("safarai-search");
    router.replace(hasSearch ? "/routes" : "/home");
  }, [tripId, router]);

  return null;
}
