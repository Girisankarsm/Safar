import { authService } from "@/features/auth/auth.service";
import { useAuth } from "@/features/auth";
import { Card } from "@/components/ui/card";
import { Heart, Moon, Shield } from "lucide-react";
import { useState } from "react";

export function WomenSafetySettings() {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  async function toggle(field: "women_safety_mode" | "night_safe_preference", value: boolean) {
    if (!profile) return;
    setSaving(true);
    try {
      await authService.updateProfile(profile.id, { [field]: value });
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  const womenMode = profile?.women_safety_mode ?? true;
  const nightSafe = profile?.night_safe_preference ?? false;

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-5 w-5 text-[#EC4899]" />
        <h3 className="font-bold text-white">Safety Preferences</h3>
      </div>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4 transition hover:border-[#EC4899]/30">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Shield className="h-4 w-4 text-[#EC4899]" />
              Women Safety Mode
            </p>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              Prioritize women-friendly routes, highlight helplines, and apply extra safety weighting in route scoring.
            </p>
            {womenMode && (
              <p className="mt-2 text-xs font-semibold text-[#EC4899]">
                Active — Safar will prioritise safer, well-lit corridors
              </p>
            )}
          </div>
          <input
            type="checkbox"
            checked={womenMode}
            disabled={saving}
            onChange={(e) => toggle("women_safety_mode", e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[#EC4899]"
            aria-label="Toggle Women Safety Mode"
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-4 transition hover:border-[#3B82F6]/30">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Moon className="h-4 w-4 text-[#3B82F6]" />
              Night Safe Preference
            </p>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              Boost safest routes after 9 PM and show additional night-travel guidance.
            </p>
          </div>
          <input
            type="checkbox"
            checked={nightSafe}
            disabled={saving}
            onChange={(e) => toggle("night_safe_preference", e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[#3B82F6]"
            aria-label="Toggle Night Safe Preference"
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-[#EC4899]/20 bg-[#EC4899]/8 px-4 py-3">
        <p className="text-xs font-semibold text-[#EC4899]">Women&apos;s Emergency Helplines</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#A1A1AA]">
          <a href="tel:1091" className="font-semibold text-white hover:text-[#EC4899]">
            1091 — Women Helpline
          </a>
          <a href="tel:181" className="font-semibold text-white hover:text-[#EC4899]">
            181 — Domestic Violence
          </a>
        </div>
      </div>
    </Card>
  );
}
