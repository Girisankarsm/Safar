/**
 * ORS Proxy — Supabase Edge Function
 *
 * Proxies requests to OpenRouteService so the API key stays server-side.
 * The client sends the same JSON body it would have sent to ORS directly,
 * and this function forwards it with the server-side key attached.
 *
 * Deploy: supabase functions deploy ors-proxy
 * Set secret: supabase secrets set ORS_API_KEY=<your-key>
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ORS_BASE = "https://api.openrouteservice.org";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ORS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ORS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") ?? "/v2/directions/driving-car/geojson";
    const body = req.method !== "GET" ? await req.text() : undefined;

    const orsRes = await fetch(`${ORS_BASE}${path}`, {
      method: req.method,
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json, application/geo+json",
      },
      body,
    });

    const data = await orsRes.text();

    return new Response(data, {
      status: orsRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": orsRes.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
