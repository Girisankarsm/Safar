export interface CityConfig {
  id: string;
  name: string;
  displayName: string;
  defaultSource: string;
  defaultDestination: string;
  demoCorridor: string;
  center: [number, number];
  quickPlaces: string[];
}

export const cities: Record<string, CityConfig> = {
  chennai: {
    id: "chennai",
    name: "Chennai",
    displayName: "Chennai",
    defaultSource: "T Nagar",
    defaultDestination: "Chennai Central",
    demoCorridor: "T Nagar → Chennai Central",
    center: [13.0827, 80.2707],
    quickPlaces: [
      "T Nagar",
      "Chennai Central",
      "Marina Beach",
      "Anna Nagar",
      "Nungambakkam",
      "Guindy",
      "OMR Sholinganallur",
      "Adyar",
    ],
  },
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    displayName: "Hyderabad",
    defaultSource: "HITEC City",
    defaultDestination: "Secunderabad Station",
    demoCorridor: "HITEC City → Secunderabad",
    center: [17.44, 78.45],
    quickPlaces: [
      "HITEC City",
      "Secunderabad Station",
      "Ameerpet",
      "Gachibowli",
      "Charminar",
      "LB Nagar",
    ],
  },
};

export const DEFAULT_CITY = "chennai";

export function getCityConfig(cityId: string): CityConfig {
  return cities[cityId] ?? cities[DEFAULT_CITY];
}
