import { buildActivityFromReports, computePlatformStats } from "@/lib/community-activity";
import {
  DEMO_PLATFORM_STATS,
  demoActivityFeed,
} from "@/lib/demo-hackathon";
import { IS_DEMO_MODE } from "@/lib/config";
import { debounce } from "@/lib/debounce-callback";
import { CITY_LIST } from "@/config/cities";
import { reportsService } from "@/services/supabase/reports.service";
import { useCityStore } from "@/stores/city.store";
import { useCallback, useEffect, useRef, useState } from "react";

export function useCommunityActivity(limit = 50) {
  const { city } = useCityStore();
  const [activity, setActivity] = useState<ReturnType<typeof buildActivityFromReports>>([]);
  const [stats, setStats] = useState(computePlatformStats([], CITY_LIST.length));
  const [loading, setLoading] = useState(true);

  const loadCommunityData = useCallback(async () => {
    setLoading(true);
    try {
      if (IS_DEMO_MODE) {
        setActivity(demoActivityFeed(city));
        setStats(DEMO_PLATFORM_STATS);
        return;
      }
      const reports = await reportsService.listByCity(city, limit);
      setActivity(buildActivityFromReports(reports, limit > 20 ? 30 : 10));
      setStats(computePlatformStats(reports, CITY_LIST.length));
    } catch {
      if (IS_DEMO_MODE) {
        setActivity(demoActivityFeed(city));
        setStats(DEMO_PLATFORM_STATS);
      }
    } finally {
      setLoading(false);
    }
  }, [city, limit]);

  const debouncedLoadRef = useRef<ReturnType<typeof debounce<() => void>> | null>(null);
  useEffect(() => {
    debouncedLoadRef.current = debounce(() => void loadCommunityData(), 900);
    return () => debouncedLoadRef.current?.cancel();
  }, [loadCommunityData]);

  useEffect(() => {
    loadCommunityData();
    const channel = reportsService.subscribe(city, () => {
      debouncedLoadRef.current?.();
    });
    return () => {
      debouncedLoadRef.current?.cancel();
      channel.unsubscribe();
    };
  }, [city, loadCommunityData]);

  return { activity, stats, loading };
}
