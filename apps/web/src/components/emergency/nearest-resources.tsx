import type { SafeWaitingSpot } from "@/types/database";
import { formatWalkingDistance } from "@/lib/geo";
import { Building2, Cross, MapPin, Pill, Shield } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  police: { icon: Shield, color: "#3B82F6", label: "Nearest Police" },
  hospital: { icon: Cross, color: "#EF4444", label: "Nearest Hospital" },
  pharmacy: { icon: Pill, color: "#22C55E", label: "Nearest Pharmacy" },
};

function nearestOfType(spots: SafeWaitingSpot[], type: SafeWaitingSpot["spot_type"]) {
  return spots
    .filter((s) => s.spot_type === type)
    .sort((a, b) => (a.distance_m ?? 99999) - (b.distance_m ?? 99999))[0];
}

export function NearestResources({ spots }: { spots: SafeWaitingSpot[] }) {
  const police = nearestOfType(spots, "police");
  const hospital = nearestOfType(spots, "hospital");
  const pharmacy = nearestOfType(spots, "pharmacy");
  const safeSpot = spots
    .filter((s) => !["police", "hospital", "pharmacy"].includes(s.spot_type))
    .sort((a, b) => (a.distance_m ?? 99999) - (b.distance_m ?? 99999))[0];

  const cards: Array<{ spot: SafeWaitingSpot; label: string; icon: typeof Shield; color: string }> = [];

  if (police) cards.push({ spot: police, ...TYPE_CONFIG.police });
  if (hospital) cards.push({ spot: hospital, ...TYPE_CONFIG.hospital });
  if (pharmacy) cards.push({ spot: pharmacy, ...TYPE_CONFIG.pharmacy });
  if (safeSpot) {
    cards.push({
      spot: safeSpot,
      icon: Building2,
      color: "#F59E0B",
      label: "Safe Waiting Spot",
    });
  }

  if (!cards.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map(({ spot, label, icon: Icon, color }) => (
        <a
          key={spot.id}
          href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition hover:border-[#22C55E]/30"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}18` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">{label}</p>
            <p className="truncate text-sm font-semibold text-white">{spot.name}</p>
            <p className="text-[10px] text-[#A1A1AA]">Score {spot.safe_waiting_score ?? "—"}/100</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-[#22C55E]">{formatWalkingDistance(spot.distance_m)}</p>
            <MapPin className="ml-auto h-3 w-3 text-[#71717A]" />
          </div>
        </a>
      ))}
    </div>
  );
}
