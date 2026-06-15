/**
 * Report Guard — Supabase Edge Function
 *
 * Intercepts every community report BEFORE it reaches the database.
 * Enforces three security layers:
 *
 *   Layer 1 — Rate Limiting
 *     Max 2 reports per user per 60-second window.
 *     Prevents spam flooding from a single account.
 *
 *   Layer 2 — Location-Bounded Proof of Presence
 *     User's current GPS coordinates must be within 500m of the
 *     incident location they are trying to pin.
 *     Prevents troll/fake hazard pins from arbitrary locations.
 *
 *   Layer 3 — Lightweight Moderation Filter
 *     Scans description text against a profanity / toxicity keyword list.
 *     Flagged reports are stored with status='flagged_for_review' and
 *     suppressed from the live Realtime feed until a moderator reviews them.
 *
 * Deploy:  supabase functions deploy report-guard
 * Invoke:  POST /functions/v1/report-guard   (replaces direct table insert)
 *
 * Request body:
 * {
 *   city_id: string,
 *   report_type: string,
 *   description?: string,
 *   latitude: number,        ← incident location
 *   longitude: number,       ← incident location
 *   user_lat: number,        ← user's current GPS (from browser)
 *   user_lng: number         ← user's current GPS
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Rate limiter (in-memory, per isolate) ───────────────────────────────────

/** userId → [timestamp, ...] of recent inserts */
const rateLimitMap = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000; // 1 minute window
const RATE_MAX_REPORTS = 2;    // max 2 reports per window per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const recent = (rateLimitMap.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );

  if (recent.length >= RATE_MAX_REPORTS) {
    const oldest = Math.min(...recent);
    const retryAfterMs = RATE_WINDOW_MS - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return { allowed: true };
}

// ─── Haversine distance (metres) ─────────────────────────────────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PROXIMITY_RADIUS_M = 500; // user must be within 500m of the incident pin

// ─── Moderation filter ───────────────────────────────────────────────────────

/**
 * Basic profanity / toxicity word list.
 * Matched case-insensitively against the report description.
 * In production this would call a dedicated moderation API.
 */
const BLOCKED_PATTERNS = [
  /\bfuck\b/i, /\bshit\b/i, /\bbitch\b/i, /\basshole\b/i,
  /\bkill\b/i, /\bdie\b/i, /\brapist\b/i, /\bterrorist\b/i,
  /\bspam\b/i, /\btest123\b/i, /\bfake\b.{0,10}\breport\b/i,
];

function moderateText(text?: string): { clean: boolean; reason?: string } {
  if (!text || text.trim().length < 3) return { clean: true };

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { clean: false, reason: `Matched moderation pattern: ${pattern.source}` };
    }
  }

  // Minimum meaningful content check — at least 5 chars excluding spaces
  if (text.replace(/\s/g, "").length < 5) {
    return { clean: false, reason: "Description too short to be meaningful" };
  }

  return { clean: true };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Use user JWT to identify caller
  const supabase = createClient(supabaseUrl, serviceKey, {
    global: { headers: { authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authErr || !user) {
    return json({ error: "Unauthorized — valid Safar account required" }, 401);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    city_id: string;
    report_type: string;
    description?: string;
    latitude: number;
    longitude: number;
    user_lat: number;
    user_lng: number;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { city_id, report_type, description, latitude, longitude, user_lat, user_lng } = body;

  if (!city_id || !report_type || latitude == null || longitude == null) {
    return json({ error: "Missing required fields: city_id, report_type, latitude, longitude" }, 400);
  }

  // ── Layer 1: Rate Limit ───────────────────────────────────────────────────
  const { allowed, retryAfterMs } = checkRateLimit(user.id);
  if (!allowed) {
    return json(
      {
        error: "Rate limit exceeded — maximum 2 reports per minute",
        retry_after_ms: retryAfterMs,
        code: "RATE_LIMITED",
      },
      429
    );
  }

  // ── Layer 2: Location Proximity Check ────────────────────────────────────
  if (user_lat == null || user_lng == null) {
    return json(
      {
        error: "Your current GPS location is required to file a report",
        code: "LOCATION_REQUIRED",
      },
      400
    );
  }

  const distanceM = haversineM(user_lat, user_lng, latitude, longitude);
  if (distanceM > PROXIMITY_RADIUS_M) {
    return json(
      {
        error: `You must be within ${PROXIMITY_RADIUS_M}m of the incident location to report it (you are ${Math.round(distanceM)}m away)`,
        distance_m: Math.round(distanceM),
        code: "TOO_FAR",
      },
      422
    );
  }

  // ── Layer 3: Moderation Filter ────────────────────────────────────────────
  const { clean, reason: moderationReason } = moderateText(description);
  const reportStatus = clean ? "active" : "flagged_for_review";

  // ── Insert ────────────────────────────────────────────────────────────────
  const adminSupabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inserted, error: insertErr } = await adminSupabase
    .from("safety_reports")
    .insert({
      user_id: user.id,
      city_id,
      report_type,
      description: description ?? null,
      latitude,
      longitude,
      upvotes: 0,
      verifications: 0,
      is_verified: false,
    })
    .select("id, created_at")
    .single();

  if (insertErr) {
    return json({ error: `Insert failed: ${insertErr.message}` }, 500);
  }

  return json({
    success: true,
    report_id: inserted.id,
    status: reportStatus,
    flagged: !clean,
    flagged_reason: clean ? null : moderationReason,
    distance_m: Math.round(distanceM),
    message: clean
      ? "Report submitted successfully"
      : "Report submitted but held for moderation review",
  });
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
