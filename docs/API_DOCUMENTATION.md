# SafarAI — API Documentation

**Base URL:** `http://localhost:8000/api/v1`  
**Auth:** Bearer token (Clerk JWT) or `X-Demo-User-Id` header for hackathon demo

---

## Authentication

### GET `/auth/me`
Returns current user profile + wallet summary.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "women_safety_mode": true,
  "trust_score": 85,
  "wallet": { "balance": 340, "lifetime_co2_kg": 12.4 }
}
```

---

## Route Search

### POST `/routes/search`

**Request:**
```json
{
  "source": "HITEC City",
  "destination": "Secunderabad Station",
  "city": "hyderabad",
  "women_safety_mode": true,
  "prefer_night_safe": false
}
```

**Response 200:**
```json
{
  "routes": [
    {
      "id": "uuid",
      "route_type": "fastest",
      "eta_minutes": 42,
      "distance_km": 18.2,
      "safety_score": 72,
      "safety_label": "Moderate",
      "safety_breakdown": [
        { "factor": "Main road", "impact": 20, "description": "Major arterial road" },
        { "factor": "Peak crowd", "impact": -10, "description": "High density expected" }
      ],
      "carbon_saved_kg": 1.8,
      "reward_tokens": 47,
      "legs": [
        { "mode": "walk", "from": "HITEC City", "to": "Raidurg Metro", "duration_min": 8, "distance_km": 0.6 },
        { "mode": "metro", "from": "Raidurg", "to": "Secunderabad East", "duration_min": 28, "distance_km": 14.5 },
        { "mode": "walk", "from": "Secunderabad East", "to": "Secunderabad Station", "duration_min": 6, "distance_km": 0.5 }
      ],
      "recommendations": [
        "Taking Metro saves 1.8kg CO₂ vs driving.",
        "This route is 5 min faster but 17 points less safe than the safest option."
      ]
    }
  ]
}
```

---

## Trips

### POST `/trips/start`
```json
{ "route_id": "uuid" }
```

### PATCH `/trips/{id}/location`
```json
{ "latitude": 17.4434, "longitude": 78.3772 }
```

### POST `/trips/{id}/complete`

**Response:**
```json
{
  "tokens_earned": 47,
  "co2_saved_kg": 1.8,
  "wallet_balance": 387,
  "message": "Great green commute! You earned 47 tokens."
}
```

### GET `/trips/history`
Returns paginated trip history.

---

## Safety Reports

### GET `/safety/reports?city=hyderabad&lat=17.44&lng=78.38&radius_km=5`

### POST `/safety/reports`
```json
{
  "report_type": "broken_light",
  "description": "Street light not working near bus stop",
  "latitude": 17.4434,
  "longitude": 78.3772
}
```

### POST `/safety/reports/{id}/vote`
```json
{ "vote_type": "upvote" }
```

### POST `/safety/reports/{id}/verify`
```json
{ "vote_type": "verify" }
```

---

## SOS

### POST `/sos/trigger`
```json
{
  "trip_id": "uuid",
  "silent": false,
  "latitude": 17.4434,
  "longitude": 78.3772
}
```

**Response:**
```json
{
  "alert_id": "uuid",
  "contacts_notified": 2,
  "share_link": "https://safarai.app/trip/share/abc123"
}
```

---

## Wallet

### GET `/wallet`
### GET `/wallet/transactions`
### POST `/wallet/redeem`
```json
{ "reward_type": "auto_discount", "tokens": 250 }
```

---

## Leaderboard

### GET `/leaderboard?type=individual&period=weekly`
### GET `/leaderboard?type=college&period=monthly`
### GET `/leaderboard?type=company&period=monthly`

---

## Emergency Contacts

### GET `/emergency-contacts`
### POST `/emergency-contacts`
### DELETE `/emergency-contacts/{id}`

---

## Road Intelligence

### GET `/roads/ratings?city=hyderabad&bounds=17.3,78.3,17.5,78.5`

**Response:**
```json
{
  "segments": [
    {
      "id": "seg_001",
      "latitude": 17.44,
      "longitude": 78.38,
      "rating": 82,
      "condition": "good",
      "color": "green"
    }
  ]
}
```

---

## Settings

### PATCH `/users/settings`
```json
{
  "women_safety_mode": true,
  "night_safe_preference": true
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid request |
| 401 | Unauthorized |
| 404 | Resource not found |
| 429 | Rate limited (SOS) |
| 500 | Server error |
