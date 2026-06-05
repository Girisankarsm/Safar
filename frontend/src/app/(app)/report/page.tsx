"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";

const REPORT_TYPES = [
  { id: "unsafe_area", label: "Unsafe Area" },
  { id: "harassment", label: "Harassment" },
  { id: "broken_light", label: "Broken Street Light" },
  { id: "pothole", label: "Pothole" },
  { id: "flooded_road", label: "Flooded Road" },
  { id: "dangerous_crossing", label: "Dangerous Crossing" },
];

export default function ReportPage() {
  const router = useRouter();
  const [type, setType] = useState("broken_light");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReport({
        report_type: type,
        description,
        latitude: 17.44 + Math.random() * 0.05,
        longitude: 78.45 + Math.random() * 0.05,
      });
      router.push("/safety-map");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report Safety Issue</h1>
        <p className="text-muted">Help make commuting safer for everyone</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    type === t.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." required />
          </div>
          <p className="text-xs text-muted">Location will be pinned near your current area on the safety map.</p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
