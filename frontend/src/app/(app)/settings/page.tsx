"use client";

import { useEffect, useState } from "react";
import { Shield, Moon, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";

export default function SettingsPage() {
  const { womenSafetyMode, nightSafeMode, setWomenSafetyMode, setNightSafeMode } = useAppStore();
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string; relationship?: string }>>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getContacts().then((r) => setContacts(r.contacts)).catch(() => {});
  }, []);

  async function saveSettings() {
    await api.updateSettings({
      women_safety_mode: womenSafetyMode,
      night_safe_preference: nightSafeMode,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted">Customize your safety preferences</p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold">Safety Preferences</h2>
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> Women Safety Mode</span>
          <input type="checkbox" checked={womenSafetyMode} onChange={(e) => setWomenSafetyMode(e.target.checked)} className="h-5 w-5 accent-primary" />
        </label>
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><Moon className="h-4 w-4" /> Night-Safe Routes</span>
          <input type="checkbox" checked={nightSafeMode} onChange={(e) => setNightSafeMode(e.target.checked)} className="h-5 w-5 accent-primary" />
        </label>
        <button onClick={saveSettings} className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white">
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Phone className="h-5 w-5" /> Emergency Contacts</h2>
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.phone} className="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-muted">{c.relationship}</p>
              </div>
              <p>{c.phone}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
