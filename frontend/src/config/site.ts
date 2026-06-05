import { getCityConfig, DEFAULT_CITY } from "./cities";

const defaultCity = getCityConfig(DEFAULT_CITY);

export const siteConfig = {
  name: "SafarAI",
  tagline: "India's AI-Powered Safe Mobility Platform",
  description:
    "Plan safer, smarter, and greener multi-modal commutes. Earn Green Tokens for sustainable travel.",
  city: defaultCity.displayName,
  hackathon: "OneJourney Mobility Hackathon 2026",
};

export const navGroups = [
  {
    label: "Commute",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/plan", label: "Plan Trip", icon: "Route" },
      { href: "/routes", label: "Compare Routes", icon: "GitCompare" },
    ],
  },
  {
    label: "Safety",
    items: [
      { href: "/safety-map", label: "Safety Map", icon: "Map" },
      { href: "/report", label: "Report Issue", icon: "AlertTriangle" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { href: "/wallet", label: "Green Wallet", icon: "Wallet" },
      { href: "/leaderboard", label: "Leaderboard", icon: "Trophy" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: "User" },
      { href: "/settings", label: "Settings", icon: "Settings" },
    ],
  },
] as const;

export const quickPlaces = defaultCity.quickPlaces;
