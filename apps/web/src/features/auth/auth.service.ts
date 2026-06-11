import { supabase } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/database";
import type { Session, User } from "@supabase/supabase-js";

function getRedirectUrl(path = "/login") {
  return `${window.location.origin}${path}`;
}

function metadataName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    null
  );
}

function metadataAvatar(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null
  );
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl("/login"),
        queryParams: { access_type: "offline" },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl("/login"),
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) return null;
    return data as UserProfile | null;
  },

  async ensureUserProfile(user: User): Promise<UserProfile | null> {
    let existing = await this.getProfile(user.id);
    const fullName = metadataName(user) ?? user.email?.split("@")[0] ?? "Commuter";
    const avatarUrl = metadataAvatar(user);

    if (!existing) {
      // Row is created by the DB trigger on auth.users insert; brief retry for OAuth race.
      await new Promise((resolve) => setTimeout(resolve, 300));
      existing = await this.getProfile(user.id);
      if (!existing) return null;
    }

    const needsUpdate =
      (!existing.full_name && fullName) ||
      (!existing.avatar_url && avatarUrl);

    if (needsUpdate) {
      return this.updateProfile(user.id, {
        full_name: existing.full_name ?? fullName,
        avatar_url: existing.avatar_url ?? avatarUrl,
      });
    }

    return existing;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  },
};
