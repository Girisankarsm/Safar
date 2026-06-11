import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/supabase/auth.service";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "reset") {
        await authService.resetPassword(email);
        setMessage("Password reset link sent to your email.");
      } else if (mode === "signup") {
        await authService.signUp(email, password, name);
        setMessage("Check your email to confirm your account.");
      } else {
        await authService.signIn(email, password);
        navigate("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#111111] p-8">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
          <span className="text-xl font-bold text-white">Safar</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "reset" && (
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          )}
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          {message && <p className="text-sm text-[#22C55E]">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "reset" ? "Send reset link" : mode === "signup" ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#A1A1AA]">
          {mode !== "signin" && <button type="button" onClick={() => setMode("signin")} className="text-[#3B82F6]">Sign in</button>}
          {mode !== "signup" && <button type="button" onClick={() => setMode("signup")} className="text-[#3B82F6]">Sign up</button>}
          {mode !== "reset" && <button type="button" onClick={() => setMode("reset")} className="text-[#3B82F6]">Forgot password?</button>}
        </div>

        <p className="mt-6 text-center text-xs text-[#71717A]">
          <Link to="/" className="text-[#3B82F6]">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
