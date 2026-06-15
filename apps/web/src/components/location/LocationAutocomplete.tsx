import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  nominatimService,
  suggestionToGeocoded,
  type GeocodedPlace,
  type LocationSuggestion,
} from "@/services/osm/nominatim.service";
import type { CityId } from "@/types/database";
import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { HighlightMatch } from "./highlight-match";

export type SelectedPlace = GeocodedPlace & { label: string };

type LocationAutocompleteProps = {
  id?: string;
  label: string;
  placeholder: string;
  cityId: CityId;
  value: string;
  selectedPlace: SelectedPlace | null;
  onValueChange: (value: string) => void;
  onPlaceSelect: (place: SelectedPlace | null) => void;
  disabled?: boolean;
};

export function LocationAutocomplete({
  id,
  label,
  placeholder,
  cityId,
  value,
  selectedPlace,
  onValueChange,
  onPlaceSelect,
  disabled = false,
}: LocationAutocompleteProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listboxId = `${inputId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const debouncedQuery = useDebounce(value, 300);

  useEffect(() => {
    setSuggestions([]);
    setStatusMessage(null);
    setActiveIndex(-1);
  }, [cityId]);

  useEffect(() => {
    if (!open) return;

    if (debouncedQuery.trim().length < 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setStatusMessage(null);
      setUsingFallback(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    if (selectedPlace && debouncedQuery.trim() === selectedPlace.label.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    nominatimService
      .autocomplete(debouncedQuery, cityId, { limit: 10, signal: controller.signal })
      .then(({ suggestions: results, fallback, message }) => {
        if (controller.signal.aborted) return;
        setSuggestions(results);
        setUsingFallback(fallback);
        setStatusMessage(message ?? null);
        setActiveIndex(results.length ? 0 : -1);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, cityId, open, selectedPlace]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: LocationSuggestion) {
    const geocoded = suggestionToGeocoded(suggestion, value);
    const label = suggestion.name;
    onValueChange(label);
    onPlaceSelect({ ...geocoded, label });
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
    setStatusMessage(null);
  }

  function handleInputChange(next: string) {
    onValueChange(next);
    if (selectedPlace && next.trim() !== selectedPlace.label.trim()) {
      onPlaceSelect(null);
    }
    setOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!suggestions.length) return;
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestions.length) return;
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showDropdown = open && value.trim().length >= 2 && (loading || suggestions.length > 0 || Boolean(statusMessage));

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full rounded-xl border border-[#262626] bg-[#111111] py-3 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-[#71717A] focus:border-[#3B82F6]/50",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#3B82F6]" />
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A] shadow-2xl shadow-black/40"
          role="listbox"
          id={listboxId}
        >
          {statusMessage && (
            <p
              className={cn(
                "border-b border-[#262626] px-4 py-2.5 text-xs",
                usingFallback ? "text-[#F59E0B]" : "text-[#A1A1AA]"
              )}
            >
              {statusMessage}
            </p>
          )}

          {loading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-[#A1A1AA]">
              <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
              Searching places…
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto overscroll-contain py-1">
              {suggestions.map((suggestion, index) => {
                const active = index === activeIndex;
                return (
                  <li key={suggestion.id} role="presentation">
                    <button
                      type="button"
                      id={`${inputId}-option-${index}`}
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full min-h-[52px] items-start gap-3 px-4 py-3 text-left transition",
                        active ? "bg-[#3B82F6]/15" : "hover:bg-[#171717]"
                      )}
                    >
                      <MapPin className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-[#3B82F6]" : "text-[#71717A]")} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          <HighlightMatch text={suggestion.name} query={value} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#A1A1AA]">
                          <HighlightMatch text={suggestion.address} query={value} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            !loading && (
              <p className="px-4 py-4 text-sm text-[#A1A1AA]">
                No matching places. Try a station, college, or neighborhood name.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
