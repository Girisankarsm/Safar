import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authService } from "@/services/supabase/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  async function signOut() {
    await authService.signOut();
    navigate("/login");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      <Card>
        <p className="text-lg font-bold text-white">{profile?.full_name ?? "Commuter"}</p>
        <p className="text-sm text-[#A1A1AA]">{profile?.email}</p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Stat label="Total trips" value={profile?.total_trips ?? 0} />
          <Stat label="Reports submitted" value={profile?.reports_submitted ?? 0} />
          <Stat label="Safety score" value={profile?.safety_contribution_score ?? 0} />
          <Stat label="Trust score" value={profile?.trust_score ?? 50} />
        </div>
      </Card>
      <Button variant="danger" onClick={signOut}>Sign out</Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#050505] p-3">
      <p className="text-[10px] uppercase text-[#A1A1AA]">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
