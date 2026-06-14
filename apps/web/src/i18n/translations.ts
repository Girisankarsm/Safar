export type Locale = "en" | "ta" | "hi" | "ml" | "kn";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
  hi: "हिन्दी",
  ml: "മലയാളം",
  kn: "ಕನ್ನಡ",
};

type Dict = Record<string, string>;

const en: Dict = {
  "app.tagline": "Travel Smarter. Travel Safer.",
  "nav.dashboard": "Dashboard",
  "nav.routes": "Routes",
  "nav.trip": "Trip",
  "nav.safety": "Safety",
  "nav.sos": "SOS",
  "city.showing": "Showing places, maps & safety data for",
  "home.title": "Smart Route Planner",
  "home.subtitle": "Compare safer routes with live community intelligence",
  "home.from": "From",
  "home.to": "To",
  "home.search": "Compare routes",
  "home.searching": "Finding routes…",
  "home.departure": "Departure time",
  "home.timeSafety": "Time-based safety scoring",
  "settings.lowData": "Low-data mode",
  "settings.lowDataHint": "Fewer map tiles, cached routes, no report images",
  "settings.offline": "Offline cache ready",
  "settings.language": "Language",
  "trip.waitingGps": "Waiting for your GPS signal…",
  "trip.liveDot": "Your live blue dot will appear once location is granted.",
  "safety.wellLit": "Well-lit zones",
  "safety.womenOnly": "Women-safe layer",
  "emergency.helplines": "National helplines",
  "routes.multimodal": "Multi-modal route",
  "routes.safarPick": "Safar Pick",
  "common.install": "Install Safar app",
};

const ta: Dict = {
  ...en,
  "nav.dashboard": "டாஷ்போர்டு",
  "nav.routes": "வழிகள்",
  "nav.trip": "பயணம்",
  "nav.safety": "பாதுகாப்பு",
  "nav.sos": "அவசரம்",
  "home.title": "ஸ்மார்ட் வழி திட்டமிடல்",
  "home.search": "வழிகளை ஒப்பிடு",
  "home.searching": "வழிகள் தேடப்படுகிறது…",
  "settings.lowData": "குறைந்த டேட்டா முறை",
  "settings.language": "மொழி",
  "emergency.helplines": "தேசிய உதவி எண்கள்",
};

const hi: Dict = {
  ...en,
  "nav.dashboard": "डैशबोर्ड",
  "nav.routes": "मार्ग",
  "nav.trip": "यात्रा",
  "nav.safety": "सुरक्षा",
  "nav.sos": "आपातकाल",
  "home.title": "स्मार्ट रूट प्लानर",
  "home.search": "मार्ग तुलना करें",
  "home.searching": "मार्ग खोज रहे हैं…",
  "settings.lowData": "कम डेटा मोड",
  "settings.language": "भाषा",
  "emergency.helplines": "राष्ट्रीय हेल्पलाइन",
};

const ml: Dict = {
  ...en,
  "nav.dashboard": "ഡാഷ്ബോർഡ്",
  "nav.routes": "മാർഗങ്ങൾ",
  "nav.trip": "യാത്ര",
  "nav.safety": "സുരക്ഷ",
  "nav.sos": "അടിയന്തരം",
  "home.search": "മാർഗങ്ങൾ താരതമ്യം ചെയ്യുക",
  "settings.language": "ഭാഷ",
};

const kn: Dict = {
  ...en,
  "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  "nav.routes": "ಮಾರ್ಗಗಳು",
  "nav.trip": "ಪ್ರಯಾಣ",
  "nav.safety": "ಸುರಕ್ಷತೆ",
  "nav.sos": "ತುರ್ತು",
  "home.search": "ಮಾರ್ಗಗಳನ್ನು ಹೋಲಿಸಿ",
  "settings.language": "ಭಾಷೆ",
};

export const TRANSLATIONS: Record<Locale, Dict> = { en, ta, hi, ml, kn };

export function translate(locale: Locale, key: string): string {
  return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key;
}
