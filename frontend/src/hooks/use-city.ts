"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CityId } from "@/config/cities";

type CityState = {
  city: CityId;
  setCity: (c: CityId) => void;
};

export const useCity = create<CityState>()(
  persist(
    (set) => ({
      city: "chennai",
      setCity: (city) => set({ city }),
    }),
    { name: "safarai-city" }
  )
);
