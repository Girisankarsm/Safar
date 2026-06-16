import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/utils";
import type { PlannedRoute } from "@/types/database";
import { Navigation } from "lucide-react";

export function IntelligencePanel({
  route,
  starting,
  onStart,
  drawer = false,
}: {
  route: PlannedRoute;
  starting: boolean;
  onStart: () => void;
  drawer?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", drawer && "overflow-hidden")}>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {route.safety_breakdown?.length > 0 ? (
          <SafetyScoreBreakdown
            score={route.safety_score}
            breakdown={route.safety_breakdown}
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              Why {route.safety_score}?
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {route.safety_score}
              <span className="text-lg text-[var(--text-dim)]">/100</span>
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Score breakdown will appear after route analysis completes.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border-subtle)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          className="w-full gap-2 py-2.5 text-sm font-bold"
          onClick={onStart}
          disabled={starting}
        >
          <Navigation className="h-4 w-4" />
          {starting ? t("routes.starting") : t("routes.startTrip")}
        </Button>
      </div>
    </div>
  );
}
