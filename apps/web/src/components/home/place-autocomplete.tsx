"use client";

import { Input } from "@/components/ui/input";
import { api, type PlaceSuggestion } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Bus, Landmark, MapPin, Train } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SOURCE_META = {
  landmark: { icon: Landmark, label: "Place" },
  metro: { icon: Train, label: "Metro" },
  bus: { icon: Bus, label: "Bus" },
  osm: { icon: MapPin, label: "OSM" },
} as const;

export function PlaceAutocomplete({
  city,
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
}: {
  city: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
  }, []);

  const selectSuggestion = useCallback(
    (item: PlaceSuggestion) => {
      onChange(item.name);
      setSuggestions([]);
      close();
    },
    [onChange, close]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 1) {
      setSuggestions([]);
      setLoading(false);
      close();
      return;
    }

    setLoading(true);
    const reqId = ++requestRef.current;

    debounceRef.current = setTimeout(() => {
      api
        .placeSuggestions(city, query)
        .then((res) => {
          if (reqId !== requestRef.current) return;
          setSuggestions(res.suggestions);
          setOpen(res.suggestions.length > 0);
          setActiveIdx(-1);
        })
        .catch(() => {
          if (reqId !== requestRef.current) return;
          setSuggestions([]);
          close();
        })
        .finally(() => {
          if (reqId === requestRef.current) setLoading(false);
        });
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, city, close]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Escape") close();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
      <Input
        className="pl-11"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-[#262626] bg-[#111111] py-1 shadow-2xl shadow-black/50"
        >
          {suggestions.map((item, idx) => {
            const meta = SOURCE_META[item.source] ?? SOURCE_META.osm;
            const ItemIcon = meta.icon;
            return (
              <li key={`${item.name}-${item.lat}-${item.lng}`} role="option" aria-selected={idx === activeIdx}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition",
                    idx === activeIdx ? "bg-[#1A1A1A]" : "hover:bg-[#171717]"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                >
                  <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#3B82F6]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{item.name}</span>
                    <span className="block truncate text-[11px] text-[#A1A1AA]">{item.subtitle}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[#262626] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">
                    {meta.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {loading && value.trim().length > 0 && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#71717A]">
          …
        </span>
      )}
    </div>
  );
}
