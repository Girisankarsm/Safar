import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  lowDataMode: boolean;
  departureHour: number;
  setLowDataMode: (v: boolean) => void;
  setDepartureHour: (h: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      lowDataMode: false,
      departureHour: new Date().getHours(),
      setLowDataMode: (lowDataMode) => set({ lowDataMode }),
      setDepartureHour: (departureHour) => set({ departureHour: departureHour % 24 }),
    }),
    { name: "safar:settings" }
  )
);
