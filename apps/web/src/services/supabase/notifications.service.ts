import { supabase } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const notificationsService = {
  async list(limit = 20): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
  },

  subscribe(onUpdate: () => void): RealtimeChannel {
    return supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => onUpdate()
      )
      .subscribe();
  },
};
