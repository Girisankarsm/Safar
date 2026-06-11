# Legacy demo seeds (deprecated)

These files powered the original FastAPI/Next.js demo with **fake users, routes, safety zones, and hardcoded POIs**.

**Do not run in production.** Use `supabase/seed.sql` (cities only) and live OpenStreetMap + OpenRouteService data instead.

Enable fallback demo data locally with `VITE_DEMO_MODE=true` in `apps/web/.env`.

## Files

| File | Contents |
|------|----------|
| `chennai_seed.sql` | Fake Chennai safety reports |
| `hyderabad_seed.sql` | Fake Hyderabad demo user & reports |
| `update_demo_user.sql` | Fake demo user Ananya |
| `001_initial_schema.sql` | Old SafarAI schema |
| `002_safar_schema_extensions.sql` | Old schema extensions |
