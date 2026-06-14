import { SafetyLevelBadge } from "@/components/safety/safety-level-badge";
import { useI18n } from "@/i18n/use-i18n";
import {
  comparePlatformBrands,
  quoteWithHighlights,
  type PlatformBrand,
  type RidePlatformId,
  type VehicleQuote,
} from "@/lib/platform-fares";
import type { PlannedRoute } from "@/types/database";
import { ArrowDownUp, Clock, IndianRupee, Shield, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SortKey = "fare" | "safety" | "eta";

type ActiveRow = {
  brand: PlatformBrand;
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
  const [sortBy, setSortBy] = useState<SortKey>("fare");
  const [vehicleByBrand, setVehicleByBrand] = useState<Record<string, RidePlatformId>>({});

  const brands = useMemo(
    () => comparePlatformBrands(route, { departureHour, womenSafetyMode }),
    [route, departureHour, womenSafetyMode]
  );

  useEffect(() => {
    setVehicleByBrand((prev) => {
      const next = { ...prev };
      for (const b of brands) {
        if (!next[b.id] || !b.vehicles.some((v) => v.id === next[b.id])) {
          next[b.id] = b.defaultVehicleId;
        }
      }
      return next;
    });
  }, [brands]);

  const activeRows = useMemo((): ActiveRow[] => {
    return brands.map((brand) => {
      const selectedId = vehicleByBrand[brand.id] ?? brand.defaultVehicleId;
      const vehicle =
        brand.vehicles.find((v) => v.id === selectedId) ?? brand.vehicles[0];
      return { brand, vehicle };
    });
  }, [brands, vehicleByBrand]);

  const allVehicles = useMemo(() => activeRows.map((r) => r.vehicle), [activeRows]);

  const displayRows = useMemo(() => {
    const withHighlights = activeRows.map((row) => ({
      ...row,
      quote: quoteWithHighlights(
        { ...row.vehicle, name: row.brand.name, brandColor: row.brand.brandColor },
        allVehicles
      ),
    }));
    return sortRows(
      withHighlights.map((r) => ({ brand: r.brand, vehicle: r.vehicle })),
      sortBy
    ).map((sorted) => withHighlights.find((r) => r.brand.id === sorted.brand.id)!);
  }, [activeRows, allVehicles, sortBy]);

  const cheapest = Math.min(...allVehicles.map((v) => v.fareInr));
  const safest = Math.max(...allVehicles.map((v) => v.safetyScore));

  return (
    <section className="surface-card space-y-4 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-bold text-white">{t("routes.platformCompare")}</h3>
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              <th className="px-3 py-2">{t("routes.platform")}</th>
              <th className="px-3 py-2">{t("compare.vehicle")}</th>
              <th className="px-3 py-2">{t("routes.fare")}</th>
              <th className="px-3 py-2">{t("routes.eta")}</th>
              <th className="px-3 py-2">{t("routes.safety")}</th>
              <th className="px-3 py-2">{t("routes.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map(({ brand, vehicle, quote }) => (
              <tr
                key={brand.id}
                className="border-b border-[var(--border-subtle)]/60 transition hover:bg-[#18181d]/60"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ backgroundColor: brand.brandColor }}
                    >
                      {brand.name.slice(0, 2).toUpperCase()}
                    </span>
                    <p className="font-semibold text-white">{brand.name}</p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {brand.vehicles.length > 1 ? (
                    <select
                      value={vehicle.id}
                      onChange={(e) =>
                        setVehicleByBrand((prev) => ({
                          ...prev,
                          [brand.id]: e.target.value as RidePlatformId,
                        }))
                      }
                      className="w-full min-w-[7rem] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#3B82F6]/50"
                      aria-label={t("compare.selectVehicle", { platform: brand.name })}
                    >
                      {brand.vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.mode} · ₹{v.fareInr}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-semibold text-[#A1A1AA]">{vehicle.mode}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      vehicle.fareInr === cheapest ? "text-[#FCD34D]" : "text-white"
                    }`}
                  >
                    <IndianRupee className="h-3.5 w-3.5" />
                    {vehicle.fareInr}
                  </span>
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
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`h-3.5 w-3.5 ${
                        vehicle.safetyScore === safest ? "text-[#22C55E]" : "text-[#71717A]"
                      }`}
                    />
                    <SafetyLevelBadge score={vehicle.safetyScore} size="sm" showBar={false} />
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

      <p className="text-[10px] text-[#52525B]">{t("routes.platformDisclaimer")}</p>
    </section>
  );
}
