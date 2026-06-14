import { useEffect } from "react";
import { LOCALE_LABELS, type Locale } from "@/i18n/translations";
import { useLanguageStore } from "@/stores/language.store";

/** Keeps document lang in sync with persisted locale on boot. */
export function I18nBootstrap() {
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : locale;
    document.title = `Safar — ${LOCALE_LABELS[locale as Locale] ?? "English"}`;
  }, [locale]);

  return null;
}
