import { authService } from "@/services/supabase/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    authService.getSession().then(async (session) => {
      setSession(session);
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        setProfile(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange(async (session) => {
      setSession(session);
      if (session?.user) {
        const profile = await authService.getProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading]);

  return <>{children}</>;
}
