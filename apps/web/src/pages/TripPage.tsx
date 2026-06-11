import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tripsService } from "@/services/supabase/trips.service";
import type { Trip } from "@/types/database";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function TripPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (!id) return;
    const channel = tripsService.subscribeToTrip(id, setTrip);
    navigator.geolocation.watchPosition((p) => {
      tripsService.updateLocation(id, p.coords.latitude, p.coords.longitude).then(setTrip);
    });
    return () => { channel.unsubscribe(); };
  }, [id]);

  async function complete() {
    if (!id) return;
    await tripsService.complete(id);
    navigate("/home");
  }

  if (!id) {
    return (
      <Card className="text-center py-12">
        <p className="text-[#A1A1AA]">No active trip. Plan a route from the dashboard.</p>
        <Button className="mt-4" onClick={() => navigate("/home")}>Go to dashboard</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-white">Live Trip</h1>
      <Card>
        <p className="text-sm text-[#A1A1AA]">Status</p>
        <p className="text-xl font-bold text-[#22C55E]">{trip?.status ?? "active"}</p>
        {trip?.share_token && (
          <p className="mt-3 text-xs text-[#A1A1AA]">
            Share link: {window.location.origin}/share/{trip.share_token}
          </p>
        )}
        {trip?.current_lat != null && (
          <p className="mt-2 text-sm text-white">
            Location: {trip.current_lat.toFixed(4)}, {trip.current_lng?.toFixed(4)}
          </p>
        )}
      </Card>
      <Button variant="outline" className="w-full" onClick={complete}>Complete trip</Button>
    </div>
  );
}
