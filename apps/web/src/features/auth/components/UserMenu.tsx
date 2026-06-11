import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../useAuth";

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full border border-[#262626] object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#262626] bg-[#171717] text-xs font-bold text-white">
      {initials || "U"}
    </div>
  );
}

export function UserMenu({ className }: { className?: string }) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = profile?.full_name ?? profile?.email?.split("@")[0] ?? "User";
  const email = profile?.email ?? "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    window.location.href = "/";
  }

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#111111] px-2 py-1.5 text-sm font-semibold text-white transition hover:border-[#3B82F6]/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar src={profile?.avatar_url} name={name} />
        <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
        <ChevronDown className={cn("h-4 w-4 text-[#A1A1AA] transition", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#262626] bg-[#111111] shadow-xl"
            role="menu"
          >
            <div className="border-b border-[#262626] px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar src={profile?.avatar_url} name={name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{name}</p>
                  <p className="truncate text-xs text-[#A1A1AA]">{email || "No email on file"}</p>
                </div>
              </div>
            </div>
            <div className="p-1">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#E4E4E7] transition hover:bg-[#171717]"
                role="menuitem"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#FCA5A5] transition hover:bg-[#171717]"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
