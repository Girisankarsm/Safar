import type { CityId } from "@/types/database";
import { CITIES } from "@/config/cities";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const SESSION_KEYS = ["safar-routes", "safar-search", "safar-routes-city"] as const;

function clearRouteSession() {
  for (const key of SESSION_KEYS) sessionStorage.removeItem(key);
}

type CityState = {
  city: CityId;
  revision: number;
  setCity: (city: CityId) => void;
};

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      city: "chennai",
      revision: 0,
      setCity: (city) => {
        if (get().city === city) return;
        clearRouteSession();
        set({ city, revision: get().revision + 1 });
      },
    }),
    {
      name: "safar-city",
      partialize: (state) => ({ city: state.city }),
      onRehydrateStorage: () => (state) => {
        if (state && !CITIES[state.city as CityId]) {
          state.city = "chennai";
        }
      },
    }
  )
);
