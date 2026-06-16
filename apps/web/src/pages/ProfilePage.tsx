import { PageHeader } from "@/components/layout/page-header";
import { TrustBadges } from "@/components/profile/trust-badges";
import { WomenSafetySettings } from "@/components/profile/women-safety-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-page-scroll mx-auto max-w-[900px] space-y-6 px-5 py-6 md:px-8 lg:py-8">
      <PageHeader title="Profile" subtitle="Your Safar account, trust score, and safety contributions." />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? "Profile"}
                className="h-16 w-16 rounded-2xl border border-[var(--border)] object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[#18181d] text-xl font-bold text-white">
                {(profile?.full_name ?? profile?.email ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-white">{profile?.full_name ?? "Commuter"}</p>
              <p className="text-sm text-[#A1A1AA]">{profile?.email ?? "No email on file"}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="Total trips" value={profile?.total_trips ?? 0} />
            <Stat label="Reports" value={profile?.reports_submitted ?? 0} />
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <TrustBadges profile={profile} />
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <WomenSafetySettings />
      </motion.div>

      <Button variant="danger" onClick={handleSignOut} className="w-full" size="lg">
        Sign out
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
