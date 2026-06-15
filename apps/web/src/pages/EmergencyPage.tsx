import { NearestResources } from "@/components/emergency/nearest-resources";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import { NATIONAL_HELPLINES } from "@/lib/helplines";
import { formatWalkingDistance } from "@/lib/geo";
import { contactsService } from "@/services/supabase/contacts.service";
import { placesService } from "@/services/supabase/places.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { EmergencyContact, PlannedRoute, SafeWaitingSpot } from "@/types/database";
import { Heart, Locate, MapPin, MessageCircle, Navigation, Phone, Plus, Siren, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SpotSource =
  | { kind: "route"; label: string; lat: number; lng: number }
  | { kind: "gps"; label: string; lat: number; lng: number }
  | null;


function requestLocation(timeoutMs = 12_000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timer = window.setTimeout(() => resolve(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        window.clearTimeout(timer);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: timeoutMs }
    );
  });
}

function buildWhatsAppLink(phone: string, lat: number, lng: number, name: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const msg = encodeURIComponent(
    `SOS from Safar! ${name} needs help. Live location: https://maps.google.com/?q=${lat},${lng}`
  );
  return `https://wa.me/${withCountry}?text=${msg}`;
}

export function EmergencyPage() {
  const { t } = useI18n();
  const { city } = useCityStore();
  const [spots, setSpots] = useState<SafeWaitingSpot[]>([]);
  const [contactList, setContactList] = useState<EmergencyContact[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [spotNote, setSpotNote] = useState("");
  const [searchRadiusM, setSearchRadiusM] = useState(0);
  const [spotSource, setSpotSource] = useState<SpotSource>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sosLinks, setSosLinks] = useState<{ name: string; url: string }[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const tripId = sessionStorage.getItem("safar-active-trip");

  const loadContacts = useCallback(async () => {
    try {
      const list = await contactsService.list();
      setContactList(list);
    } catch {
      setContactList([]);
    }
  }, []);

  const fmtRadius = (m: number) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);

  const loadSpotsForCoords = useCallback(
    async (lat: number, lng: number, source: SpotSource) => {
      setLoading(true);
      setSpotNote("");
      setSearchRadiusM(0);
      setSpotSource(source);
      try {
        const { spots: results, radiusM } = await placesService.getSafeWaitingSpots(city, lat, lng);
        setSpots(results);
        setSearchRadiusM(radiusM);

        if (!results.length) {
          setSpotNote(
            source?.kind === "route"
              ? `No safe spots found near ${source.label}. Try "Safe Spots Near Me" for your current location.`
              : "No safe spots found. Try calling a helpline below."
          );
        } else if (radiusM > 5000) {
          setSpotNote(
            `Showing nearest curated safe spots for your selected city — live OSM results may be closer once GPS resolves.`
          );
        } else if (radiusM > 1000) {
          setSpotNote(
            `No spots within 1 km — expanded to ${fmtRadius(radiusM)} to find the nearest safe locations.`
          );
        }
      } catch {
        setSpots([]);
        setSpotNote("Could not load safe spots. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [city]
  );

  /** Load spots near the destination of the last searched route (from sessionStorage) */
  const loadRouteSpots = useCallback(async () => {
    const cachedRoutes = sessionStorage.getItem("safar-routes");
    const cachedSearch = sessionStorage.getItem("safar-search");

    if (cachedRoutes) {
      try {
        const routes = JSON.parse(cachedRoutes) as PlannedRoute[];
        const route = routes[0];
        if (route?.dest_lat && route?.dest_lng) {
          const search = cachedSearch ? JSON.parse(cachedSearch) : null;
          const label = search?.destination ?? "your destination";
          await loadSpotsForCoords(route.dest_lat, route.dest_lng, {
            kind: "route",
            label,
            lat: route.dest_lat,
            lng: route.dest_lng,
          });
          return;
        }
      } catch {
        // fall through to city centre
      }
    }

    // No route cached — just show empty state, don't auto-trigger GPS
    setSpots([]);
    setSpotSource(null);
    setSpotNote("");
  }, [loadSpotsForCoords]);

  /** Triggered explicitly by the "Safe Spots Near Me" button */
  const loadNearMeSpots = useCallback(async () => {
    setGpsLoading(true);
    setSpotNote("");
    try {
      const gps = await requestLocation();
      if (!gps) {
        setSpotNote("Location permission denied. Enable GPS and try again.");
        setGpsLoading(false);
        return;
      }
      await loadSpotsForCoords(gps.lat, gps.lng, {
        kind: "gps",
        label: "your location",
        lat: gps.lat,
        lng: gps.lng,
      });
    } finally {
      setGpsLoading(false);
    }
  }, [loadSpotsForCoords]);

  useEffect(() => {
    loadRouteSpots();
    loadContacts();
  }, [loadRouteSpots, loadContacts]);

  async function addContact() {
    if (!newName.trim() || !newPhone.trim()) return;
    setSavingContact(true);
    try {
      await contactsService.add({
        name: newName.trim(),
        phone: newPhone.trim(),
        relationship: newRelation.trim() || undefined,
      });
      setNewName("");
      setNewPhone("");
      setNewRelation("");
      setShowAddContact(false);
      await loadContacts();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add contact");
    } finally {
      setSavingContact(false);
    }
  }

  async function removeContact(id: string) {
    try {
      await contactsService.remove(id);
      await loadContacts();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not remove contact");
    }
  }

  async function sos() {
    setSosLinks([]);
    setStatus("");

    if (!contactList.length) {
      setStatus("Add at least one emergency contact before using SOS.");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("Geolocation is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;

        if (tripId) {
          try {
            const r = await tripsService.triggerSOS(tripId, lat, lng);
            setStatus(`SOS logged on your active trip. Notify ${r.notified} contact(s) via WhatsApp below.`);
            const contacts = r.contacts.length ? r.contacts : contactList;
            setSosLinks(
              contacts.map((c) => ({
                name: c.name,
                url: buildWhatsAppLink(c.phone, lat, lng, c.name),
              }))
            );
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "SOS failed. Use WhatsApp links below.");
            setSosLinks(
              contactList.map((c) => ({
                name: c.name,
                url: buildWhatsAppLink(c.phone, lat, lng, c.name),
              }))
            );
          }
        } else {
          setStatus("No active trip — open WhatsApp to alert your contacts with your live location.");
          setSosLinks(
            contactList.map((c) => ({
              name: c.name,
              url: buildWhatsAppLink(c.phone, lat, lng, c.name),
            }))
          );
        }
      },
      () => setStatus("Location permission denied. Enable GPS to share your position.")
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 pb-24 md:px-8 lg:pb-8">
      <PageHeader
        eyebrow={t("emergency.eyebrow")}
        title={t("emergency.title")}
        subtitle={t("emergency.subtitle", {
          m: searchRadiusM ? fmtRadius(searchRadiusM) : "your route",
        })}
      />

      <Card className="!border-[#EF4444]/30 text-center">
        <button
          type="button"
          onClick={sos}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444] shadow-xl transition hover:scale-105 active:scale-95"
        >
          <Siren className="h-12 w-12 text-white" />
        </button>
        <p className="mt-4 font-bold text-white">{t("emergency.tapSos")}</p>
        <p className="text-sm text-[#A1A1AA]">{t("emergency.contacts", { n: contactList.length })}</p>
        {status && <p className="mt-2 text-sm text-[#22C55E]">{status}</p>}
        {sosLinks.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            {sosLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm font-semibold text-[#22C55E] hover:bg-[#22C55E]/20"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                Alert {link.name} on WhatsApp
              </a>
            ))}
          </div>
        )}
      </Card>

      {!loading && spots.length > 0 && (
        <Card className="!border-[#22C55E]/20">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#22C55E]">
            {t("emergency.nearestResources")}
          </p>
          <NearestResources spots={spots} />
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="text-[#3B82F6]" />
            <h3 className="font-bold text-white">{t("emergency.contactsTitle")}</h3>
          </div>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setShowAddContact((v) => !v)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("emergency.add")}
          </Button>
        </div>

        {showAddContact && (
          <div className="mb-4 space-y-2 rounded-xl border border-[#262626] p-4">
            <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Phone (+91…)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            <Input
              placeholder="Relationship (optional)"
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
            />
            <Button onClick={addContact} disabled={savingContact} className="w-full">
              {savingContact ? "Saving…" : "Save contact"}
            </Button>
          </div>
        )}

        {contactList.length === 0 ? (
          <p className="text-sm text-[#71717A]">{t("emergency.noContacts")}</p>
        ) : (
          <div className="space-y-2">
            {contactList.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[#262626] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-[#A1A1AA]">
                    {c.phone}
                    {c.relationship ? ` · ${c.relationship}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(c.id)}
                  className="rounded-lg p-2 text-[#71717A] hover:bg-[#262626] hover:text-[#EF4444]"
                  aria-label={`Remove ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Phone className="text-[#3B82F6]" />
          <h3 className="font-bold text-white">{t("emergency.helplines")}</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {NATIONAL_HELPLINES.map((h) => (
            <a
              key={h.number}
              href={h.tel}
              className="flex items-center gap-3 rounded-xl border border-[#262626] p-3 hover:border-[#3B82F6]/30"
            >
              <Phone className="h-4 w-4 shrink-0 text-[#3B82F6]" />
              <div>
                <p className="text-sm font-semibold text-white">{h.name}</p>
                <p className="text-xs text-[#A1A1AA]">{h.number} — {h.description}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Heart className="text-[#EC4899]" />
          <h3 className="font-bold text-white">{t("emergency.womenTitle")}</h3>
        </div>
        <a href="tel:1091" className="mb-2 flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">{t("emergency.womenHelpline")}</p>
            <p className="text-xs text-[#A1A1AA]">1091</p>
          </div>
        </a>
        <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">{t("emergency.domesticViolence")}</p>
            <p className="text-xs text-[#A1A1AA]">181</p>
          </div>
        </a>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">
              {t("emergency.safeSpots")}
            </h2>
            {spotSource && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                spotSource.kind === "route"
                  ? "bg-[#3B82F6]/15 text-[#93C5FD]"
                  : "bg-[#22C55E]/15 text-[#86EFAC]"
              }`}>
                {spotSource.kind === "route"
                  ? <><Navigation className="h-2.5 w-2.5" /> Near {spotSource.label}</>
                  : <><Locate className="h-2.5 w-2.5" /> Near you</>
                }
              </span>
            )}
            {!loading && spots.length > 0 && searchRadiusM > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                searchRadiusM <= 1000
                  ? "bg-[#22C55E]/15 text-[#86EFAC]"
                  : searchRadiusM <= 3000
                  ? "bg-[#3B82F6]/15 text-[#93C5FD]"
                  : "bg-[#F59E0B]/15 text-[#FCD34D]"
              }`}>
                {fmtRadius(searchRadiusM)} radius
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadNearMeSpots}
              disabled={gpsLoading || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1.5 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20 disabled:opacity-50"
            >
              <Locate className="h-3.5 w-3.5" />
              {gpsLoading ? "Locating…" : "Safe Spots Near Me"}
            </button>
            {spotSource && (
              <button
                type="button"
                onClick={loadRouteSpots}
                disabled={loading}
                className="text-xs font-semibold text-[#3B82F6] disabled:opacity-50"
              >
                {t("emergency.refresh")}
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="space-y-1.5">
            <p className="text-sm text-[#A1A1AA]">{t("emergency.fetching")}</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 5, 8].map((km) => (
                <span key={km} className="animate-pulse rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] text-[#22C55E]">
                  {km} km
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no route has been searched yet */}
        {!loading && !spotSource && !spots.length && (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-8 text-center">
            <Navigation className="mx-auto mb-3 h-8 w-8 text-[#3B82F6]/40" />
            <p className="text-sm font-semibold text-white">Search a route first</p>
            <p className="mt-1 text-xs text-[#71717A]">
              Safe spots will appear near your destination once you plan a route from the Dashboard.
            </p>
            <button
              type="button"
              onClick={loadNearMeSpots}
              disabled={gpsLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#22C55E]/15 px-4 py-2 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/25 disabled:opacity-50"
            >
              <Locate className="h-3.5 w-3.5" />
              {gpsLoading ? "Locating…" : "Or tap for Safe Spots Near Me"}
            </button>
          </div>
        )}

        {spotNote && !loading && <p className="mb-3 text-xs text-[#F59E0B]">{spotNote}</p>}

        <div className="space-y-2">
          {!loading &&
            spots.map((s) => (
              <a
                key={s.id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 hover:border-[#22C55E]/30"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-[#A1A1AA]">
                      {s.spot_type.replace(/_/g, " ")} · Score {s.safe_waiting_score ?? "—"}/100
                      {s.is_24x7 ? " · 24/7" : ""}
                    </p>
                  </div>
                </div>
                {s.distance_m != null && (
                  <span className="ml-3 shrink-0 text-xs font-bold text-[#22C55E]">
                    {formatWalkingDistance(s.distance_m)}
                  </span>
                )}
              </a>
            ))}
        </div>

        {!loading && spots.length === 0 && (
          <p className="text-sm text-[#71717A]">{t("emergency.noSpots")}</p>
        )}
      </div>
    </div>
  );
}
