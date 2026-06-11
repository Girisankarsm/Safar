import { useAuthStore } from "@/stores/auth.store";
import { useCallback } from "react";
import { getAuthErrorMessage } from "./auth-errors";
import { authService } from "./auth.service";

export function useAuth() {
  const { session, profile, loading, setSession, setProfile, setLoading } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    const { session: nextSession, user } = await authService.signIn(email, password);
    setSession(nextSession);
    if (user) {
      const userProfile = await authService.ensureUserProfile(user);
      setProfile(userProfile);
    }
    return nextSession;
  }, [setSession, setProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    return authService.signUp(email, password, fullName);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setProfile(null);
  }, [setSession, setProfile]);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    const userProfile = await authService.ensureUserProfile(session.user);
    setProfile(userProfile);
    return userProfile;
  }, [session?.user, setProfile]);

  return {
    session,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    user: session?.user ?? null,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshProfile,
    getAuthErrorMessage,
  };
}
