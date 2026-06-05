"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";

export function CitySwitcher() {
  const { city, setCity } = useCity();
  return (
    <select
      value={city}
      onChange={(e) => setCity(e.target.value as keyof typeof CITIES)}
      className="rounded-lg border border-[#222222] bg-[#111111] px-3 py-1.5 text-sm text-white outline-none"
    >
      {Object.values(CITIES).map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
