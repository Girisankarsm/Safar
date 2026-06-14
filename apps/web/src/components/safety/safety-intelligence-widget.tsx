import { useCityStore } from "@/stores/city.store";
import { reportsService } from "@/services/supabase/reports.service";
import { IS_DEMO_MODE } from "@/lib/config";
import { DEMO_PLATFORM_STATS } from "@/lib/demo-hackathon";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function SafetyIntelligenceWidget() {
  const { city } = useCityStore();
  const [stats, setStats] = useState({ total: 0, verified: 0, safePct: 84 });

  useEffect(() => {
    async function load() {
      if (IS_DEMO_MODE) {
        setStats({
          total: DEMO_PLATFORM_STATS.totalReports,
          verified: DEMO_PLATFORM_STATS.verifiedReports,
          safePct: 84,
        });
        return;
      }
      const reports = await reportsService.listByCity(city, 100).catch(() => []);
      const verified = reports.filter((r) => r.is_verified).length;
      const safePct = reports.length
        ? Math.round(
            ((reports.length -
              reports.filter(
                (r) => r.report_type === "harassment" || r.report_type === "unsafe_area"
              ).length) /
              reports.length) *
              100
          )
        : 84;
      setStats({ total: reports.length, verified, safePct: Math.min(99, safePct) });
    }
    void load();

    if (IS_DEMO_MODE) return;

    const ch = reportsService.subscribe(city, () => {
      void load();
    });
    return () => {
      void ch.unsubscribe();
    };
  }, [city]);

  return (
    <div className="mx-3 mb-4 rounded-2xl border border-[#262626] bg-[#111111] p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-white">
        <Shield className="h-4 w-4 text-[#3B82F6]" />
        Safety Intelligence
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-lg font-bold text-white">{stats.total.toLocaleString()}</p>
          <p className="text-[10px] text-[#71717A]">Total Reports</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#22C55E]">{stats.safePct}%</p>
          <p className="text-[10px] text-[#71717A]">Safe Areas</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{stats.verified}</p>
          <p className="text-[10px] text-[#71717A]">Verified</p>
        </div>
        <div className="flex items-end">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#22C55E]">
            <span className="status-live inline-flex h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Updated just now
          </p>
        </div>
      </div>
    </div>
  );
}
