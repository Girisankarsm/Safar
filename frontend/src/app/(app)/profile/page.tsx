"use client";

import { useEffect, useState } from "react";
import { Shield, Leaf, Award, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
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

  if (!user) return <LoadingSpinner label="Loading profile..." />;

  return (
    <PageContainer narrow>
      <PageHeader
        title="Your Profile"
        description="Track your safety contributions and green impact"
        action={
          <ButtonLink href="/settings" variant="secondary" size="sm">
            <Settings className="h-4 w-4" /> Settings
          </ButtonLink>
        }
      />

      <Card className="text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full gradient-primary text-3xl font-bold text-white shadow-lg">
          {user.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-sm text-muted">{user.email}</p>
        {user.college && <p className="mt-1 text-sm font-medium">{user.college}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="safe">Trust Score: {user.trust_score}</Badge>
          {user.women_safety_mode && (
            <Badge className="border-pink-200 bg-pink-50 text-pink-700">Women Safety ON</Badge>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tokens", value: user.wallet?.balance ?? 0 },
          { label: "kg CO₂", value: user.wallet?.lifetime_co2_kg ?? 0 },
          { label: "Green Trips", value: user.wallet?.green_trips_count ?? 0 },
        ].map((stat) => (
          <Card key={stat.label} className="text-center py-4">
            <p className="text-2xl font-bold text-primary">{stat.value}</p>
            <p className="text-label mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Award className="h-5 w-5 text-primary" /> Achievements
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-pink-50 px-4 py-3">
            <Shield className="h-5 w-5 text-pink-600" />
            <div>
              <p className="text-sm font-semibold">Safety Champion</p>
              <p className="text-xs text-muted">5 verified community reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-accent-light px-4 py-3">
            <Leaf className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold">Green Commuter</p>
              <p className="text-xs text-muted">28 sustainable trips completed</p>
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
