"use client";

import { ArrowRight, Shield, Leaf, Map } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden flex-1 flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <Logo size="md" showTagline className="[&_span]:text-white [&_span.text-primary]:text-blue-400" />
        <div>
          <h2 className="text-display mb-4 text-3xl font-bold leading-tight">
            Your daily commute,<br />reimagined for India.
          </h2>
          <p className="max-w-sm text-slate-400 leading-relaxed">
            AI-powered route comparison with safety scoring, women&apos;s safety features, and green mobility rewards.
          </p>
          <div className="mt-8 space-y-4">
            {[
              { icon: Shield, text: "Safety scores on every route" },
              { icon: Map, text: "Metro + Bus + Train planning" },
              { icon: Leaf, text: "Earn Green Tokens per trip" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">{siteConfig.hackathon}</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" showTagline />
          </div>

          <div className="surface-elevated p-8">
            <h1 className="text-display mb-1 text-2xl font-bold">Welcome back</h1>
            <p className="mb-8 text-sm text-muted">
              Sign in to access your safe mobility dashboard
            </p>

            <ButtonLink href="/dashboard" className="w-full" size="lg">
              Continue as Demo User
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>

            <div className="mt-6 rounded-xl border border-border bg-slate-50 p-4">
              <p className="text-label mb-2">Demo Account</p>
              <p className="text-sm font-semibold">Ananya Krishnan</p>
              <p className="text-xs text-muted">Anna University Chennai · Women Safety Mode ON</p>
            </div>

            <p className="mt-6 text-center text-xs text-muted">
              Clerk authentication ready · Production SSO compatible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
