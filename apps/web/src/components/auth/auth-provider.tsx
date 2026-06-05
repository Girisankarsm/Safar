"use client";

import { createClient } from "@/lib/supabase/client";
import { setAuthTokenProvider } from "@/lib/api";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    setAuthTokenProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    const syncProfile = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) return;
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/auth/sync`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
        });
      } catch {
        // API may be offline during local dev startup.
      }
    };

    syncProfile();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) syncProfile();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
