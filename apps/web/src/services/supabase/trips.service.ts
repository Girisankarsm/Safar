import { supabase } from "@/lib/supabase/client";
import type { CityId, PlannedRoute, Trip } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const tripsService = {
  async start(cityId: CityId, route: PlannedRoute): Promise<Trip> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        city_id: cityId,
        status: "active",
        current_lat: route.source_lat,
        current_lng: route.source_lng,
      })
      .select()
      .single();
    if (error) throw error;

    const { data: profile } = await supabase.from("users").select("total_trips").eq("id", user.id).single();
    if (profile) {
      await supabase.from("users").update({ total_trips: (profile.total_trips ?? 0) + 1 }).eq("id", user.id);
    }

    return data as Trip;
  },

  async updateLocation(tripId: string, lat: number, lng: number) {
    const { data, error } = await supabase
      .from("trips")
      .update({ current_lat: lat, current_lng: lng })
      .eq("id", tripId)
      .select()
      .single();
    if (error) throw error;
    return data as Trip;
  },

  async complete(tripId: string) {
    const { data, error } = await supabase
      .from("trips")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", tripId)
      .select()
      .single();
    if (error) throw error;
    return data as Trip;
  },

  async triggerSOS(tripId: string, lat?: number, lng?: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await supabase
      .from("trips")
      .update({
        sos_triggered: true,
        ...(lat != null && lng != null ? { current_lat: lat, current_lng: lng } : {}),
      })
      .eq("id", tripId);

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "SOS Alert Triggered",
      body: "Your emergency contacts have been notified.",
      type: "sos",
    });

    const contacts = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id);

    return { notified: contacts.data?.length ?? 0 };
  },

  async getByShareToken(token: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("share_token", token)
      .single();
    if (error) return null;
    return data as Trip;
  },

  subscribeToTrip(tripId: string, onUpdate: (trip: Trip) => void): RealtimeChannel {
    return supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        (payload) => onUpdate(payload.new as Trip)
      )
      .subscribe();
  },
};
