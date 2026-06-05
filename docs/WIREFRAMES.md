# SafarAI — UI Wireframes (ASCII)

## Design Tokens

| Token | Value |
|-------|-------|
| Primary | `#2563EB` |
| Accent (Green) | `#22C55E` |
| Danger | `#EF4444` |
| Background | `#F8FAFC` |
| Card | `rgba(255,255,255,0.8)` + blur |

---

## 1. Landing Page

```
┌─────────────────────────────────────────────┐
│  [SafarAI logo]          [Login] [Get Started]│
├─────────────────────────────────────────────┤
│                                             │
│     India's AI-Powered                      │
│     Safe Mobility Platform                  │
│                                             │
│     Plan safer. Travel smarter.             │
│     Earn green rewards.                     │
│                                             │
│     [Start Planning →]  [See Demo]          │
│                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 🛡️   │ │ 🗺️   │ │ 🌱   │ │ 👥   │       │
│  │Safety│ │Multi │ │Green │ │Community│    │
│  │Score │ │Modal │ │Tokens│ │Reports │    │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│                                             │
│  [Hero map animation - Hyderabad]           │
└─────────────────────────────────────────────┘
```

## 2. Dashboard

```
┌─────────────────────────────────────────────┐
│ ☰  SafarAI                    🔔  [Avatar]  │
├─────────────────────────────────────────────┤
│ Good evening, Priya 👋                      │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 🔍 Where do you want to go?             ││
│ │ From: HITEC City                        ││
│ │ To:   Secunderabad Station              ││
│ │         [Find Routes →]                 ││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ 340      │ │ 12.4 kg  │ │ 28       │     │
│ │ Tokens   │ │ CO₂ Saved│ │ Green    │     │
│ │          │ │          │ │ Trips    │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│                                             │
│ 💡 "Taking Metro saves 1.8kg CO₂ today"    │
│                                             │
│ Recent Trips          Community Alerts →   │
│ ┌─────────────────────────────────────────┐│
│ │ 🚇 HITEC → Secunderabad  +47 tokens    ││
│ └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│ [Home] [Plan] [Map] [Wallet] [Profile]     │
└─────────────────────────────────────────────┘
```

## 3. Route Comparison

```
┌─────────────────────────────────────────────┐
│ ← Route Options                             │
├─────────────────────────────────────────────┤
│ HITEC City → Secunderabad Station           │
│                                             │
│ ┌─ FASTEST ─────────────────────────────┐ │
│ │ ⏱ 42 min  📏 18.2 km                   │ │
│ │ 🛡 72/100 Moderate  🌱 1.8kg  🪙 47    │ │
│ │ [Select Route]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ SAFEST ★ ────────────────────────────┐ │
│ │ ⏱ 47 min  📏 17.8 km                   │ │
│ │ 🛡 89/100 Safe  🌱 1.6kg  🪙 42        │ │
│ │ ✓ Well-lit path  ✓ Less crowded        │ │
│ │ [Select Route]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ GREENEST ────────────────────────────┐ │
│ │ ⏱ 52 min  📏 19.1 km                   │ │
│ │ 🛡 78/100 Safe  🌱 2.3kg  🪙 58        │ │
│ │ [Select Route]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Map Preview with 3 polylines]              │
└─────────────────────────────────────────────┘
```

## 4. Live Trip Screen

```
┌─────────────────────────────────────────────┐
│ ● LIVE TRIP                    [Women Mode] │
├─────────────────────────────────────────────┤
│                                             │
│         [Full-screen map]                   │
│         Blue route line                     │
│         Current position dot                │
│                                             │
├─────────────────────────────────────────────┤
│ Next: Raidurg Metro (8 min walk)            │
│ Safety: 89/100 Safe                         │
│                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ SOS │ │Silent│ │Share│ │End  │           │
│ │ 🔴  │ │ SOS │ │ 📍  │ │ ✓  │           │
│ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                             │
│ Tokens earning: +12 so far                  │
└─────────────────────────────────────────────┘
```

## 5. Safety Map

```
┌─────────────────────────────────────────────┐
│ Safety Map                    [+ Report]    │
├─────────────────────────────────────────────┤
│ Filters: [All] [Harassment] [Lighting] [🕳️]│
│                                             │
│    [Map with markers]                       │
│    🔴 Harassment  🟡 Broken light           │
│    🟢 Verified safe  🟠 Pothole             │
│                                             │
│ Road overlay: Green/Yellow/Red segments     │
├─────────────────────────────────────────────┤
│ Selected: Broken street light               │
│ 📍 Necklace Road  ↑ 12  ✓ 3 verified      │
│ [Upvote] [Verify]                           │
└─────────────────────────────────────────────┘
```

## 6. Wallet

```
┌─────────────────────────────────────────────┐
│ Green Token Wallet                          │
├─────────────────────────────────────────────┤
│                                             │
│         🪙 340                              │
│      Available Tokens                       │
│                                             │
│ Lifetime: 12.4 kg CO₂ · 28 green trips     │
│                                             │
│ Redeem Rewards                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 🛺 Auto discount (₹30)     250 tokens  │ │
│ │ [Redeem]                                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Transaction History                         │
│ +47  Metro trip HITEC→Secunderabad  Today   │
│ +32  Bus route 25 commute         Yesterday │
└─────────────────────────────────────────────┘
```

## 7. Leaderboard

```
┌─────────────────────────────────────────────┐
│ Leaderboard                                 │
│ [Individual] [Colleges] [Companies]         │
├─────────────────────────────────────────────┤
│ 🥇 1. Priya Sharma      340 tokens  12.4kg │
│ 🥈 2. Rahul K.          298 tokens  10.1kg │
│ 🥉 3. Anitha M.         276 tokens   9.8kg │
│    4. Dev Team Alpha    245 tokens   8.2kg │
│                                             │
│ Your rank: #1 in CBIT College 🎉            │
└─────────────────────────────────────────────┘
```
