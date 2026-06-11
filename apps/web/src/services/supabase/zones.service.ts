/**
 * @deprecated Use placesService + heatmapService for live data.
 * Retained for backward compatibility only.
 */
import { placesService } from "@/services/supabase/places.service";
import { heatmapService } from "@/services/supabase/heatmap.service";
import type { CityId } from "@/types/database";

export const zonesService = {
  getSafeSpots: placesService.getSafeWaitingSpots.bind(placesService),
  getCities: placesService.getCities.bind(placesService),
  async getZones(cityId: CityId) {
    const points = await heatmapService.getHeatmapPoints(cityId);
    return points.map((p, i) => ({
      id: `heat-${i}`,
      city_id: cityId,
      zone_type: p.zone_type,
      label: p.label,
      latitude: p.lat,
      longitude: p.lng,
      risk_weight: p.weight,
    }));
  },
};
