import { SafetyLevelBadge } from "@/components/safety/safety-level-badge";
import { useI18n } from "@/i18n/use-i18n";
import {
  compareByVehicleCategory,
  getSurgeInfo,
  quoteWithHighlights,
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type VehicleQuote,
} from "@/lib/platform-fares";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute } from "@/types/database";
import { ArrowDownUp, Car, Clock, Database, IndianRupee, Shield, Sparkles, Wifi, Zap } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey = "fare" | "safety" | "eta";


type ActiveRow = {
  brandId: string;
  brandName: string;
  brandColor: string;
  vehicle: VehicleQuote;
};

function sortRows(rows: ActiveRow[], key: SortKey): ActiveRow[] {
  const sorted = [...rows];
  if (key === "fare") sorted.sort((a, b) => a.vehicle.fareInr - b.vehicle.fareInr);
  if (key === "safety") sorted.sort((a, b) => b.vehicle.safetyScore - a.vehicle.safetyScore);
  if (key === "eta") sorted.sort((a, b) => a.vehicle.etaMinutes - b.vehicle.etaMinutes);
  return sorted;
}

export function PlatformFareComparison({
  route,
  departureHour,
  womenSafetyMode,
}: {
  route: PlannedRoute;
  departureHour?: number;
  womenSafetyMode?: boolean;
}) {
  const { t } = useI18n();
  const { city } = useCityStore();
  const [sortBy, setSortBy] = useState<SortKey>("fare");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>("auto");

  const hour = departureHour ?? new Date().getHours();
  const surgeInfo = getSurgeInfo(hour);

  const categoryRows = useMemo(
    () =>
      compareByVehicleCategory(route, vehicleCategory, {
        departureHour: hour,
        womenSafetyMode,
        cityId: city,
      }),
    [route, vehicleCategory, hour, womenSafetyMode, city]
  );

  const activeRows = useMemo(
    (): ActiveRow[] =>
      categoryRows.map(({ brand, vehicle }) => ({
        brandId: brand.id,
        brandName: brand.name,
        brandColor: brand.brandColor,
        vehicle,
      })),
    [categoryRows]
  );

  const allVehicles = useMemo(() => activeRows.map((r) => r.vehicle), [activeRows]);

  const displayRows = useMemo(() => {
    const withHighlights = activeRows.map((row) => ({
      ...row,
      quote: quoteWithHighlights(
        {
          ...row.vehicle,
          name: row.brandName,
          brandColor: row.brandColor,
        },
        allVehicles
      ),
    }));
    return sortRows(
      withHighlights.map((r) => ({
        brandId: r.brandId,
        brandName: r.brandName,
        brandColor: r.brandColor,
        vehicle: r.vehicle,
      })),
      sortBy
    ).map((sorted) => withHighlights.find((r) => r.brandId === sorted.brandId)!);
  }, [activeRows, allVehicles, sortBy]);

  const cheapest = allVehicles.length
    ? Math.min(...allVehicles.map((v) => v.fareInr))
    : 0;
  const safest = allVehicles.length
    ? Math.max(...allVehicles.map((v) => v.safetyScore))
    : 0;

  return (
    <section className="surface-card space-y-4 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-bold text-white">{t("routes.platformCompare")}</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] font-bold text-[#FCD34D]">
              <Database className="h-2.5 w-2.5" />
              City rates
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-bold text-[#86EFAC]">
              <Wifi className="h-2.5 w-2.5" />
              Live safety
            </span>
            {surgeInfo.multiplier > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-bold text-[#FCA5A5]">
                <Zap className="h-2.5 w-2.5" />
                {surgeInfo.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#A1A1AA]">{t("routes.platformCompareDesc")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] p-1 text-xs">
          <ArrowDownUp className="ml-2 h-3.5 w-3.5 text-[#71717A]" />
          {(["fare", "safety", "eta"] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                sortBy === key
                  ? "bg-[#3B82F6]/20 text-[#93C5FD]"
                  : "text-[#71717A] hover:text-white"
              }`}
            >
              {t(`routes.sort.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-[#A1A1AA]">
          <Car className="h-3.5 w-3.5" />
          {t("compare.selectVehicleType")}
        </p>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setVehicleCategory(cat)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                vehicleCategory === cat
                  ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-white"
                  : "border-[var(--border-subtle)] text-[#A1A1AA] hover:border-[#3B82F6]/30 hover:text-white"
              }`}
            >
              {t(`compare.vehicleType.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {activeRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-8 text-center text-sm text-[#71717A]">
          {t("compare.noVehicleForCategory")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                <th className="px-3 py-2">{t("routes.platform")}</th>
                <th className="px-3 py-2">{t("routes.fare")}</th>
                <th className="px-3 py-2">{t("routes.eta")}</th>
                <th className="px-3 py-2">{t("routes.safety")}</th>
                <th className="px-3 py-2">{t("routes.notes")}</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map(({ brandName, brandColor, brandId, vehicle, quote }) => (
                <tr
                  key={brandId}
                  className="border-b border-[var(--border-subtle)]/60 transition hover:bg-[#18181d]/60"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        {brandName.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{brandName}</p>
                        <p className="text-xs text-[#71717A]">{vehicle.mode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        vehicle.fareInr === cheapest ? "text-[#FCD34D]" : "text-white"
                      }`}
                      title={[
                        `Base: ₹${vehicle.fareBreakdown.base}`,
                        `Distance: ₹${vehicle.fareBreakdown.distance}`,
                        vehicle.fareBreakdown.toll > 0 ? `Toll: ₹${vehicle.fareBreakdown.toll}` : null,
                        vehicle.fareBreakdown.surgeMultiplier > 1 ? `Surge: ${vehicle.fareBreakdown.surgeLabel}` : null,
                      ].filter(Boolean).join(" · ")}
                    >
                      <IndianRupee className="h-3.5 w-3.5" />
                      {vehicle.fareInr}
                    </span>
                    <span className="ml-1 text-[10px] text-[#52525B]">est.</span>
                    {vehicle.fareBreakdown.toll > 0 && (
                      <span className="ml-1 text-[10px] text-[#F59E0B]">+₹{vehicle.fareBreakdown.toll} toll</span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {quote.highlights.includes("cheapest") && (
                        <span className="rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold text-[#FCD34D]">
                          {t("routes.cheapestTag")}
                        </span>
                      )}
                      {quote.highlights.includes("fastest") && (
                        <span className="rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-bold text-[#93C5FD]">
                          {t("routes.fastestTag")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#A1A1AA]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {vehicle.etaMinutes} {t("common.min")}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Shield
                        className={`h-3.5 w-3.5 ${
                          vehicle.safetyScore === safest ? "text-[#22C55E]" : "text-[#71717A]"
                        }`}
                      />
                      <SafetyLevelBadge score={vehicle.safetyScore} size="sm" showBar={false} />
                      <span className="text-[10px] text-[#52525B]">
                        {brandId === "safar" ? "live" : "est."}
                      </span>
                      {quote.highlights.includes("safest") && (
                        <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-bold text-[#86EFAC]">
                          {t("routes.safestTag")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[#71717A]">{vehicle.safetyNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2.5 space-y-1">
        <p className="text-[10px] font-bold text-[#FCD34D]">About these fares</p>
        <p className="text-[10px] leading-relaxed text-[#A1A1AA]">
          Fares are <span className="font-semibold text-[#FCD34D]">estimates</span> using
          city-specific published tariffs (base + per-km) × time-of-day surge ± tolls for routes over 14 km.
          Uber/Ola/Rapido do not expose a public pricing API — no third-party app can show their exact live fare.
          Actual price may differ by 5–20% depending on real-time demand. Open the respective app to confirm before booking.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#71717A]">
            <Database className="h-2.5 w-2.5 text-[#F59E0B]" />
            Est. fare — base rate × distance ± surge
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#71717A]">
            <Wifi className="h-2.5 w-2.5 text-[#22C55E]" />
            Live safety — real OSM + community reports
          </span>
        </div>
      </div>
    </section>
  );
}
