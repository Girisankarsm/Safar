"use client";

import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="app-shell-bg flex min-h-screen flex-col items-center justify-center p-6">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/15">
          <Shield className="h-5 w-5 text-[#3B82F6]" strokeWidth={2.5} />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight text-white">Safar</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#111111] p-8">
        <h1 className="text-2xl font-bold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Travel Smarter. Travel Safer. — India&apos;s community-powered mobility platform.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === "signup" && (
            <Input type="text" placeholder="Full name" />
          )}
          <ButtonLink href="/home" size="lg" className="w-full">
            {mode === "signin" ? "Continue" : "Get started"}
          </ButtonLink>
        </div>

        <p className="mt-6 text-center text-xs text-[#71717A]">
          {mode === "signin" ? "New to Safar?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-[#3B82F6] hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        <div className="mt-6 border-t border-[#262626] pt-6">
          <ButtonLink href="/home" variant="ghost" className="w-full !text-[#A1A1AA]">
            Enter demo without account
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
