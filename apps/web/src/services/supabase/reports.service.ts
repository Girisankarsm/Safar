import { supabase } from "@/lib/supabase/client";
import type { CityId, CommunityComment, ReportType, SafetyReport } from "@/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const reportsService = {
  async listByCity(cityId: CityId, limit = 50): Promise<SafetyReport[]> {
    const { data, error } = await supabase
      .from("safety_reports")
      .select("*")
      .eq("city_id", cityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as SafetyReport[];
  },

  async create(input: {
    city_id: CityId;
    report_type: ReportType;
    description?: string;
    latitude: number;
    longitude: number;
    image_url?: string;
  }): Promise<SafetyReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("safety_reports")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) throw error;

    const { data: profile } = await supabase
      .from("users")
      .select("reports_submitted")
      .eq("id", user.id)
      .single();
    if (profile) {
      await supabase
        .from("users")
        .update({ reports_submitted: (profile.reports_submitted ?? 0) + 1 })
        .eq("id", user.id);
    }

    return data as SafetyReport;
  },

  async vote(reportId: string, voteType: "upvote" | "verify") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("report_votes")
      .insert({ report_id: reportId, user_id: user.id, vote_type: voteType });
    if (error) throw error;

    const { data } = await supabase
      .from("safety_reports")
      .select("*")
      .eq("id", reportId)
      .single();
    return data as SafetyReport;
  },

  async addComment(reportId: string, body: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("community_comments")
      .insert({ report_id: reportId, user_id: user.id, body })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async listComments(reportId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, report_id, user_id, body, created_at, users(full_name)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => {
      const users = row.users as { full_name: string | null } | { full_name: string | null }[] | null;
      const profile = Array.isArray(users) ? users[0] : users;
      return {
        id: row.id,
        report_id: row.report_id,
        user_id: row.user_id,
        body: row.body,
        created_at: row.created_at,
        author_name: profile?.full_name ?? "Community member",
      };
    });
  },

  async countComments(reportId: string): Promise<number> {
    const { count, error } = await supabase
      .from("community_comments")
      .select("id", { count: "exact", head: true })
      .eq("report_id", reportId);
    if (error) return 0;
    return count ?? 0;
  },

  async remove(reportId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: report, error: fetchError } = await supabase
      .from("safety_reports")
      .select("id, user_id, image_url")
      .eq("id", reportId)
      .single();
    if (fetchError) throw fetchError;
    if (report.user_id !== user.id) throw new Error("You can only delete your own reports");

    const { error } = await supabase.from("safety_reports").delete().eq("id", reportId);
    if (error) throw error;

    if (report.image_url) {
      const match = report.image_url.match(/report-images\/(.+)$/);
      if (match?.[1]) {
        await supabase.storage.from("report-images").remove([match[1]]);
      }
    }

    const { data: profile } = await supabase
      .from("users")
      .select("reports_submitted")
      .eq("id", user.id)
      .single();
    if (profile && (profile.reports_submitted ?? 0) > 0) {
      await supabase
        .from("users")
        .update({ reports_submitted: profile.reports_submitted - 1 })
        .eq("id", user.id);
    }
  },

  subscribe(cityId: CityId, onUpdate: () => void): RealtimeChannel {
    return supabase
      .channel(`reports-${cityId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "safety_reports", filter: `city_id=eq.${cityId}` },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_votes" },
        () => onUpdate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_comments" },
        () => onUpdate()
      )
      .subscribe();
  },
};
