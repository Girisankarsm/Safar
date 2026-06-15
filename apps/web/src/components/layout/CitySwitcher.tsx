import { CITY_LIST, getCityConfig } from "@/config/cities";
import { useCityStore } from "@/stores/city.store";
import type { CityId } from "@/types/database";
import { MapPin } from "lucide-react";

export function CitySwitcher({ compact = false }: { compact?: boolean }) {
  const { city, setCity } = useCityStore();
  const current = getCityConfig(city);

  if (compact) {
    return (
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#3B82F6]" />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value as CityId)}
          aria-label="Select city"
          className="appearance-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1 pl-6 pr-5 text-[11px] font-bold text-white outline-none"
        >
          {CITY_LIST.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[#71717A]">▾</span>
        <span className="sr-only">Current area: {current.name}, {current.state}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
      <select
        value={city}
        onChange={(e) => setCity(e.target.value as CityId)}
        aria-label="Select city"
        className="appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2.5 pl-9 pr-9 text-sm font-semibold text-white outline-none transition hover:border-[#3B82F6]/40 focus:border-[#3B82F6]/60 focus:ring-2 focus:ring-[#3B82F6]/15"
      >
        {CITY_LIST.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#71717A]">▾</span>
      <span className="sr-only">Current area: {current.name}, {current.state}</span>
    </div>
  );
}
