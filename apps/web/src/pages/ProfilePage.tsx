import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-white">Profile</h1>
      <Card>
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? "Profile"}
              className="h-14 w-14 rounded-full border border-[#262626] object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-lg font-bold text-white">
              {(profile?.full_name ?? profile?.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-white">{profile?.full_name ?? "Commuter"}</p>
            <p className="text-sm text-[#A1A1AA]">{profile?.email ?? "No email on file"}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Stat label="Total trips" value={profile?.total_trips ?? 0} />
          <Stat label="Reports submitted" value={profile?.reports_submitted ?? 0} />
          <Stat label="Safety score" value={profile?.safety_contribution_score ?? 0} />
          <Stat label="Trust score" value={profile?.trust_score ?? 50} />
        </div>
      </Card>
      <Button variant="danger" onClick={handleSignOut}>
        Sign out
      </Button>
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
