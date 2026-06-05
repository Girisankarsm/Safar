# SafarAI — Demo Script (4 minutes)

## Pre-Demo Setup
- Browser: `http://localhost:3000`
- Demo user logged in as "Priya Sharma"
- Women Safety Mode: ON
- Backend running with seeded Hyderabad data

---

## [0:00 – 0:30] Hook — The Problem

> "Every day, millions of Indians — especially women — make a impossible choice: take the fast route or the safe route. Google Maps doesn't know the difference. SafarAI does."

*Show landing page briefly, click "Get Started"*

---

## [0:30 – 1:30] Feature 1 — Smart Journey Planner

> "Priya needs to get from HITEC City to Secunderabad after her evening class."

*Dashboard → enter source/destination → click Find Routes*

> "SafarAI shows three options — not just the fastest, but the safest and greenest too."

*Point to each card:*
- "Fastest: 42 minutes, safety 72, moderate"
- "Safest: 47 minutes, but safety 89 — well-lit, less crowded"
- "Greenest: saves 2.3 kg of CO₂, earns 58 tokens"

> "Notice the recommendation: this route is 5 minutes slower but 40% safer."

*Click "Select Route" on Safest*

---

## [1:30 – 2:30] Feature 2 — Women Safety + Live Trip

> "Priya enables Women Safety Mode. Watch what happens on the live trip."

*Live trip screen opens with map*

> "She has SOS, silent SOS, and live trip sharing with her emergency contacts."

*Click Share Trip → show link generated*

> "If she deviates from the safe route, she gets an alert."

*Briefly show safety score badge: 89/100 Safe*

---

## [2:30 – 3:15] Feature 3 — Community + Carbon Rewards

> "Safety isn't just algorithms — it's community."

*Navigate to Safety Map*

> "Users report broken lights, harassment hotspots, potholes. Others upvote and verify. This feeds directly into our safety scores."

*Tap a verified report marker*

*Click Complete Trip*

> "Trip complete! Priya saved 1.8 kg of CO₂ and earned 47 Green Tokens."

*Wallet screen animates +47 tokens*

---

## [3:15 – 3:45] Feature 4 — Leaderboard + Vision

*Show leaderboard — Priya is #1 at her college*

> "Colleges and companies compete on carbon saved. Tokens redeem for auto discounts."

> "Built on Next.js, FastAPI, and mock Hyderabad GTFS — expandable to every Indian city."

---

## [3:45 – 4:00] Close

> "SafarAI — plan safer, travel smarter, earn green. India's AI-powered safe mobility platform."

*Show logo + tagline*

---

## Backup Scenarios

| If X breaks | Do Y |
|-------------|------|
| API down | Use frontend mock fallback data |
| Map doesn't load | Show route cards without map |
| Auth fails | Click "Demo Mode" button |
| Slow route search | Pre-load route on page mount |
