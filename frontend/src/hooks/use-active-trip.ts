"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ActiveTripState = {
  tripId: string | null;
  setTripId: (id: string | null) => void;
};

export const useActiveTrip = create<ActiveTripState>()(
  persist(
    (set) => ({
      tripId: null,
      setTripId: (tripId) => set({ tripId }),
    }),
    { name: "safarai-active-trip" }
  )
);
