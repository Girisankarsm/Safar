import { supabase } from "@/lib/supabase/client";
import type { EmergencyContact } from "@/types/database";

export const contactsService = {
  async list(): Promise<EmergencyContact[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as EmergencyContact[];
  },

  async add(contact: { name: string; phone: string; relationship?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("emergency_contacts")
      .insert({ ...contact, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data as EmergencyContact;
  },

  async remove(id: string) {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) throw error;
  },
};
