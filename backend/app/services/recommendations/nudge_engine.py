def generate_recommendations(routes: list[dict]) -> None:
    """Attach smart nudges to each route in-place."""
    if not routes:
        return

    fastest = next((r for r in routes if r["route_type"] == "fastest"), routes[0])
    safest = next((r for r in routes if r["route_type"] == "safest"), routes[0])
    greenest = next((r for r in routes if r["route_type"] == "greenest"), routes[0])

    for route in routes:
        nudges: list[str] = []
        rt = route["route_type"]

        if rt == "greenest":
            nudges.append(f"Taking public transport today saves {route['carbon_saved_kg']}kg CO₂.")
        if rt == "safest":
            diff = route["safety_score"] - fastest["safety_score"]
            if diff > 0:
                pct = min(int((diff / max(fastest["safety_score"], 1)) * 100), 60)
                nudges.append(
                    f"This route is {route['eta_minutes'] - fastest['eta_minutes']} min slower but {pct}% safer."
                )
        if rt == "fastest":
            nudges.append("Fastest option — consider safest route for evening travel.")
        if route.get("legs"):
            for leg in route["legs"]:
                if leg.get("mode") == "bus":
                    nudges.append("Bus Route may be crowded during peak hours.")
                    break

        if rt == "greenest" and greenest["reward_tokens"] > fastest.get("reward_tokens", 0):
            extra = greenest["reward_tokens"] - fastest.get("reward_tokens", 0)
            nudges.append(f"Earn {extra} extra tokens vs the fastest route.")

        cctv = route.get("cctv_nearby", 0)
        if cctv >= 3:
            nudges.append(f"{cctv} real OSM CCTV cameras near your walk segments — monitored corridor.")
        elif cctv == 0:
            nudges.append("Low CCTV coverage on this corridor — prefer safest route after dark.")

        route["recommendations"] = nudges[:3]
