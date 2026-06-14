import { SafetyHeatmap } from "@/components/map/SafetyHeatmap";
import { SafetyMapControls, type MapLayers, type TimeFilter } from "@/components/safety/safety-map-controls";
import { SafetyMapLegend } from "@/components/safety/safety-map-legend";
import { SafetyReportCard } from "@/components/safety/safety-report-card";
import { SafetyReportComments } from "@/components/safety/safety-report-comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { IS_DEMO_MODE } from "@/lib/config";
import { demoCommentCount, demoComments, demoReports } from "@/lib/demo-hackathon";
import { heatmapService, type HeatmapPoint } from "@/services/supabase/heatmap.service";
import { placesService } from "@/services/supabase/places.service";
import { reportsService } from "@/services/supabase/reports.service";
import { storageService } from "@/services/supabase/storage.service";
import { useCityStore } from "@/stores/city.store";
import type { CommunityComment, ReportType, SafetyReport } from "@/types/database";
import { ChevronDown, Crosshair, Filter, MapPin, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    heatmap: true,
    reports: true,
    safeZones: true,
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
      const [heat, r, cities] = await Promise.all([
        heatmapService.getHeatmapPoints(city),
        IS_DEMO_MODE
          ? Promise.resolve(demoReports(city))
          : reportsService.listByCity(city).catch(() => []),
        placesService.getCities(),
      ]);
      setHeatPoints(heat);
      setReports(r);
      if (!IS_DEMO_MODE) {
        const counts = await Promise.all(
          r.map(async (report) => [report.id, await reportsService.countComments(report.id)] as const)
        );
        setCommentCounts(Object.fromEntries(counts));
      }
      const c = cities.find((x) => x.id === city);
      if (c) setCenter({ lat: c.center_lat, lng: c.center_lng, name: c.name });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load safety data");
    }
  }, [city]);

  useEffect(() => {
    const c = getCityConfig(city);
    setCenter({ lat: c.center_lat, lng: c.center_lng, name: c.name });
    setPinCoords(null);
    setShowForm(false);
    setShowAllReports(false);
    load();
    navigator.geolocation?.getCurrentPosition((p) =>
      setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude })
    );

    if (IS_DEMO_MODE) return;

    const channel = reportsService.subscribe(city, () => {
      void load();
    });
    return () => {
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
    return list;
  }, [reports, timeFilter, categoryFilter]);

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

  return (
    <div className="space-y-6">
      {loadError && (
        <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
          {loadError}
        </p>
      )}

      {/* Map block */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] shadow-2xl">
        <SafetyMapLegend />
        <div className="relative h-[480px] max-h-[58vh]">
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
          <SafetyMapControls
            layers={layers}
            onLayersChange={setLayers}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            categories={CATEGORY_OPTIONS}
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

          {showForm && (
            <div className="absolute bottom-0 left-0 right-0 z-[1001] max-h-[70%] overflow-y-auto rounded-t-2xl border-t border-[#262626] bg-[#111111]/98 p-4 shadow-2xl backdrop-blur-md sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-md sm:rounded-2xl sm:border">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Report an issue</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setPinCoords(null);
                  }}
                  className="rounded-lg p-2 text-[#71717A] hover:bg-[#262626] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!pinCoords && (
                <p className="mb-3 flex items-center gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#FCD34D]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  Tap the map above to pin the location
                </p>
              )}

              <div className="mb-3 flex flex-wrap gap-2">
                {REPORT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      type === t.id
                        ? "bg-[#3B82F6] text-white"
                        : "border border-[#262626] text-[#A1A1AA] hover:border-[#3B82F6]/40"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {pinCoords && (
                <p className="mb-3 text-xs text-[#22C55E]">
                  Pin set at {pinCoords.lat.toFixed(5)}°, {pinCoords.lng.toFixed(5)}°
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
                  onClick={() => {
                    setShowForm(false);
                    setPinCoords(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reports feed */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 rounded-xl px-5 shadow-lg shadow-[#3B82F6]/20"
          >
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <Filter className="h-3.5 w-3.5" />
            Sort by:
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-[#262626] bg-[#111111] py-1.5 pl-3 pr-8 text-xs font-semibold text-white outline-none"
                defaultValue="recent"
              >
                <option value="recent">Recent</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
          Live Community Reports
        </p>

        {filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#262626] bg-[#111111]/50 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-white">No community reports in {center.name} yet</p>
            <p className="mt-2 text-sm text-[#71717A]">
              NCRB risk zones are still visible on the map. Tap the map to drop a pin and report the first issue.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              Report first issue
            </Button>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-thin">
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
            </div>
            {filteredReports.length > 12 && !showAllReports && (
              <Button
                variant="ghost"
                className="mt-4 w-full rounded-xl border border-[#262626] py-6 text-sm font-semibold text-[#A1A1AA] hover:border-[#3B82F6]/30 hover:text-white"
                onClick={() => setShowAllReports(true)}
              >
                View All Reports ({filteredReports.length})
              </Button>
            )}
          </>
        )}
      </section>

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
