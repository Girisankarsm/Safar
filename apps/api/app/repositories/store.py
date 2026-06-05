"""Supabase PostgreSQL store with in-memory fallback for demo."""

import secrets
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app.core.config import settings
from app.core import database as db
from app.models.models import (
    CarbonWallet,
    EmergencyContact,
    LeaderboardEntry,
    Route,
    SafetyReport,
    SOSAlert,
    TokenTransaction,
    Trip,
    User,
)
from app.services.safety.geo import haversine_m

_db_ready = False
_request_user_id: ContextVar[str | None] = ContextVar("request_user_id", default=None)
_mem: dict[str, Any] = {
    "routes": {},
    "trips": {},
    "reports": [],
    "sos": [],
    "users": {},
    "wallets": {},
    "wallet": {"balance": 340, "lifetime_tokens": 520, "lifetime_co2_kg": 12.4, "green_trips_count": 28},
    "transactions": [],
}

DEMO_USER = {
    "id": settings.demo_user_id,
    "clerk_id": "demo_user_ananya",
    "email": "ananya@annauniv.edu",
    "name": "Ananya Krishnan",
    "college": "Anna University Chennai",
    "women_safety_mode": True,
    "night_safe_preference": True,
    "trust_score": 88,
    "city": "chennai",
}


def set_db_ready(ready: bool) -> None:
    global _db_ready
    _db_ready = ready


def is_db_active() -> bool:
    return _db_ready and db.SessionLocal is not None


def _uid(s: str) -> uuid.UUID:
    return uuid.UUID(s)


def set_request_user(user_id: str | None) -> None:
    _request_user_id.set(user_id)


def clear_request_user() -> None:
    _request_user_id.set(None)


def _effective_user_id() -> str:
    return _request_user_id.get() or settings.demo_user_id


def _user_to_dict(user: User, *, demo: bool = False) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "college": user.college,
        "avatar_url": user.avatar_url,
        "women_safety_mode": user.women_safety_mode,
        "night_safe_preference": user.night_safe_preference,
        "trust_score": user.trust_score,
        "city": user.city,
        "demo": demo,
    }


def upsert_user_from_auth(payload: dict) -> dict:
    auth_id = payload["sub"]
    email = payload.get("email") or f"{auth_id}@users.safar.ai"
    meta = payload.get("user_metadata") or {}
    name = meta.get("full_name") or meta.get("name") or email.split("@")[0].replace(".", " ").title()
    avatar_url = meta.get("avatar_url") or meta.get("picture")

    if is_db_active():
        with db.SessionLocal() as session:
            row = session.scalar(select(User).where(User.clerk_id == auth_id))
            if row:
                row.email = email
                row.name = name
                if avatar_url:
                    row.avatar_url = avatar_url
                session.commit()
                session.refresh(row)
                return _user_to_dict(row)

            uid = uuid.uuid4()
            row = User(
                id=uid,
                clerk_id=auth_id,
                email=email,
                name=name,
                avatar_url=avatar_url,
                women_safety_mode=True,
                night_safe_preference=True,
                trust_score=50,
                city=settings.default_city,
            )
            session.add(row)
            session.add(
                CarbonWallet(
                    user_id=uid,
                    balance=0,
                    lifetime_tokens=0,
                    lifetime_co2_kg=0,
                    green_trips_count=0,
                )
            )
            session.commit()
            session.refresh(row)
            return _user_to_dict(row)

    mem_user = _mem["users"].get(auth_id)
    if mem_user:
        mem_user.update({"email": email, "name": name, "avatar_url": avatar_url})
        return mem_user

    uid = str(uuid.uuid4())
    mem_user = {
        "id": uid,
        "clerk_id": auth_id,
        "email": email,
        "name": name,
        "avatar_url": avatar_url,
        "college": None,
        "women_safety_mode": True,
        "night_safe_preference": True,
        "trust_score": 50,
        "city": settings.default_city,
        "demo": False,
    }
    _mem["users"][auth_id] = mem_user
    _mem["wallets"][uid] = {
        "balance": 0,
        "lifetime_tokens": 0,
        "lifetime_co2_kg": 0.0,
        "green_trips_count": 0,
    }
    return mem_user


def get_current_user() -> dict:
    uid = _effective_user_id()
    if is_db_active():
        with db.SessionLocal() as session:
            user = session.get(User, _uid(uid))
            if user:
                return _user_to_dict(user, demo=uid == settings.demo_user_id)
    if uid != settings.demo_user_id:
        for mem_user in _mem["users"].values():
            if mem_user["id"] == uid:
                return mem_user
    demo = DEMO_USER.copy()
    demo["demo"] = True
    return demo


