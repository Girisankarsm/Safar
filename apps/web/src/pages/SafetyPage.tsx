import { SafetyHeatmap } from "@/components/map/SafetyHeatmap";
import type { MapLayers, TimeFilter } from "@/components/safety/safety-map-controls";
import { SafetyMapLegend } from "@/components/safety/safety-map-legend";
import { SafetyReportCard } from "@/components/safety/safety-report-card";
import { SafetyReportComments } from "@/components/safety/safety-report-comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce-callback";
import { useI18n } from "@/i18n/use-i18n";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { IS_DEMO_MODE } from "@/lib/config";
import { offlineCache } from "@/lib/offline-cache";
import { demoCommentCount, demoComments, demoReports } from "@/lib/demo-hackathon";
import { heatmapService, type HeatmapPoint } from "@/services/supabase/heatmap.service";
import { reportsService } from "@/services/supabase/reports.service";
import { storageService } from "@/services/supabase/storage.service";
import { useCityStore } from "@/stores/city.store";
import type { CommunityComment, ReportType, SafetyReport } from "@/types/database";
import { FALLBACK_CRIME_SCORES } from "@/lib/crime-data";
import { ChevronDown, Crosshair, Filter, MapPin, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: "harassment", label: "Harassment" },
  { id: "poor_lighting", label: "Poor lighting" },
  { id: "broken_light", label: "Broken light" },
  { id: "unsafe_bus_stop", label: "Unsafe bus stop" },
  { id: "dangerous_crossing", label: "Dangerous crossing" },
  { id: "suspicious_activity", label: "Suspicious activity" },
  { id: "unsafe_area", label: "Unsafe area" },
  { id: "flooded_area", label: "Flooded area" },
  { id: "road_damage", label: "Road damage" },
  { id: "stray_animal", label: "Stray animal" },
  { id: "construction", label: "Construction" },
];

const CATEGORY_OPTIONS = [
  { id: "all" as const, label: "All Categories" },
  ...REPORT_TYPES,
];

function filterByTime(reports: SafetyReport[], time: TimeFilter) {
  if (time === "all") return reports;
  const now = Date.now();
  const ms =
    time === "24h" ? 86_400_000 : time === "7d" ? 7 * 86_400_000 : 30 * 86_400_000;
  return reports.filter((r) => now - new Date(r.created_at).getTime() <= ms);
}

