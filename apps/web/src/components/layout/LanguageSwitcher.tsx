import { LOCALE_LABELS, type Locale } from "@/i18n/translations";
import { useLanguageStore } from "@/stores/language.store";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();

  return (
    <div className="relative">
      <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1.5 pl-8 pr-7 text-xs font-semibold text-white outline-none"
        aria-label="Language"
      >
        {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
