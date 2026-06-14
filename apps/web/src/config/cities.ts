import type { CityId } from "@/types/database";

export type CityConfig = {
  id: CityId;
  name: string;
  state: string;
  center_lat: number;
  center_lng: number;
  /** Nominatim viewbox bias: west, north, east, south */
  viewbox: { west: number; north: number; east: number; south: number };
};

export const CITIES: Record<CityId, CityConfig> = {
  chennai: {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    center_lat: 13.0827,
    center_lng: 80.2707,
    viewbox: { west: 80.05, north: 13.25, east: 80.45, south: 12.85 },
  },
  trivandrum: {
    id: "trivandrum",
    name: "Trivandrum",
    state: "Kerala",
    center_lat: 8.5241,
    center_lng: 76.9366,
    viewbox: { west: 76.75, north: 8.65, east: 77.15, south: 8.35 },
  },
  bangalore: {
    id: "bangalore",
    name: "Bengaluru",
    state: "Karnataka",
    center_lat: 12.9716,
    center_lng: 77.5946,
    viewbox: { west: 77.35, north: 13.15, east: 77.85, south: 12.75 },
  },
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    center_lat: 17.385,
    center_lng: 78.4867,
    viewbox: { west: 78.25, north: 17.55, east: 78.75, south: 17.2 },
  },
};

export const CITY_LIST = Object.values(CITIES);

export function getCityConfig(cityId: CityId): CityConfig {
  return CITIES[cityId];
}
