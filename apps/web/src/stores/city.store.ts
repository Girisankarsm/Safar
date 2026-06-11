import type { CityId } from "@/types/database";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCityStore = create<{ city: CityId; setCity: (c: CityId) => void }>()(
  persist(
    (set) => ({ city: "chennai", setCity: (city) => set({ city }) }),
    { name: "safar-city" }
  )
);
