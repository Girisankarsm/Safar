"use client";

import { useEffect, useState } from "react";
import { Shield, Moon, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { api } from "@/lib/api/client";
import { useAppStore } from "@/lib/stores/app-store";

export default function SettingsPage() {
  const { womenSafetyMode, nightSafeMode, setWomenSafetyMode, setNightSafeMode } = useAppStore();
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string; relationship?: string }>>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getContacts().then((r) => setContacts(r.contacts)).catch(() => {});
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await api.updateSettings({
        women_safety_mode: womenSafetyMode,
        night_safe_preference: nightSafeMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title="Settings"
        description="Customize your safety preferences and emergency contacts"
      />

      <Section title="Safety Preferences">
        <div className="space-y-3">
          <Toggle
            checked={womenSafetyMode}
            onChange={setWomenSafetyMode}
            label="Women Safety Mode"
            description="Prioritize well-lit, verified safe routes"
            icon={<Shield className="h-5 w-5 text-pink-600" />}
          />
          <Toggle
            checked={nightSafeMode}
            onChange={setNightSafeMode}
            label="Night-Safe Routes"
            description="24/7 transport and safer last-mile options"
            icon={<Moon className="h-5 w-5 text-indigo-600" />}
          />
        </div>
        <Button className="mt-4 w-full" onClick={saveSettings} disabled={saving}>
          {saved ? "Settings Saved!" : saving ? "Saving..." : "Save Settings"}
        </Button>
      </Section>

      <Section title="Emergency Contacts">
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {contacts.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted">No emergency contacts configured</p>
            )}
            {contacts.map((c) => (
              <div key={c.phone} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">{c.relationship}</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{c.phone}</p>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </PageContainer>
  );
}
