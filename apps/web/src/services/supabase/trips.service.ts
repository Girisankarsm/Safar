import { supabase } from "@/lib/supabase/client";
import type { CityId, EmergencyContact, PlannedRoute, Trip } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

const SHARE_TTL_MS = 24 * 60 * 60 * 1000;

export const tripsService = {
  async getById(id: string) {
    return supabase.from("trips").select("*").eq("id", id).maybeSingle();
  },

  async getActiveForUser(): Promise<Trip | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as Trip;
  },

  async start(cityId: CityId, route: PlannedRoute): Promise<Trip> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const shareExpiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString();

    let { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        city_id: cityId,
        status: "active",
        current_lat: route.source_lat,
        current_lng: route.source_lng,
        share_expires_at: shareExpiresAt,
      })
      .select()
      .single();

    if (error?.message?.includes("share_expires_at")) {
      ({ data, error } = await supabase
        .from("trips")
        .insert({
          user_id: user.id,
          city_id: cityId,
          status: "active",
          current_lat: route.source_lat,
          current_lng: route.source_lng,
        })
        .select()
        .single());
    }

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

    const { data: contactList } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id);

    return {
      notified: contactList?.length ?? 0,
      contacts: (contactList ?? []) as EmergencyContact[],
    };
  },

  async getByShareToken(token: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("share_token", token)
      .single();
    if (error) return null;
    const trip = data as Trip;
    if (trip.share_expires_at && new Date(trip.share_expires_at) < new Date()) {
      return null;
    }
    return trip;
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
