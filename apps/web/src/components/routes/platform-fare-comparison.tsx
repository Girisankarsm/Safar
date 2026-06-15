import { SafetyLevelBadge } from "@/components/safety/safety-level-badge";
import { useI18n } from "@/i18n/use-i18n";
import {
  compareByVehicleCategory,
  quoteWithHighlights,
  VEHICLE_CATEGORIES,
  type VehicleCategory,
  type VehicleQuote,
} from "@/lib/platform-fares";
import type { PlannedRoute } from "@/types/database";
import { ArrowDownUp, Car, Clock, Database, ExternalLink, IndianRupee, Shield, Sparkles, Wifi } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey = "fare" | "safety" | "eta";

/**
 * Booking strategies per platform:
 *
 * WEB_URL   — platform has a public web booking page that accepts lat/lng params.
 *             Opens in a new browser tab with locations pre-filled.
 * MAPS      — platform has no public web booking; open Google Maps with the
 *             route so the user can tap "Open in [app]" from there.
 * APP_LINK  — mobile-only deep link. On desktop shows a copy-locations tooltip.
 */
type BookingStrategy = "web_url" | "maps" | "app_link";

const BOOKING_META: Record<
  string,
  { strategy: BookingStrategy; label: string; note?: string }
> = {
  uber:        { strategy: "web_url",  label: "Book on Uber" },
  ola:         { strategy: "web_url",  label: "Book on Ola" },
  rapido:      { strategy: "maps",     label: "Open in Maps", note: "Rapido has no web booking — opens Google Maps so you can launch Rapido from there" },
  namma_yatri: { strategy: "maps",     label: "Open in Maps", note: "Namma Yatri has no web booking — opens Google Maps; open the NammaYatri app separately" },
  local:       { strategy: "maps",     label: "Directions" },
};

function buildUrl(
  brandId: string,
  src: { lat: number; lng: number; name: string },
  dst: { lat: number; lng: number; name: string }
): string | null {
  const enc = encodeURIComponent;
  const meta = BOOKING_META[brandId];
  if (!meta) return null;

  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${src.lat},${src.lng}&destination=${dst.lat},${dst.lng}` +
    `&origin_place_id=${enc(src.name)}&travelmode=driving`;

  switch (brandId) {
    case "uber":
      return (
        `https://m.uber.com/ul/?action=setPickup` +
        `&pickup[latitude]=${src.lat}&pickup[longitude]=${src.lng}&pickup[nickname]=${enc(src.name)}` +
        `&dropoff[latitude]=${dst.lat}&dropoff[longitude]=${dst.lng}&dropoff[nickname]=${enc(dst.name)}`
      );
    case "ola":
      return (
        `https://book.olacabs.com/?lat=${src.lat}&lng=${src.lng}&pickup_name=${enc(src.name)}` +
        `&drop_lat=${dst.lat}&drop_lng=${dst.lng}&drop_name=${enc(dst.name)}`
      );
    case "rapido":
    case "namma_yatri":
    case "local":
      return mapsUrl;
    default:
      return null;
  }
}

function BookButton({
  brandId,
  src,
  dst,
}: {
  brandId: string;
  src: { lat: number; lng: number; name: string };
  dst: { lat: number; lng: number; name: string };
}) {
  const meta = BOOKING_META[brandId];
  const url = buildUrl(brandId, src, dst);
  if (!meta || !url) return null;

  const isWebBooking = meta.strategy === "web_url";

  return (
    <div className="flex flex-col gap-1">
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        title={meta.note ?? "Opens platform pre-filled with your route — real live fare shown there"}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 ${
          isWebBooking
            ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#93C5FD] hover:bg-[#3B82F6]/20"
            : "border-[#F59E0B]/30 bg-[#F59E0B]/8 text-[#FCD34D] hover:bg-[#F59E0B]/15"
        }`}
      >
        <ExternalLink className="h-3 w-3" />
        {meta.label}
      </a>
      {!isWebBooking && (
        <p className="text-[9px] leading-tight text-[#52525B]">
          {brandId === "rapido" ? "Then open Rapido app" : brandId === "namma_yatri" ? "Then open NammaYatri" : ""}
        </p>
      )}
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState<SortKey>("fare");
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>("auto");

  const categoryRows = useMemo(
    () =>
      compareByVehicleCategory(route, vehicleCategory, {
        departureHour,
        womenSafetyMode,
      }),
    [route, vehicleCategory, departureHour, womenSafetyMode]
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
              Est. fares
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-bold text-[#86EFAC]">
              <Wifi className="h-2.5 w-2.5" />
              Live safety
            </span>
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
                <th className="px-3 py-2 text-[#3B82F6]">Book</th>
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
                    >
                      <IndianRupee className="h-3.5 w-3.5" />
                      {vehicle.fareInr}
                    </span>
                    <span className="ml-1 text-[10px] text-[#52525B]">est.</span>
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
                  <td className="px-3 py-3">
                    <BookButton
                      brandId={brandId}
                      src={{ lat: route.source_lat, lng: route.source_lng, name: route.source_name }}
                      dst={{ lat: route.dest_lat, lng: route.dest_lng, name: route.destination_name }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-3">
        <span className="inline-flex items-center gap-1 text-[10px] text-[#52525B]">
          <Database className="h-2.5 w-2.5 text-[#F59E0B]" />
          Est. fare — typical city rate × distance ± surge
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#52525B]">
          <Wifi className="h-2.5 w-2.5 text-[#22C55E]" />
          Live safety — real OSM corridor + community reports from Supabase
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#52525B]">
          <ExternalLink className="h-2.5 w-2.5 text-[#3B82F6]" />
          Book Now (blue) — opens Uber/Ola web with route pre-filled; real live price shown
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] text-[#52525B]">
          <ExternalLink className="h-2.5 w-2.5 text-[#F59E0B]" />
          Open in Maps (amber) — Rapido/NammaYatri have no web booking; opens Google Maps → tap &quot;Open in app&quot;
        </span>
      </div>
      <p className="text-[10px] text-[#52525B]">{t("routes.platformDisclaimer")}</p>
    </section>
  );
}
