import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton, useAuth } from "@/features/auth";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, resetPassword, getAuthErrorMessage, isAuthenticated, loading } =
    useAuth();

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/home";

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const storedError = sessionStorage.getItem("safar:auth_error");
    if (storedError) {
      setError(storedError);
      sessionStorage.removeItem("safar:auth_error");
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [loading, isAuthenticated, navigate, from]);

  async function handleGoogleSignIn() {
    setError("");
    setMessage("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setMessage("Password reset link sent to your email.");
      } else if (mode === "signup") {
        await signUp(email, password, name);
        setMessage("Check your email to confirm your account.");
      } else {
        await signIn(email, password);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#111111] p-8">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
          <span className="text-xl font-bold text-white">Safar</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          {mode === "signin"
            ? "Sign in to plan safer routes and access your dashboard."
            : mode === "signup"
              ? "Join Safar to contribute to community safety."
              : "We'll email you a link to reset your password."}
        </p>

        {mode !== "reset" && (
          <div className="mt-6">
            <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} disabled={submitting} />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#262626]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-[#111111] px-3 text-[#71717A]">or continue with email</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "reset" && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          )}
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          {message && <p className="text-sm text-[#22C55E]">{message}</p>}
          <Button type="submit" className="w-full" disabled={submitting || googleLoading}>
            {submitting ? "Please wait…" : mode === "reset" ? "Send reset link" : mode === "signup" ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#A1A1AA]">
          {mode !== "signin" && (
            <button type="button" onClick={() => setMode("signin")} className="text-[#3B82F6]">
              Sign in
            </button>
          )}
          {mode !== "signup" && (
            <button type="button" onClick={() => setMode("signup")} className="text-[#3B82F6]">
              Sign up
            </button>
          )}
          {mode !== "reset" && (
            <button type="button" onClick={() => setMode("reset")} className="text-[#3B82F6]">
              Forgot password?
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#71717A]">
          <Link to="/" className="text-[#3B82F6]">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