def update_user_prefs(prefs: dict) -> dict:
    user = get_current_user()
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.get(User, _uid(_effective_user_id()))
            if row:
                for k, v in prefs.items():
                    if v is not None and hasattr(row, k):
                        setattr(row, k, v)
                session.commit()
                session.refresh(row)
                return get_current_user()
    for k, v in prefs.items():
        if v is not None:
            DEMO_USER[k] = v
            user[k] = v
    return user


def save_routes(routes: list[dict]) -> list[dict]:
    saved = []
    for r in routes:
        rid = str(uuid.uuid4())
        row = {**r, "id": rid, "created_at": datetime.utcnow().isoformat()}
        if is_db_active():
            with db.SessionLocal() as session:
                session.add(Route(
                    id=_uid(rid),
                    route_type=r["route_type"],
                    source=r["source"],
                    destination=r["destination"],
                    source_lat=r.get("source_lat"),
                    source_lng=r.get("source_lng"),
                    dest_lat=r.get("dest_lat"),
                    dest_lng=r.get("dest_lng"),
                    legs=r["legs"],
                    safety_score=r.get("safety_score"),
                    safety_label=r.get("safety_label"),
                    safety_breakdown=r.get("safety_breakdown", []),
                    distance_km=r.get("distance_km"),
                    eta_minutes=r.get("eta_minutes"),
                    carbon_saved_kg=r.get("carbon_saved_kg"),
                    reward_tokens=r.get("reward_tokens"),
                    recommendations=r.get("recommendations", []),
                    city=r.get("city", "chennai"),
                ))
                session.commit()
        else:
            _mem["routes"][rid] = row
        saved.append(row)
    return saved


def get_route(route_id: str) -> dict | None:
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.get(Route, _uid(route_id))
            if not row:
                return None
            return _route_dict(row)
    return _mem["routes"].get(route_id)


def _route_dict(row: Route) -> dict:
    return {
        "id": str(row.id),
        "route_type": row.route_type,
        "source": row.source,
        "destination": row.destination,
        "source_lat": float(row.source_lat) if row.source_lat else None,
        "source_lng": float(row.source_lng) if row.source_lng else None,
        "dest_lat": float(row.dest_lat) if row.dest_lat else None,
        "dest_lng": float(row.dest_lng) if row.dest_lng else None,
        "legs": row.legs,
        "safety_score": row.safety_score,
        "safety_label": row.safety_label,
        "safety_breakdown": row.safety_breakdown,
        "distance_km": float(row.distance_km) if row.distance_km else None,
        "eta_minutes": row.eta_minutes,
        "carbon_saved_kg": float(row.carbon_saved_kg) if row.carbon_saved_kg else None,
        "reward_tokens": row.reward_tokens,
        "recommendations": row.recommendations,
        "city": row.city,
    }


def start_trip(route_id: str) -> dict | None:
    route = get_route(route_id)
    if not route:
        return None
    tid = str(uuid.uuid4())
    share = secrets.token_urlsafe(16)
    trip = {
        "id": tid,
        "user_id": _effective_user_id(),
        "route_id": route_id,
        "status": "active",
        "route": route,
        "share_token": share,
        "current_lat": route.get("source_lat"),
        "current_lng": route.get("source_lng"),
        "co2_saved_kg": route.get("carbon_saved_kg"),
        "tokens_earned": route.get("reward_tokens"),
        "started_at": datetime.utcnow().isoformat(),
        "check_ins": [],
    }
    if is_db_active():
        with db.SessionLocal() as session:
            session.add(Trip(
                id=_uid(tid),
                user_id=_uid(_effective_user_id()),
                route_id=_uid(route_id),
                status="active",
                share_token=share,
                current_lat=route.get("source_lat"),
                current_lng=route.get("source_lng"),
                co2_saved_kg=route.get("carbon_saved_kg"),
                tokens_earned=route.get("reward_tokens"),
            ))
            session.commit()
    else:
        _mem["trips"][tid] = trip
    return trip


def get_trip(trip_id: str) -> dict | None:
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.get(Trip, _uid(trip_id))
            if not row:
                return None
            route = get_route(str(row.route_id))
            return {
                "id": str(row.id),
                "user_id": str(row.user_id),
                "route_id": str(row.route_id),
                "status": row.status,
                "route": route,
                "share_token": row.share_token,
                "current_lat": float(row.current_lat) if row.current_lat else None,
                "current_lng": float(row.current_lng) if row.current_lng else None,
                "co2_saved_kg": float(row.co2_saved_kg) if row.co2_saved_kg else None,
                "tokens_earned": row.tokens_earned,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "completed_at": row.completed_at.isoformat() if row.completed_at else None,
                "check_ins": [],
            }
    return _mem["trips"].get(trip_id)


