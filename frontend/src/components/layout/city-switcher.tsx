"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";

export function CitySwitcher() {
  const { city, setCity } = useCity();
  return (
    <select
      value={city}
      onChange={(e) => setCity(e.target.value as keyof typeof CITIES)}
      className="rounded-xl border border-[#262626] bg-[#171717] px-3 py-2 text-sm font-medium text-white outline-none transition focus:border-[#3B82F6]/50"
    >
      {Object.values(CITIES).map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
