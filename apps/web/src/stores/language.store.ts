import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Locale, TRANSLATIONS, translate } from "@/i18n/translations";

type LanguageState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      locale: "en",
      setLocale: (locale) => {
        set({ locale });
        document.documentElement.lang = locale === "en" ? "en" : locale;
      },
      t: (key) => translate(get().locale, key),
    }),
    { name: "safar:locale", onRehydrateStorage: () => (state) => {
      if (state && !TRANSLATIONS[state.locale as Locale]) state.locale = "en";
    } }
  )
);

export function useT() {
  return useLanguageStore((s) => s.t);
}
