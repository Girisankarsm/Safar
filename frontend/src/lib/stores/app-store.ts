import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RouteOption, Trip } from "@/lib/types";

interface AppState {
  source: string;
  destination: string;
  routes: RouteOption[];
  selectedRoute: RouteOption | null;
  activeTrip: Trip | null;
  womenSafetyMode: boolean;
  nightSafeMode: boolean;
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
      source: "HITEC City",
      destination: "Secunderabad Station",
      routes: [],
      selectedRoute: null,
      activeTrip: null,
      womenSafetyMode: true,
      nightSafeMode: false,
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
