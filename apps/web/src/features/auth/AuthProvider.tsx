import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";
import { clearOAuthCallbackParams, parseOAuthCallbackError } from "./auth-errors";
import { authService } from "./auth.service";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const oauthError = parseOAuthCallbackError();
      if (oauthError) {
        sessionStorage.setItem("safar:auth_error", oauthError);
        clearOAuthCallbackParams();
      }

      try {
        const session = await authService.getSession();
        if (!mounted) return;

        setSession(session);
        if (session?.user) {
          const profile = await authService.ensureUserProfile(session.user);
          if (mounted) setProfile(profile);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (session) => {
      setSession(session);
      if (session?.user) {
        const profile = await authService.ensureUserProfile(session.user);
        setProfile(profile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setLoading]);

  return <>{children}</>;
}
