/**
 * Safar — Demo Report Seeder
 * Inserts realistic community safety reports across all 4 cities.
 * Run from apps/web directory: node ../../supabase/seed-demo-reports.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qvcgasyuwisbzamnaqcy.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2Y2dhc3l1d2lzYnphbW5hcWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE2NDAyNywiZXhwIjoyMDk2NzQwMDI3fQ.D0JZN_YMCFGqm4P-59mpcx7caLTzvz9tgkKmnWD7bdk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "safar-community-seed@safar.app";

// ── helpers ──────────────────────────────────────────────────────────────────

function hoursAgo(h) {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function r(city, type, lat, lng, desc, upvotes, verifications, isVerified, createdAt) {
  return {
    city_id: city,
    report_type: type,
    latitude: lat,
    longitude: lng,
    description: desc,
    upvotes,
    verifications,
    is_verified: isVerified,
    created_at: createdAt,
  };
}

// ── demo reports ──────────────────────────────────────────────────────────────

const REPORTS = [
  // ── Chennai (12 reports) ─────────────────────────────────────────────────
  r("chennai","poor_lighting",   13.0418, 80.2341, "Dim stretch near T Nagar bus stop after 9 PM — street lamps not working",    7, 4, true,  hoursAgo(3)),
  r("chennai","harassment",      13.0732, 80.2609, "Reported near Egmore station south exit, late evening",                       5, 2, false, hoursAgo(7)),
  r("chennai","unsafe_bus_stop", 13.0827, 80.2751, "Chennai Central bus stand — poor visibility, no shelter for night travellers", 8, 5, true,  hoursAgo(14)),
  r("chennai","road_damage",     12.9496, 80.2372, "Large pothole on OMR near Sholinganallur flyover — hazardous at night",       4, 1, false, hoursAgo(22)),
  r("chennai","dangerous_crossing",13.0569,80.2598,"Anna Salai (Mount Road) uncontrolled crossing near LIC building",            9, 6, true,  hoursAgo(30)),
  r("chennai","suspicious_activity",13.0850,80.2101,"Suspicious group near Anna Nagar tower bus stop after midnight",            3, 0, false, hoursAgo(48)),
  r("chennai","construction",    13.0012, 80.2335, "Anna University gate road blocked — debris without warning signs",            2, 0, false, hoursAgo(60)),
  r("chennai","poor_lighting",   13.0337, 80.2677, "Mylapore Kapaleeshwarar Temple street — completely dark by 10 PM",           6, 3, true,  hoursAgo(72)),
  r("chennai","flooded_area",    12.9249, 80.1274, "Tambaram underpass flooded after rain — avoid this stretch",                  5, 2, true,  hoursAgo(96)),
  r("chennai","broken_light",    13.1126, 80.2344, "Perambur main road — 4 consecutive streetlights broken for 2 weeks",         7, 4, true,  hoursAgo(120)),
  r("chennai","unsafe_area",     13.1164, 80.2926, "Tondiarpet harbour road feels isolated after 8 PM",                          4, 1, false, hoursAgo(140)),
  r("chennai","stray_animal",    13.0112, 80.2335, "Pack of stray dogs near Guindy metro station exit — near school",            3, 0, false, hoursAgo(160)),

  // ── Bengaluru (11 reports) ───────────────────────────────────────────────
  r("bangalore","harassment",       12.9756, 77.6063, "MG Road metro exit — reported crowding and harassment after 9 PM",         9, 6, true,  hoursAgo(2)),
  r("bangalore","poor_lighting",    12.9352, 77.6245, "Koramangala 4th block road near Jyothi Nivas College — no street lights",  6, 3, true,  hoursAgo(11)),
  r("bangalore","road_damage",      12.8392, 77.6774, "Electronic City Phase 1 highway — large crater near Infosys gate",         5, 2, false, hoursAgo(18)),
  r("bangalore","unsafe_bus_stop",  12.9698, 77.7499, "Whitefield Hope Farm bus stop — unsafe for women commuters after dark",    7, 4, true,  hoursAgo(28)),
  r("bangalore","suspicious_activity",13.0358,77.5970,"Hebbal flyover junction — suspicious vehicles parked near underpass",      4, 1, false, hoursAgo(45)),
  r("bangalore","dangerous_crossing",12.9591,77.6974,"Marathahalli bridge — no zebra crossing, speeding vehicles",               8, 5, true,  hoursAgo(52)),
  r("bangalore","construction",     12.9116, 77.6473, "HSR Layout 27th main — open BBMP pit without barricade at night",          3, 0, false, hoursAgo(68)),
  r("bangalore","poor_lighting",    12.9166, 77.6101, "BTM Layout 2nd stage — street lights out on main road near lake",          5, 3, true,  hoursAgo(80)),
  r("bangalore","stray_animal",     12.9784, 77.6408, "Indiranagar 100 Feet Road — stray dog pack near bakery lane at night",     2, 0, false, hoursAgo(95)),
  r("bangalore","broken_light",     13.0219, 77.5671, "IISc gate road — entire stretch without working lights",                  6, 3, true,  hoursAgo(110)),
  r("bangalore","unsafe_area",      12.9770, 77.5730, "Majestic bus stand — pick-pocket reports and overcrowding after 10 PM",   10, 7, true,  hoursAgo(130)),

  // ── Trivandrum (8 reports) ───────────────────────────────────────────────
  r("trivandrum","poor_lighting",    8.5581, 76.8816, "Technopark Phase 1 gate road — no lights on the walking path after 8 PM",  6, 4, true,  hoursAgo(4)),
  r("trivandrum","suspicious_activity",8.5099,76.9655,"Palayam junction underpass — group loitering, felt unsafe",               4, 1, false, hoursAgo(16)),
  r("trivandrum","harassment",       8.5241, 76.9366, "Medical College bus stop — reported incident near evening outpatient exit", 5, 2, true,  hoursAgo(36)),
  r("trivandrum","flooded_area",     8.5009, 76.8903, "Veli road after monsoon — ankle-deep water, no warning sign",             3, 0, false, hoursAgo(60)),
  r("trivandrum","road_damage",      8.5618, 76.8794, "Kazhakkoottam bypass — pothole cluster before Technopark Phase 3 turn",   5, 2, true,  hoursAgo(72)),
  r("trivandrum","unsafe_bus_stop",  8.5221, 76.9496, "Pattom bus stop — no shelter, poor lighting, feels isolated at night",    7, 4, true,  hoursAgo(88)),
  r("trivandrum","stray_animal",     8.4827, 76.9437, "Near Padmanabhaswamy Temple west gate — dogs blocking pedestrians",       3, 1, false, hoursAgo(104)),
  r("trivandrum","dangerous_crossing",8.5153,76.9492,"Museum road crossing near Napier Museum — no traffic signal, fast traffic", 6, 3, true,  hoursAgo(118)),

  // ── Hyderabad (10 reports) ───────────────────────────────────────────────
  r("hyderabad","poor_lighting",   17.4435, 78.3772, "HITEC City metro exit road — dark stretch between station and offices",     8, 5, true,  hoursAgo(1)),
  r("hyderabad","harassment",      17.3616, 78.4747, "Charminar area — Laad Bazaar alley reported unsafe after 9 PM",            6, 3, true,  hoursAgo(9)),
  r("hyderabad","road_damage",     17.4399, 78.4983, "Secunderabad station road — broken storm drain cover hazardous to bikes",   5, 2, false, hoursAgo(20)),
  r("hyderabad","unsafe_bus_stop", 17.4150, 78.4350, "Banjara Hills Road No.12 bus stop — shelter broken, isolated at night",    7, 4, true,  hoursAgo(35)),
  r("hyderabad","suspicious_activity",17.4401,78.3489,"Gachibowli flyover underpass — reported group activity after midnight",   5, 2, true,  hoursAgo(50)),
  r("hyderabad","dangerous_crossing",17.4944,78.4121,"Kukatpally Y junction — no pedestrian signal, high-speed vehicles",        8, 5, true,  hoursAgo(64)),
  r("hyderabad","construction",    17.3685, 78.5260, "Dilsukhnagar flyover construction — debris on footpath, no night markers",  3, 0, false, hoursAgo(78)),
  r("hyderabad","broken_light",    17.4358, 78.4450, "Ameerpet metro road — entire street dark, streetlights not repaired",      7, 4, true,  hoursAgo(92)),
  r("hyderabad","flooded_area",    17.3833, 78.4011, "Golconda approach road — low-lying stretch floods after 30 min of rain",   4, 1, false, hoursAgo(115)),
  r("hyderabad","unsafe_area",     17.3842, 78.4743, "Nampally station area — pick-pocket reported near MGBS bus stand exit",    9, 6, true,  hoursAgo(132)),
];

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Safar Demo Seeder starting...\n");

  // Step 1 — ensure demo user exists in auth.users
  let userId;
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = userList?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`Demo user already exists: ${userId}`);
  } else {
    const { data: created, error: authErr } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: "SafarCommunity2025!",
      email_confirm: true,
      user_metadata: { full_name: "Safar Community" },
    });
    if (authErr) throw new Error(`Auth user creation failed: ${authErr.message}`);
    userId = created.user.id;
    console.log(`Created demo auth user: ${userId}`);
  }

  // Step 2 — upsert into public.users
  const { error: profileErr } = await supabase.from("users").upsert(
    {
      id: userId,
      email: DEMO_EMAIL,
      full_name: "Safar Community",
      city_id: "chennai",
      women_safety_mode: false,
      trust_score: 90,
      safety_contribution_score: 200,
      reports_submitted: REPORTS.length,
    },
    { onConflict: "id" }
  );
  if (profileErr) throw new Error(`Profile upsert failed: ${profileErr.message}`);
  console.log(`User profile upserted for: ${userId}`);

  // Step 3 — check if already seeded (avoid duplicates on re-run)
  const { count: existingCount } = await supabase
    .from("safety_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (existingCount && existingCount >= REPORTS.length) {
    console.log(`\n✓ Already seeded (${existingCount} reports found for demo user). Skipping.`);
    return;
  }

  // Step 4 — attach user_id and insert
  const reportsWithUser = REPORTS.map((rep) => ({ ...rep, user_id: userId }));

  const { data: inserted, error: repErr } = await supabase
    .from("safety_reports")
    .insert(reportsWithUser)
    .select("id");

  if (repErr) throw new Error(`Reports insert failed: ${repErr.message}`);

  console.log(`\n✓ Seeded ${inserted?.length ?? REPORTS.length} reports across 4 cities`);
  console.log("  Chennai:    12 reports");
  console.log("  Bengaluru:  11 reports");
  console.log("  Trivandrum:  8 reports");
  console.log("  Hyderabad:  10 reports");
  console.log("\nDone! Refresh the app to see the data.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