export function SafetyPage() {
  const { t } = useI18n();
  const { city } = useCityStore();
  const { user, profile } = useAuth();
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [center, setCenter] = useState(() => {
    const c = getCityConfig(city);
    return { lat: c.center_lat, lng: c.center_lng, name: c.name };
  });
  const [showForm, setShowForm] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [type, setType] = useState<ReportType>("poor_lighting");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [layers, setLayers] = useState<MapLayers>({
    heatmap: false,
    reports: true,
    safeZones: false,
    wellLit: false,
    womenSafe: false,
  });
  const [categoryFilter, setCategoryFilter] = useState<ReportType | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [commentReport, setCommentReport] = useState<SafetyReport | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [demoExtraComments, setDemoExtraComments] = useState<Record<string, CommunityComment[]>>({});

  const heatmapLayers = useMemo(
    () => ({
      heatmap: layers.heatmap,
      reports: layers.reports,
      safeZones: layers.safeZones,
      userLocation: true,
    }),
    [layers.heatmap, layers.reports, layers.safeZones]
  );

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const [heat, r] = await Promise.all([
        heatmapService.getHeatmapPoints(city),
        IS_DEMO_MODE
          ? Promise.resolve(demoReports(city))
          : reportsService.listByCity(city).catch(() => []),
      ]);
      setHeatPoints(heat);
      setReports(r);
      if (!IS_DEMO_MODE && r.length) {
        offlineCache.saveSafetySnapshot(city, r);
        const counts = await reportsService.countCommentsBatch(r.map((report) => report.id));
        setCommentCounts(counts);
      }
      const c = getCityConfig(city);
      setCenter({ lat: c.center_lat, lng: c.center_lng, name: c.name });
    } catch (err) {
      const cached = offlineCache.getSafetySnapshot(city);
      if (cached?.length) {
        setReports(cached);
        setLoadError("Offline — showing cached safety reports");
      } else {
        setLoadError(err instanceof Error ? err.message : "Could not load safety data");
      }
    }
  }, [city]);

  const debouncedLoadRef = useRef<ReturnType<typeof debounce<() => void>> | null>(null);
  useEffect(() => {
    debouncedLoadRef.current = debounce(() => void load(), 900);
    return () => debouncedLoadRef.current?.cancel();
  }, [load]);

  useEffect(() => {
    const c = getCityConfig(city);
    setCenter({ lat: c.center_lat, lng: c.center_lng, name: c.name });
    setPinCoords(null);
    setShowForm(false);
    setShowAllReports(false);
    load();
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      undefined,
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 8_000 }
    );

    if (IS_DEMO_MODE) return;

    const channel = reportsService.subscribe(city, () => {
      debouncedLoadRef.current?.();
    });
    return () => {
      debouncedLoadRef.current?.cancel();
      void channel.unsubscribe();
    };
  }, [city, load]);

  const filteredReports = useMemo(() => {
    let list = [...reports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    list = filterByTime(list, timeFilter);
    if (categoryFilter !== "all") {
      list = list.filter((r) => r.report_type === categoryFilter);
    }
    if (layers.wellLit) {
      list = list.filter((r) => r.report_type === "poor_lighting" || r.report_type === "broken_light");
    }
    if (layers.womenSafe) {
      list = list.filter((r) =>
        ["harassment", "unsafe_area", "unsafe_bus_stop", "suspicious_activity"].includes(r.report_type)
      );
    }
    return list;
  }, [reports, timeFilter, categoryFilter, layers.wellLit, layers.womenSafe]);

  const visibleReports = showAllReports ? filteredReports : filteredReports.slice(0, 12);

  function getCommentCount(reportId: string) {
    if (IS_DEMO_MODE) {
      return demoCommentCount(reportId) + (demoExtraComments[reportId]?.length ?? 0);
    }
    return commentCounts[reportId] ?? 0;
  }

  const loadComments = useCallback(
    async (reportId: string) => {
      if (IS_DEMO_MODE) {
        return [...demoComments(reportId), ...(demoExtraComments[reportId] ?? [])];
      }
      return reportsService.listComments(reportId);
    },
    [demoExtraComments]
  );

  const addComment = useCallback(
    async (reportId: string, body: string) => {
      if (IS_DEMO_MODE) {
        const comment: CommunityComment = {
          id: `demo-local-${reportId}-${Date.now()}`,
          report_id: reportId,
          user_id: user?.id ?? "demo-user",
          body,
          created_at: new Date().toISOString(),
          author_name: profile?.full_name ?? "You",
        };
        setDemoExtraComments((prev) => ({
          ...prev,
          [reportId]: [...(prev[reportId] ?? []), comment],
        }));
        return;
      }
      await reportsService.addComment(reportId, body);
      const count = await reportsService.countComments(reportId);
      setCommentCounts((prev) => ({ ...prev, [reportId]: count }));
    },
    [profile]
  );

  function handleMapClick(lat: number, lng: number) {
    setShowForm(true);
    setPinCoords({ lat, lng });
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const lat = pinCoords?.lat ?? userCoords?.lat ?? center.lat;
      const lng = pinCoords?.lng ?? userCoords?.lng ?? center.lng;
      let image_url: string | undefined;
      if (file) image_url = await storageService.uploadReportImage(file);
      await reportsService.create({
        city_id: city,
        report_type: type,
        description: desc,
        latitude: lat,
        longitude: lng,
        image_url,
      });
      setShowForm(false);
      setDesc("");
      setFile(null);
      setPinCoords(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReport(reportId: string) {
    if (!window.confirm("Delete this report? It will be removed from the heatmap for everyone.")) return;
    setDeletingId(reportId);
    setError("");
    try {
      await reportsService.remove(reportId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete report");
    } finally {
      setDeletingId(null);
    }
  }

  // Derived stats for the top row
  const totalReports = reports.length;
  const highRiskCount = reports.filter((r) =>
    ["harassment", "unsafe_area", "unsafe_bus_stop", "suspicious_activity"].includes(r.report_type)
  ).length;
  const verifiedCount = reports.filter((r) => r.verifications > 0 || r.is_verified).length;
  const recentCount = reports.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() <= 7 * 86_400_000
  ).length;
  const cityNCRB = FALLBACK_CRIME_SCORES[city as keyof typeof FALLBACK_CRIME_SCORES];

  return (
    <div className="flex h-[calc(100vh-var(--shell-top))] flex-col overflow-hidden">

      {/* ── Stats row ── */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          {/* Page title (compact) */}
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              {t("safety.eyebrow")}
            </p>
            <h1 className="text-[13px] font-bold text-white">{t("safety.title")}</h1>
          </div>

          {/* Stat cards */}
          <div className="flex flex-1 gap-2 overflow-x-auto lg:justify-end">
            {[
              {
                label: "Total Reports",
                value: totalReports,
                color: "#3B82F6",
                icon: "📍",
              },
              {
                label: "High Risk",
                value: highRiskCount,
                color: "#EF4444",
                icon: "⚠️",
              },
              {
                label: "Verified",
                value: verifiedCount,
                color: "#22C55E",
                icon: "✓",
              },
              {
                label: "This Week",
                value: recentCount,
                color: "#F59E0B",
                icon: "🕐",
              },
              ...(cityNCRB
                ? [
                    {
                      label: "NCRB Index",
                      value: cityNCRB.crime_index,
                      color: cityNCRB.crime_index >= 70 ? "#22C55E" : "#F59E0B",
                      icon: "📊",
                    },
                  ]
                : []),
            ].map(({ label, value, color, icon }) => (
              <div
                key={label}
                className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 transition-colors hover:border-[#3B82F6]/25"
              >
                <span className="text-base leading-none">{icon}</span>
                <div>
                  <p className="text-sm font-bold tabular-nums text-white" style={{ color }}>
                    {value}
                  </p>
                  <p className="text-[9px] font-medium text-[var(--text-dim)]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Report button */}
          <Button
            onClick={() => setShowForm(true)}
            className="shrink-0 gap-2 px-4 py-2 text-xs shadow-lg shadow-[#3B82F6]/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("safety.report")}</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="shrink-0 border-b border-[#EF4444]/20 bg-[#EF4444]/08 px-5 py-2 text-xs text-[#FCA5A5]">
          {loadError}
        </div>
      )}

      {/* ── Two-column body ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[1fr_380px]">

        {/* LEFT — Heatmap (dominant visual) */}
        <div className="relative flex min-h-[360px] flex-col lg:min-h-0">
          <SafetyMapLegend />
          <div className="relative flex-1">
            <SafetyHeatmap
              key={city}
              center={center}
              heatPoints={heatPoints}
              reports={filteredReports}
              userLat={userCoords?.lat}
              userLng={userCoords?.lng}
              pinLat={showForm ? pinCoords?.lat : null}
              pinLng={showForm ? pinCoords?.lng : null}
              onMapClick={handleMapClick}
              layers={heatmapLayers}
              recenterSignal={recenterSignal}
              recenterToUser={!!userCoords}
              className="rounded-none"
            />
            <button
              type="button"
              onClick={() => setRecenterSignal((n) => n + 1)}
              className="absolute bottom-4 right-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl border border-[#262626] bg-[#111111]/95 text-white shadow-lg backdrop-blur-md transition hover:border-[#3B82F6]/50 hover:text-[#3B82F6]"
              aria-label="Re-center map"
              title="Re-center to your location"
            >
              <Crosshair className="h-4 w-4" />
            </button>

            {/* Report form floating panel */}
            {showForm && (
              <div className="absolute bottom-0 left-0 right-0 z-[1001] max-h-[70%] overflow-y-auto rounded-t-2xl border-t border-[#262626] bg-[#111111]/98 p-4 shadow-2xl backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-[420px] sm:rounded-2xl sm:border">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Report an issue</h2>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setPinCoords(null); }}
                    className="rounded-lg p-2 text-[#71717A] hover:bg-[#262626] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {!pinCoords && (
                  <p className="mb-3 flex items-center gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#FCD34D]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    Tap the map to pin the location
                  </p>
                )}
                <div className="mb-3 flex flex-wrap gap-2">
                  {REPORT_TYPES.map((rt) => (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => setType(rt.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        type === rt.id
                          ? "bg-[#3B82F6] text-white"
                          : "border border-[#262626] text-[#A1A1AA] hover:border-[#3B82F6]/40"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
                {pinCoords && (
                  <p className="mb-3 text-xs text-[#22C55E]">
                    Pin: {pinCoords.lat.toFixed(5)}°, {pinCoords.lng.toFixed(5)}°
                  </p>
                )}
                <Input
                  placeholder="What happened? (optional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-3 text-sm text-[#A1A1AA]"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {error && <p className="mt-3 text-sm text-[#EF4444]">{error}</p>}
                <div className="mt-4 flex gap-2">
                  <Button onClick={submit} disabled={submitting} className="flex-1">
                    {submitting ? "Submitting…" : "Submit report"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowForm(false); setPinCoords(null); }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Intelligence feed */}
        <div className="intel-panel flex flex-col overflow-hidden border-t border-[var(--border-subtle)] lg:border-l lg:border-t-0">
          {/* Feed header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                Live Intelligence
              </p>
              <p className="text-xs font-semibold text-white">
                {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
                {categoryFilter !== "all" && ` · ${categoryFilter}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-dim)]" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                  className="appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 pl-7 pr-6 text-[11px] font-semibold text-white outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-dim)]" />
              </div>
            </div>
          </div>

          {/* Scrollable report cards */}
          <div className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
            {filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <p className="text-sm font-semibold text-white">
                  No reports in {center.name} yet
                </p>
                <p className="mt-2 text-xs text-[var(--text-dim)]">
                  NCRB risk zones are visible on the heatmap. Tap the map to report an issue.
                </p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  Report first issue
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleReports.map((r) => {
                  const isOwner = !IS_DEMO_MODE && user?.id === r.user_id;
                  return (
                    <SafetyReportCard
                      key={r.id}
                      report={r}
                      cityName={center.name}
                      commentCount={getCommentCount(r.id)}
                      isOwner={isOwner}
                      onVote={() => reportsService.vote(r.id, "upvote").then(load)}
                      onVerify={() => reportsService.vote(r.id, "verify").then(load)}
                      onComment={() => setCommentReport(r)}
                      onDelete={isOwner ? () => deleteReport(r.id) : undefined}
                      deleting={deletingId === r.id}
                    />
                  );
                })}
                {filteredReports.length > 12 && !showAllReports && (
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[var(--border-subtle)] py-3 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[#3B82F6]/30 hover:text-white"
                    onClick={() => setShowAllReports(true)}
                  >
                    {t("safety.viewAll")} ({filteredReports.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SafetyReportComments
        report={commentReport}
        open={!!commentReport}
        onClose={() => setCommentReport(null)}
        loadComments={loadComments}
        onAddComment={addComment}
      />
    </div>
  );
}
