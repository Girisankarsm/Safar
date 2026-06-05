"use client";

import { ButtonLink } from "@/components/ui/button";
import { api, type User } from "@/lib/api";
import { Shield, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => null);
  }, []);

  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-semibold text-[#3B82F6]">Account</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Profile</h1>

      <div className="mt-8 rounded-2xl border border-[#262626] bg-[#111111] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B82F6]/15">
            <UserIcon className="h-7 w-7 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user?.name ?? "Ananya Krishnan"}</p>
            <p className="text-sm text-[#A1A1AA]">{user?.email ?? "demo@safarai.app"}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="City" value={user?.city ?? "Chennai"} />
          <Row label="Women safety mode" value={user?.women_safety_mode ? "On" : "Off"} />
          <Row label="Night-safe preference" value={user?.night_safe_preference ? "On" : "Off"} />
          <Row label="Trust score" value={String(user?.trust_score ?? 92)} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-4 text-sm text-[#A1A1AA]">
        <Shield className="h-5 w-5 shrink-0 text-[#22C55E]" />
        Demo profile for hackathon judges — real auth coming soon.
      </div>

      <ButtonLink href="/home" variant="secondary" className="mt-8 w-full" size="lg">
        Back to Home
      </ButtonLink>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[#262626] py-2 last:border-0">
      <span className="text-[#A1A1AA]">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