def get_trip_by_share(share_token: str) -> dict | None:
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.scalar(select(Trip).where(Trip.share_token == share_token))
            if row:
                return get_trip(str(row.id))
    for t in _mem["trips"].values():
        if t.get("share_token") == share_token:
            return t
    return None


def update_trip_location(trip_id: str, lat: float, lng: float) -> dict | None:
    trip = get_trip(trip_id)
    if not trip or trip["status"] != "active":
        return None
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.get(Trip, _uid(trip_id))
            if row:
                row.current_lat = lat
                row.current_lng = lng
                path = list(row.path_coordinates or [])
                path.append({"lat": lat, "lng": lng, "t": datetime.utcnow().isoformat()})
                row.path_coordinates = path
                session.commit()
    else:
        trip["current_lat"] = lat
        trip["current_lng"] = lng
        trip.setdefault("path", []).append({"lat": lat, "lng": lng})
        _mem["trips"][trip_id] = trip
    return get_trip(trip_id)


def check_in_trip(trip_id: str, lat: float, lng: float, mode: str) -> dict | None:
    trip = get_trip(trip_id)
    if not trip:
        return None
    entry = {"lat": lat, "lng": lng, "mode": mode, "at": datetime.utcnow().isoformat(), "verified": True}
    if not is_db_active():
        trip.setdefault("check_ins", []).append(entry)
        _mem["trips"][trip_id] = trip
    return {"trip_id": trip_id, "check_in": entry, "green_miles_bonus": 5}


def complete_trip(trip_id: str) -> dict | None:
    trip = get_trip(trip_id)
    if not trip:
        return None
    tokens = trip.get("tokens_earned") or 0
    co2 = trip.get("co2_saved_kg") or 0
    if is_db_active():
        with db.SessionLocal() as session:
            row = session.get(Trip, _uid(trip_id))
            if row:
                row.status = "completed"
                row.completed_at = datetime.utcnow()
                session.commit()
            wallet = session.scalar(select(CarbonWallet).where(CarbonWallet.user_id == _uid(_effective_user_id())))
            if wallet:
                wallet.balance += tokens
                wallet.lifetime_tokens += tokens
                wallet.lifetime_co2_kg = float(wallet.lifetime_co2_kg or 0) + float(co2)
                wallet.green_trips_count += 1
                session.add(TokenTransaction(
                    wallet_id=wallet.id,
                    trip_id=_uid(trip_id),
                    type="earn",
                    amount=tokens,
                    description="Trip completed — GreenMiles earned",
                ))
                session.commit()
    else:
        trip["status"] = "completed"
        trip["completed_at"] = datetime.utcnow().isoformat()
        _mem["trips"][trip_id] = trip
        w = _mem["wallet"]
        w["balance"] += tokens
        w["lifetime_tokens"] += tokens
        w["lifetime_co2_kg"] += float(co2)
        w["green_trips_count"] += 1
    return get_trip(trip_id)


