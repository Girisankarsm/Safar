-- Fix duplicate demo users (Priya on ...0001 + Ananya on ...0002)
-- Run in Supabase SQL Editor as ONE script

BEGIN;

-- Remove duplicate Ananya user (...0002) created by chennai_seed.sql
DELETE FROM community_votes
WHERE report_id IN (
  SELECT id FROM safety_reports WHERE user_id = 'a0000000-0000-0000-0000-000000000002'
);

DELETE FROM safety_reports WHERE user_id = 'a0000000-0000-0000-0000-000000000002';
DELETE FROM token_transactions WHERE wallet_id IN (
  SELECT id FROM carbon_wallets WHERE user_id = 'a0000000-0000-0000-0000-000000000002'
);
DELETE FROM carbon_wallets WHERE user_id = 'a0000000-0000-0000-0000-000000000002';
DELETE FROM emergency_contacts WHERE user_id = 'a0000000-0000-0000-0000-000000000002';
DELETE FROM users WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- Now safe to update the main demo user (...0001) — no clerk_id conflict
UPDATE users SET
  clerk_id = 'demo_user_ananya',
  email = 'ananya@annauniv.edu',
  name = 'Ananya Krishnan',
  college = 'Anna University Chennai',
  trust_score = 88,
  city = 'chennai'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Ensure wallet exists for demo user
INSERT INTO carbon_wallets (user_id, balance, lifetime_tokens, lifetime_co2_kg, green_trips_count)
VALUES ('a0000000-0000-0000-0000-000000000001', 340, 520, 12.40, 28)
ON CONFLICT (user_id) DO UPDATE SET
  balance = 340,
  lifetime_tokens = 520,
  lifetime_co2_kg = 12.40,
  green_trips_count = 28;

COMMIT;
