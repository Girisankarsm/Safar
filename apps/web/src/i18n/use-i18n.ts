import { useCallback } from "react";
import { translate } from "@/i18n/translations";
import { useLanguageStore } from "@/stores/language.store";

/** Subscribe to locale so the whole tree re-renders when language changes. */
export function useI18n() {
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );
  return { locale, setLocale, t };
}

export function useT() {
  return useI18n().t;
}
