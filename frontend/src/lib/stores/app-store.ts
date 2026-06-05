import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RouteOption, Trip } from "@/lib/types";
import { getCityConfig, DEFAULT_CITY } from "@/config/cities";

const initialCity = getCityConfig(DEFAULT_CITY);

interface AppState {
  city: string;
  source: string;
  destination: string;
  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  activeTrip: Trip | null;
  womenSafetyMode: boolean;
  nightSafeMode: boolean;
  setCity: (city: string) => void;
  setSource: (v: string) => void;
  setDestination: (v: string) => void;
  setRoutes: (routes: RouteOption[]) => void;
  selectRoute: (route: RouteOption) => void;
  setActiveTrip: (trip: Trip | null) => void;
  setWomenSafetyMode: (v: boolean) => void;
  setNightSafeMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      city: DEFAULT_CITY,
      source: initialCity.defaultSource,
      destination: initialCity.defaultDestination,
      routes: [],
      selectedRoute: null,
      activeTrip: null,
      womenSafetyMode: true,
      nightSafeMode: false,
      setCity: (city) => {
        const cfg = getCityConfig(city);
        set({
          city,
          source: cfg.defaultSource,
          destination: cfg.defaultDestination,
          routes: [],
          selectedRoute: null,
        });
      },
      setSource: (source) => set({ source }),
      setDestination: (destination) => set({ destination }),
      setRoutes: (routes) => set({ routes }),
      selectRoute: (selectedRoute) => set({ selectedRoute }),
      setActiveTrip: (activeTrip) => set({ activeTrip }),
      setWomenSafetyMode: (womenSafetyMode) => set({ womenSafetyMode }),
      setNightSafeMode: (nightSafeMode) => set({ nightSafeMode }),
    }),
    { name: "safarai-store" }
  )
);
