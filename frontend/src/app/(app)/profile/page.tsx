"use client";

import { useEffect, useState } from "react";
import { Shield, Leaf, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";

export default function ProfilePage() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    college?: string;
    trust_score: number;
    women_safety_mode: boolean;
    wallet?: { balance: number; lifetime_co2_kg: number; green_trips_count: number };
  } | null>(null);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
  }, []);

  if (!user) return <p className="text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user.name.charAt(0)}
        </div>
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
        {user.college && <p className="mt-1 text-sm">{user.college}</p>}
        <div className="mt-4 flex justify-center gap-2">
          <Badge variant="safe">Trust Score: {user.trust_score}</Badge>
          {user.women_safety_mode && <Badge>Women Safety ON</Badge>}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-xl font-bold">{user.wallet?.balance ?? 0}</p>
          <p className="text-xs text-muted">Tokens</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-bold">{user.wallet?.lifetime_co2_kg ?? 0}</p>
          <p className="text-xs text-muted">kg CO₂</p>
        </Card>
        <Card className="text-center">
          <p className="text-xl font-bold">{user.wallet?.green_trips_count ?? 0}</p>
          <p className="text-xs text-muted">Trips</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Award className="h-5 w-5 text-primary" /> Achievements</h2>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2"><Shield className="h-4 w-4 text-pink-500" /> Safety Champion — 5 verified reports</p>
          <p className="flex items-center gap-2"><Leaf className="h-4 w-4 text-accent" /> Green Commuter — 28 sustainable trips</p>
        </div>
      </Card>
    </div>
  );
}
