import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { crimeRiskLabelHuman } from "@/lib/crime-data";
import { crimeService, type CrimeCityScore, type CrimeDataset } from "@/services/supabase/crime.service";
import { Database, ExternalLink, RefreshCw, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const OFFICIAL_SOURCES = [
  { name: "NCRB Crime in India", url: "https://ncrb.gov.in/crime-in-india-year-wise.html" },
  { name: "Data.gov.in — District IPC Crimes", url: "https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes" },
  { name: "Data.gov.in — Crimes Against Women", url: "https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women" },
];

export function CrimeDataAdminPage() {
  const [datasets, setDatasets] = useState<CrimeDataset[]>([]);
  const [scores, setScores] = useState<CrimeCityScore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    crimeService.clearCache();
    const [d, s] = await Promise.all([crimeService.listDatasets(), crimeService.listCityScores()]);
    setDatasets(d);
    setScores(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="app-page-scroll space-y-8 px-5 py-6 md:px-8 lg:py-8">
      <PageHeader
        eyebrow="Data engineering"
        title="Crime Data Pipeline"
        subtitle="Official NCRB and Data.gov.in statistics powering Safar's Historical Crime Index (25% of route safety score)."
        action={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-white hover:border-[#3B82F6]/40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">Datasets</p>
          <p className="mt-2 text-3xl font-bold text-white">{datasets.length}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">City Scores</p>
          <p className="mt-2 text-3xl font-bold text-white">{scores.length}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">Pipeline</p>
          <p className="mt-2 text-sm font-semibold text-[#22C55E]">Active</p>
          <p className="text-xs text-[#71717A]">scripts/crime-pipeline/</p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#3B82F6]" />
          <h3 className="font-bold text-white">City Crime Index</h3>
        </div>
        <div className="space-y-3">
          {scores.map((s) => (
            <div
              key={s.city_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] px-4 py-3"
            >
              <div>
                <p className="font-semibold capitalize text-white">{s.city_id}</p>
                <p className="text-xs text-[#71717A]">
                  {s.data_source} · {s.report_year} · {s.mapping_confidence} confidence
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#22C55E]">{s.crime_index}/100</p>
                <p className="text-xs text-[#A1A1AA]">{crimeRiskLabelHuman(s.risk_label)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#F59E0B]" />
          <h3 className="font-bold text-white">Import History</h3>
        </div>
        {datasets.length === 0 ? (
          <p className="text-sm text-[#71717A]">
            No datasets imported. Run <code className="text-[#3B82F6]">supabase/seed_crime.sql</code> or{" "}
            <code className="text-[#3B82F6]">node scripts/crime-pipeline/run-pipeline.mjs</code>
          </p>
        ) : (
          <div className="space-y-2">
            {datasets.map((d) => (
              <div key={d.id} className="rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{d.source_name}</p>
                  <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#22C55E]">
                    {d.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#71717A]">
                  {d.source_agency} · {d.report_year} · {d.row_count} rows
                </p>
                {d.error_log && <p className="mt-1 text-xs text-[#EF4444]">{d.error_log}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-bold text-white">Official Data Sources</h3>
        <ul className="space-y-2">
          {OFFICIAL_SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-[#3B82F6] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#71717A]">
          CLI: <code>node scripts/crime-pipeline/status.mjs</code> ·{" "}
          <code>node scripts/crime-pipeline/run-pipeline.mjs</code>
        </p>
      </Card>
    </div>
  );
}
