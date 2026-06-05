export const CITIES = {
  chennai: {
    id: "chennai",
    name: "Chennai",
    center: { lat: 13.0827, lng: 80.2707 },
    quickPlaces: ["T Nagar", "Chennai Central", "Anna Nagar", "Guindy", "Airport", "Marina Beach"],
  },
  hyderabad: {
    id: "hyderabad",
    name: "Hyderabad",
    center: { lat: 17.385, lng: 78.4867 },
    quickPlaces: ["HITEC City", "Secunderabad", "Ameerpet", "LB Nagar", "Airport", "Charminar"],
  },
  bangalore: {
    id: "bangalore",
    name: "Bangalore",
    center: { lat: 12.9716, lng: 77.5946 },
    quickPlaces: ["MG Road", "Indiranagar", "Koramangala", "Whitefield", "Airport", "Majestic"],
  },
} as const;

export type CityId = keyof typeof CITIES;
