import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Locale, TRANSLATIONS } from "@/i18n/translations";

type LanguageState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => {
        set({ locale });
        document.documentElement.lang = locale === "en" ? "en" : locale;
      },
    }),
    {
      name: "safar:locale",
      onRehydrateStorage: () => (state) => {
        if (state && !TRANSLATIONS[state.locale as Locale]) {
          state.locale = "en";
        }
        if (state) {
          document.documentElement.lang = state.locale === "en" ? "en" : state.locale;
        }
      },
    }
  )
);
