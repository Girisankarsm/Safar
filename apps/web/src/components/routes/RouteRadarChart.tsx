import { useMemo } from "react";
import { motion } from "framer-motion";
import type { PlannedRoute } from "@/types/database";

/* ── Radar dimensions ── */
const SIZE    = 200;
const CENTER  = SIZE / 2;
const RADIUS  = 80;
const AXES    = ["Safety", "Speed", "Cost", "Infra", "Confidence"] as const;
const N       = AXES.length;

/* ── Per route-type palette ── */
const PALETTE: Record<string, { stroke: string; fill: string; label: string }> = {
  balanced:       { stroke: "#3B82F6", fill: "rgba(59,130,246,0.15)", label: "Balanced" },
  safest:         { stroke: "#22C55E", fill: "rgba(34,197,94,0.15)",  label: "Safest" },
  cheapest:       { stroke: "#F59E0B", fill: "rgba(245,158,11,0.15)", label: "Cheapest" },
  women_friendly: { stroke: "#EC4899", fill: "rgba(236,72,153,0.15)", label: "Women-Friendly" },
};

/* ── Helpers ── */
function polar(angle: number, r: number): [number, number] {
  return [
    CENTER + r * Math.sin(angle),
    CENTER - r * Math.cos(angle),
  ];
}

function routeToValues(r: PlannedRoute, allRoutes: PlannedRoute[]): number[] {
  const maxEta  = Math.max(...allRoutes.map((x) => x.eta_minutes));
  const minEta  = Math.min(...allRoutes.map((x) => x.eta_minutes));
  const maxCost = Math.max(...allRoutes.map((x) => x.estimated_cost_inr));
  const minCost = Math.min(...allRoutes.map((x) => x.estimated_cost_inr));

  const safety = (r.safety_score ?? 0) / 100;

  const speedRaw = maxEta === minEta ? 1 : 1 - (r.eta_minutes - minEta) / (maxEta - minEta);
  const speed    = Math.max(0.1, speedRaw);

  const costRaw  = maxCost === minCost ? 1 : 1 - (r.estimated_cost_inr - minCost) / (maxCost - minCost);
  const cost     = Math.max(0.1, costRaw);

  const police   = (r.corridor_profile?.policeCount ?? 0);
  const hospital = (r.corridor_profile?.hospitalCount ?? 0);
  const infra    = Math.min(1, (police * 0.15 + hospital * 0.25) / 2 + 0.2);

  const confPct  = r.confidence?.pct ?? r.corridor_profile?.confidenceScore ?? 70;
  const conf     = confPct / 100;

  return [safety, speed, cost, infra, conf];
}

function toPath(vals: number[]): string {
  const pts = vals.map((v, i) => {
    const angle = (2 * Math.PI * i) / N;
    return polar(angle, v * RADIUS);
  });
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z";
}

/* ── Web grid rings ── */
const RINGS = [0.25, 0.5, 0.75, 1.0];

/* ── Component ── */
interface Props {
  routes: PlannedRoute[];
  selected?: PlannedRoute | null;
}

export function RouteRadarChart({ routes, selected }: Props) {
  const data = useMemo(
    () =>
      routes.map((r) => ({
        route: r,
        vals:  routeToValues(r, routes),
        pal:   PALETTE[r.route_type] ?? PALETTE.balanced,
      })),
    [routes]
  );

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
        Route Comparison
      </p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* SVG radar */}
        <div className="shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Grid rings */}
            {RINGS.map((r) => (
              <polygon
                key={r}
                points={Array.from({ length: N }, (_, i) => {
                  const angle = (2 * Math.PI * i) / N;
                  const [x, y] = polar(angle, r * RADIUS);
                  return `${x.toFixed(2)},${y.toFixed(2)}`;
                }).join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            ))}

            {/* Axis lines */}
            {Array.from({ length: N }, (_, i) => {
              const angle = (2 * Math.PI * i) / N;
              const [x, y] = polar(angle, RADIUS);
              return (
                <line
                  key={i}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x.toFixed(2)}
                  y2={y.toFixed(2)}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis labels */}
            {AXES.map((label, i) => {
              const angle = (2 * Math.PI * i) / N;
              const [x, y] = polar(angle, RADIUS + 16);
              return (
                <text
                  key={label}
                  x={x.toFixed(2)}
                  y={y.toFixed(2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.45)"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="system-ui"
                >
                  {label}
                </text>
              );
            })}

            {/* Data polygons (non-selected first, then selected on top) */}
            {[...data]
              .sort((a) => (a.route === selected ? 1 : -1))
              .map(({ route, vals, pal }) => {
                const isSelected = route === selected;
                return (
                  <motion.path
                    key={route.route_type}
                    d={toPath(vals)}
                    fill={pal.fill}
                    stroke={pal.stroke}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 1 : 0.55}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: isSelected ? 1 : 0.55, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                  />
                );
              })}

            {/* Center dot */}
            <circle cx={CENTER} cy={CENTER} r={2} fill="rgba(255,255,255,0.2)" />
          </svg>
        </div>

        {/* Legend + per-route axis values */}
        <div className="flex-1 space-y-2 text-[11px]">
          {data.map(({ route, vals, pal }) => {
            const isSelected = route === selected;
            return (
              <div
                key={route.route_type}
                className="rounded-lg border px-3 py-2 transition-all"
                style={{
                  borderColor: isSelected ? pal.stroke : "var(--border-subtle)",
                  backgroundColor: isSelected ? `${pal.stroke}10` : "transparent",
                }}
              >
                {/* Route name */}
                <div className="mb-1.5 flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: pal.stroke }}
                  />
                  <span className="font-semibold" style={{ color: pal.stroke }}>
                    {pal.label}
                  </span>
                  {isSelected && (
                    <span className="ml-auto rounded bg-white/5 px-1 py-0.5 text-[9px] text-[var(--text-dim)]">
                      Selected
                    </span>
                  )}
                </div>

                {/* Axis bars */}
                <div className="space-y-1">
                  {AXES.map((axis, i) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="w-14 shrink-0 text-[9px] text-[var(--text-dim)]">{axis}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 4 }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: pal.stroke }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(vals[i] * 100)}%` }}
                          transition={{ delay: i * 0.08, duration: 0.5 }}
                        />
                      </div>
                      <span className="w-7 text-right text-[9px] tabular-nums text-[var(--text-dim)]">
                        {Math.round(vals[i] * 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
