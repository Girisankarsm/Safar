/**
 * Overpass Proxy — Supabase Edge Function
 *
 * Proxies requests to the Overpass API (OSM) to prevent CORS issues and
 * to rate-limit / cache at the edge rather than from each browser.
 *
 * Deploy: supabase functions deploy overpass-proxy
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = (await req.json()) as { query: string };
    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = new URLSearchParams({ data: query });
    const ovRes = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await ovRes.text();

    return new Response(data, {
      status: ovRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": ovRes.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
