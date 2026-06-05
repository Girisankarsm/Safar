"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "individual", label: "Individuals" },
  { id: "college", label: "Colleges" },
  { id: "company", label: "Companies" },
] as const;

export default function LeaderboardPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("individual");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(tab)
      .then((r) => setEntries(r.entries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <PageContainer>
      <PageHeader
        title="Green Commute Leaderboard"
        description="Top performers ranked by carbon saved and tokens earned"
      />

      <div className="flex gap-2 rounded-xl border border-border bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading rankings..." />
      ) : (
      <div className="space-y-3">
        {entries.map((e) => (
          <Card
            key={e.rank}
            className={cn(
              "flex items-center gap-4",
              e.rank === 1 && "border-yellow-200 bg-yellow-50/30",
              e.rank === 2 && "border-slate-200 bg-slate-50/50",
              e.rank === 3 && "border-amber-100 bg-amber-50/30"
            )}
          >
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold",
              e.rank === 1 ? "bg-yellow-100 text-yellow-700" :
              e.rank === 2 ? "bg-slate-200 text-slate-600" :
              e.rank === 3 ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-muted"
            )}>
              {e.rank <= 3 ? <Trophy className="h-5 w-5" /> : <span className="text-sm">#{e.rank}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{e.entity_name}</p>
              <p className="text-xs text-muted">
                {e.green_trips} green trips · {e.carbon_saved_kg} kg CO₂ saved
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-accent">{e.tokens_earned}</p>
              <p className="text-label">tokens</p>
            </div>
          </Card>
        ))}
      </div>
      )}

      {tab === "individual" && !loading && (
        <Card className="flex items-center gap-3 border-primary/20 bg-primary-light/30">
          <Medal className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold text-primary">You&apos;re ranked #1 at Anna University Chennai</p>
            <p className="text-xs text-muted">Keep commuting green to maintain your lead!</p>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
