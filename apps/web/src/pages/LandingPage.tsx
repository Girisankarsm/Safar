import { ButtonLink } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-[#262626]/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 shrink-0 text-[#3B82F6]" />
            <span className="text-xl font-bold leading-none">Safar</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-9 items-center px-3 text-sm font-medium text-[#A1A1AA] transition hover:text-white"
            >
              Sign in
            </Link>
            <ButtonLink to="/login" size="sm">
              Get started
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-4 py-1.5 text-xs font-semibold text-[#3B82F6]">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Community-powered mobility
        </p>
        <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-7xl">
          Travel Smarter.
          <br />
          <span className="text-[#3B82F6]">Travel Safer.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#A1A1AA]">
          Safar helps Indian commuters choose safer, smarter routes — powered entirely by Supabase realtime community intelligence.
        </p>
        <div className="mt-10 flex w-full justify-center">
          <ButtonLink to="/login" size="lg" className="btn-glow">
            Start planning routes
            <ArrowRight className="h-4 w-4 shrink-0" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
