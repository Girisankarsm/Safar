"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) setError(authError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Google sign-in");
      setLoading(false);
    }
  }

  const authError = params.get("error");

  return (
    <div className="app-shell-bg flex min-h-screen flex-col items-center justify-center p-6">
      <p className="font-display text-4xl font-extrabold tracking-tight text-foreground">SafarAI</p>
      <p className="mt-3 max-w-sm text-center text-muted">
        Safer public transit for Indian commuters — sign in to plan routes and earn GreenMiles.
      </p>

      {(authError || error) && (
        <p className="mt-6 max-w-sm rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-center text-sm text-[#FCA5A5]">
          {error || "Sign-in failed. Check Supabase Google provider settings and try again."}
        </p>
      )}

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="mt-10 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-[#262626] bg-white px-6 py-3.5 text-sm font-bold text-[#111111] transition hover:bg-[#F4F4F5] disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>

      <p className="mt-6 max-w-xs text-center text-xs text-[#71717A]">
        Chennai · Hyderabad · Bangalore — routes, safety maps, and GreenMiles wallet.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 28.991 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
