import { ButtonLink } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
          <span className="text-xl font-bold">Safar</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="text-sm text-[#A1A1AA] hover:text-white">Sign in</Link>
          <ButtonLink to="/login" size="sm">Get started</ButtonLink>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-4 py-1.5 text-xs font-semibold text-[#3B82F6]">
          <Sparkles className="h-3.5 w-3.5" />
          Community-powered mobility
        </p>
        <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
          Travel Smarter.<br />
          <span className="text-[#3B82F6]">Travel Safer.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[#A1A1AA]">
          Safar helps Indian commuters choose safer, smarter routes — powered entirely by Supabase realtime community intelligence.
        </p>
        <ButtonLink to="/login" size="lg" className="btn-glow mt-10">
          Start planning routes <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </section>
    </div>
  );
}
