import { NearestResources } from "@/components/emergency/nearest-resources";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCityConfig } from "@/config/cities";
import { IS_DEMO_MODE } from "@/lib/config";
import { contactsService } from "@/services/supabase/contacts.service";
import { placesService } from "@/services/supabase/places.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { EmergencyContact, SafeWaitingSpot } from "@/types/database";
import { Heart, MapPin, MessageCircle, Phone, Plus, Siren, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function getCityCenter(city: Parameters<typeof getCityConfig>[0]) {
  const c = getCityConfig(city);
  return { lat: c.center_lat, lng: c.center_lng };
}

function requestLocation(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
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
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs }
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
  const { city } = useCityStore();
  const [spots, setSpots] = useState<SafeWaitingSpot[]>([]);
  const [contactList, setContactList] = useState<EmergencyContact[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [spotNote, setSpotNote] = useState("");
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

  const loadSpots = useCallback(async () => {
    setLoading(true);
    setSpotNote("");
    try {
      const gps = await requestLocation();
      const coords = gps ?? getCityCenter(city);
      const results = await placesService.getSafeWaitingSpots(city, coords.lat, coords.lng);
      setSpots(results.slice(0, 8));
      if (!results.length) {
        setSpotNote("No safe spots found nearby. Try switching city or check back later.");
      } else if (!gps) {
        setSpotNote("Showing spots near city center — enable location for results near you.");
      }
    } catch {
      setSpots([]);
      setSpotNote("Could not load safe spots right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadSpots();
    loadContacts();
  }, [loadSpots, loadContacts]);

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
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Safety first"
        title="Emergency Shield"
        subtitle={`Safe waiting spots from ${IS_DEMO_MODE ? "offline fallback" : "OpenStreetMap"} — hospitals, police, fuel, pharmacies, and transit.`}
      />

      <Card className="!border-[#EF4444]/30 text-center">
        <button
          type="button"
          onClick={sos}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444] shadow-xl transition hover:scale-105 active:scale-95"
        >
          <Siren className="h-12 w-12 text-white" />
        </button>
        <p className="mt-4 font-bold text-white">Tap for SOS</p>
        <p className="text-sm text-[#A1A1AA]">{contactList.length} trusted contact(s)</p>
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
            Nearest Emergency Resources
          </p>
          <NearestResources spots={spots} />
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="text-[#3B82F6]" />
            <h3 className="font-bold text-white">Emergency Contacts</h3>
          </div>
          <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => setShowAddContact((v) => !v)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
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
          <p className="text-sm text-[#71717A]">No contacts yet. Add family or friends to enable SOS alerts.</p>
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
          <Heart className="text-[#EC4899]" />
          <h3 className="font-bold text-white">Women&apos;s Emergency</h3>
        </div>
        <a href="tel:1091" className="mb-2 flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">Women Helpline</p>
            <p className="text-xs text-[#A1A1AA]">1091</p>
          </div>
        </a>
        <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">Domestic Violence</p>
            <p className="text-xs text-[#A1A1AA]">181</p>
          </div>
        </a>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">Safe Waiting Spots</h2>
          <button
            type="button"
            onClick={loadSpots}
            disabled={loading}
            className="text-xs font-semibold text-[#3B82F6] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="text-sm text-[#A1A1AA]">Fetching nearby places from OpenStreetMap…</p>}

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
                    {s.distance_m < 1000 ? `${s.distance_m}m` : `${(s.distance_m / 1000).toFixed(1)}km`}
                  </span>
                )}
              </a>
            ))}
        </div>

        {!loading && spots.length === 0 && (
          <p className="text-sm text-[#71717A]">No safe waiting spots to show.</p>
        )}
      </div>
    </div>
  );
}