def create_report(data: dict) -> dict:
    rid = str(uuid.uuid4())
    report = {
        "id": rid,
        "user_id": _effective_user_id(),
        **data,
        "upvotes": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    if is_db_active():
        with db.SessionLocal() as session:
            session.add(SafetyReport(
                id=_uid(rid),
                user_id=_uid(_effective_user_id()),
                report_type=data["report_type"],
                description=data.get("description"),
                latitude=data["latitude"],
                longitude=data["longitude"],
                city=data.get("city", "chennai"),
            ))
            session.commit()
    else:
        _mem["reports"].append(report)
    return report


def reports_near(lat: float, lng: float, city: str, radius_km: float = 1.0) -> list[dict]:
    out = []
    if is_db_active():
        with db.SessionLocal() as session:
            rows = session.scalars(select(SafetyReport).where(SafetyReport.city == city).limit(200)).all()
            for r in rows:
                d = haversine_m(lat, lng, float(r.latitude), float(r.longitude)) / 1000
                if d <= radius_km:
                    out.append({
                        "id": str(r.id),
                        "report_type": r.report_type,
                        "latitude": float(r.latitude),
                        "longitude": float(r.longitude),
                        "description": r.description,
                        "distance_km": round(d, 2),
                    })
    else:
        for r in _mem["reports"]:
            if r.get("city", city) != city:
                continue
            d = haversine_m(lat, lng, r["latitude"], r["longitude"]) / 1000
            if d <= radius_km:
                out.append({**r, "distance_km": round(d, 2)})
    return out


def list_reports(city: str, limit: int = 50) -> list[dict]:
    if is_db_active():
        with db.SessionLocal() as session:
            rows = session.scalars(
                select(SafetyReport).where(SafetyReport.city == city).order_by(SafetyReport.created_at.desc()).limit(limit)
            ).all()
            return [{
                "id": str(r.id),
                "report_type": r.report_type,
                "description": r.description,
                "latitude": float(r.latitude),
                "longitude": float(r.longitude),
                "upvotes": r.upvotes,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            } for r in rows]
    return [r for r in _mem["reports"] if r.get("city", city) == city][:limit]


def get_wallet() -> dict:
    if is_db_active():
        with db.SessionLocal() as session:
            w = session.scalar(select(CarbonWallet).where(CarbonWallet.user_id == _uid(_effective_user_id())))
            if w:
                txs = session.scalars(
                    select(TokenTransaction).where(TokenTransaction.wallet_id == w.id).order_by(TokenTransaction.created_at.desc()).limit(20)
                ).all()
                return {
                    "balance": w.balance,
                    "lifetime_tokens": w.lifetime_tokens,
                    "lifetime_co2_kg": float(w.lifetime_co2_kg or 0),
                    "green_trips_count": w.green_trips_count,
                    "transactions": [{
                        "id": str(t.id),
                        "type": t.type,
                        "amount": t.amount,
                        "description": t.description,
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    } for t in txs],
                }
    mem_wallet = _mem["wallets"].get(uid)
    if mem_wallet:
        return {**mem_wallet, "transactions": _mem["transactions"]}
    return {**_mem["wallet"], "transactions": _mem["transactions"]}


def get_contacts() -> list[dict]:
    if is_db_active():
        with db.SessionLocal() as session:
            rows = session.scalars(
                select(EmergencyContact).where(EmergencyContact.user_id == _uid(_effective_user_id()))
            ).all()
            return [{"name": r.name, "phone": r.phone, "relationship": r.relationship} for r in rows]
    return [
        {"name": "Mom", "phone": "+919876543210", "relationship": "Mother"},
        {"name": "Sneha", "phone": "+919876543211", "relationship": "Friend"},
    ]


def create_sos(lat: float | None, lng: float | None, silent: bool, trip_id: str | None) -> dict:
    sid = str(uuid.uuid4())
    alert = {"id": sid, "silent": silent, "latitude": lat, "longitude": lng, "trip_id": trip_id, "status": "active"}
    if is_db_active():
        with db.SessionLocal() as session:
            session.add(SOSAlert(
                id=_uid(sid),
                user_id=_uid(_effective_user_id()),
                trip_id=_uid(trip_id) if trip_id else None,
                silent=silent,
                latitude=lat,
                longitude=lng,
            ))
            session.commit()
    else:
        _mem["sos"].append(alert)
    return alert


def leaderboard(city: str) -> list[dict]:
    if is_db_active():
        with db.SessionLocal() as session:
            rows = session.scalars(
                select(LeaderboardEntry).order_by(LeaderboardEntry.rank).limit(20)
            ).all()
            if rows:
                return [{
                    "entity_type": r.entity_type,
                    "entity_name": r.entity_name,
                    "carbon_saved_kg": float(r.carbon_saved_kg or 0),
                    "tokens_earned": r.tokens_earned,
                    "green_trips": r.green_trips,
                    "rank": r.rank,
                } for r in rows]
    return [
        {"entity_type": "individual", "entity_name": "Ananya Krishnan", "carbon_saved_kg": 12.4, "tokens_earned": 520, "green_trips": 28, "rank": 1},
        {"entity_type": "college", "entity_name": "Anna University Chennai", "carbon_saved_kg": 840.2, "tokens_earned": 12400, "green_trips": 312, "rank": 1},
        {"entity_type": "company", "entity_name": "TCS Chennai", "carbon_saved_kg": 2100.5, "tokens_earned": 45000, "green_trips": 890, "rank": 1},
    ]


def esg_summary() -> dict:
    lb = leaderboard("chennai")
    colleges = [e for e in lb if e["entity_type"] == "college"]
    companies = [e for e in lb if e["entity_type"] == "company"]
    return {
        "total_co2_saved_kg": sum(e["carbon_saved_kg"] for e in lb),
        "total_green_trips": sum(e["green_trips"] for e in lb),
        "top_college": colleges[0] if colleges else None,
        "top_company": companies[0] if companies else None,
        "employee_participation_pct": 67,
        "monthly_trend": [120, 145, 180, 210, 240, 280],
        "live": is_db_active(),
    }
