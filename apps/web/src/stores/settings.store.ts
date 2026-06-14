import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  lowDataMode: boolean;
  departureHour: number;
  departureHourCustom: boolean;
  setLowDataMode: (v: boolean) => void;
  setDepartureHour: (h: number) => void;
  resetDepartureToNow: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      lowDataMode: false,
      departureHour: new Date().getHours(),
      departureHourCustom: false,
      setLowDataMode: (lowDataMode) => set({ lowDataMode }),
      setDepartureHour: (departureHour) =>
        set({ departureHour: departureHour % 24, departureHourCustom: true }),
      resetDepartureToNow: () =>
        set({ departureHour: new Date().getHours(), departureHourCustom: false }),
    }),
    { name: "safar:settings" }
  )
);
