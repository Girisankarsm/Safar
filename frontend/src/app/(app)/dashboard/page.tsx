"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Coins, Route, ArrowRight, MapPin, Navigation, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Section } from "@/components/layout/section";
import { InsightBanner } from "@/components/layout/insight-banner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";
import { quickPlaces } from "@/config/site";

export default function DashboardPage() {
  const router = useRouter();
  const { source, destination, setSource, setDestination, womenSafetyMode } = useAppStore();
  const [user, setUser] = useState<import("@/lib/types").User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getMe().then(setUser).catch(() =>
      setUser({
        id: "demo",
        name: "Priya Sharma",
        email: "priya@cbit.ac.in",
        college: "CBIT Hyderabad",
        women_safety_mode: true,
        night_safe_preference: true,
        trust_score: 85,
        wallet: { balance: 340, lifetime_tokens: 520, lifetime_co2_kg: 12.4, green_trips_count: 28 },
      })
    );
  }, []);

  async function handleSearch() {
    setLoading(true);
    try {
      const { routes } = await api.searchRoutes({ source, destination, women_safety_mode: womenSafetyMode });
      useAppStore.getState().setRoutes(routes);
      router.push("/routes");
    } catch {
      router.push("/plan");
    } finally {
      setLoading(false);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? "Commuter"}`}
        description="Plan your next safe, sustainable journey across Hyderabad"
        badge={
          womenSafetyMode ? (
            <Badge className="border-pink-200 bg-pink-50 text-pink-700">
              <Shield className="mr-1 h-3 w-3" /> Women Safety Mode Active
            </Badge>
          ) : undefined
        }
        action={
          <Link href="/plan">
            <Button variant="secondary" size="sm">Advanced Planner</Button>
          </Link>
        }
      />

      {/* Trip planner */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-slate-50 px-6 py-4">
          <p className="text-label">Journey Planner</p>
          <p className="font-semibold">Where are you heading today?</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-accent" />
            <Input
              className="pl-10"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Pickup location"
            />
          </div>
          <div className="relative">
            <Navigation className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
            <Input
              className="pl-10"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Drop-off location"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {quickPlaces.map((place) => (
              <button
                key={place}
                onClick={() => setDestination(place)}
                className="rounded-lg border border-border bg-white px-3 py-1 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
              >
                {place}
              </button>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={handleSearch} disabled={loading}>
            {loading ? "Analyzing routes..." : "Compare Routes"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Section title="Your Impact" description="Lifetime commuting statistics">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Green Tokens" value={user?.wallet?.balance ?? 340} icon={Coins} variant="primary" trend="Redeem for ride discounts" />
          <StatCard label="CO₂ Saved" value={user?.wallet?.lifetime_co2_kg ?? 12.4} unit="kg" icon={Leaf} variant="accent" trend="Equivalent to 3 trees planted" />
          <StatCard label="Green Trips" value={user?.wallet?.green_trips_count ?? 28} icon={Route} trend={`Trust score: ${user?.trust_score ?? 85}/100`} />
        </div>
      </Section>

      <InsightBanner message="Taking Metro today saves 1.8 kg CO₂ compared to driving. Earn up to 58 Green Tokens on your next trip." />

      {/* Quick actions */}
      <Section title="Quick Actions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/safety-map", label: "Safety Map", desc: "Community reports" },
            { href: "/wallet", label: "Green Wallet", desc: "Tokens & rewards" },
            { href: "/leaderboard", label: "Leaderboard", desc: "College rankings" },
            { href: "/report", label: "Report Issue", desc: "Help the community" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="surface group p-4 transition hover:border-primary/30 hover:shadow-md">
                <p className="font-semibold group-hover:text-primary">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
