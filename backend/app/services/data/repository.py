"""Unified data layer: Supabase PostgreSQL when available, demo store as fallback."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.demo_store import store, DEMO_USER_ID, DEMO_LEADERBOARD, DEMO_ROAD_RATINGS
from app.models.models import (
    User, CarbonWallet, TokenTransaction, SafetyReport,
    CommunityVote, EmergencyContact, RoadRating, LeaderboardEntry,
)

_db_ready = False


def set_db_ready(ready: bool) -> None:
    global _db_ready
    _db_ready = ready


def is_db_active() -> bool:
    return _db_ready and settings.database_enabled


def _session() -> Optional[Session]:
    if not is_db_active() or SessionLocal is None:
        return None
    return SessionLocal()


def _demo_user_uuid():
    return uuid.UUID(DEMO_USER_ID)


# ── User & Wallet ──────────────────────────────────────────

def get_current_user() -> dict:
    db = _session()
    if db:
        try:
            user = db.query(User).filter(User.id == _demo_user_uuid()).first()
            if user:
                wallet = db.query(CarbonWallet).filter(CarbonWallet.user_id == user.id).first()
                return {
                    "id": str(user.id),
                    "clerk_id": user.clerk_id,
                    "email": user.email,
                    "name": user.name,
                    "college": user.college,
                    "company": user.company,
                    "women_safety_mode": user.women_safety_mode,
                    "night_safe_preference": user.night_safe_preference,
                    "trust_score": user.trust_score,
                    "city": user.city,
                    "wallet": {
                        "balance": wallet.balance if wallet else 0,
                        "lifetime_tokens": wallet.lifetime_tokens if wallet else 0,
                        "lifetime_co2_kg": float(wallet.lifetime_co2_kg) if wallet else 0,
                        "green_trips_count": wallet.green_trips_count if wallet else 0,
                    },
                }
        finally:
            db.close()
    return {**store.user, "wallet": store.wallet}


def get_wallet() -> dict:
    user = get_current_user()
    return {**user.get("wallet", store.wallet), "user_id": user["id"]}


def update_user_settings(women_safety_mode: Optional[bool], night_safe_preference: Optional[bool]) -> dict:
    db = _session()
    if db:
        try:
            user = db.query(User).filter(User.id == _demo_user_uuid()).first()
            if user:
                if women_safety_mode is not None:
                    user.women_safety_mode = women_safety_mode
                if night_safe_preference is not None:
                    user.night_safe_preference = night_safe_preference
                db.commit()
                db.refresh(user)
                result = get_current_user()
                result.pop("wallet", None)
                return result
        finally:
            db.close()
    if women_safety_mode is not None:
        store.user["women_safety_mode"] = women_safety_mode
    if night_safe_preference is not None:
        store.user["night_safe_preference"] = night_safe_preference
    return store.user


def credit_wallet(tokens: int, co2_kg: float, description: str) -> int:
    db = _session()
    if db:
        try:
            wallet = db.query(CarbonWallet).filter(CarbonWallet.user_id == _demo_user_uuid()).first()
            if wallet:
                wallet.balance += tokens
                wallet.lifetime_tokens += tokens
                wallet.lifetime_co2_kg = Decimal(str(round(float(wallet.lifetime_co2_kg) + co2_kg, 2)))
                wallet.green_trips_count += 1
                tx = TokenTransaction(
                    wallet_id=wallet.id,
                    type="earn",
                    amount=tokens,
                    description=description,
                )
                db.add(tx)
                db.commit()
                return wallet.balance
        finally:
            db.close()
    store.wallet["balance"] += tokens
    store.wallet["lifetime_tokens"] += tokens
    store.wallet["lifetime_co2_kg"] = round(store.wallet["lifetime_co2_kg"] + co2_kg, 2)
    store.wallet["green_trips_count"] += 1
    store.transactions.insert(0, {
        "id": str(uuid.uuid4()),
        "type": "earn",
        "amount": tokens,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return store.wallet["balance"]


def redeem_wallet(tokens: int, description: str) -> dict:
    db = _session()
    if db:
        try:
            wallet = db.query(CarbonWallet).filter(CarbonWallet.user_id == _demo_user_uuid()).first()
            if not wallet or wallet.balance < tokens:
                raise ValueError("Insufficient tokens")
            wallet.balance -= tokens
            tx = TokenTransaction(wallet_id=wallet.id, type="redeem", amount=-tokens, description=description)
            db.add(tx)
            db.commit()
            return {"balance": wallet.balance}
        finally:
            db.close()
    if store.wallet["balance"] < tokens:
        raise ValueError("Insufficient tokens")
    store.wallet["balance"] -= tokens
    store.transactions.insert(0, {
        "id": str(uuid.uuid4()),
        "type": "redeem",
        "amount": -tokens,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"balance": store.wallet["balance"]}


def get_transactions() -> list:
    db = _session()
    if db:
        try:
            wallet = db.query(CarbonWallet).filter(CarbonWallet.user_id == _demo_user_uuid()).first()
            if wallet:
                txs = (
                    db.query(TokenTransaction)
                    .filter(TokenTransaction.wallet_id == wallet.id)
                    .order_by(TokenTransaction.created_at.desc())
                    .limit(50)
                    .all()
                )
                return [{
                    "id": str(t.id),
                    "type": t.type,
                    "amount": t.amount,
                    "description": t.description,
                    "created_at": t.created_at.isoformat() if t.created_at else "",
                } for t in txs]
        finally:
            db.close()
    return store.transactions


# ── Safety Reports ─────────────────────────────────────────

def _report_dict(r: SafetyReport) -> dict:
    return {
        "id": str(r.id),
        "user_id": str(r.user_id),
        "report_type": r.report_type,
        "description": r.description,
        "latitude": float(r.latitude),
        "longitude": float(r.longitude),
        "upvotes": r.upvotes,
        "verifications": r.verifications,
        "is_verified": r.is_verified,
        "city": r.city,
        "created_at": r.created_at.isoformat() if r.created_at else "",
    }


def get_safety_reports(city: str = "chennai") -> list:
    db = _session()
    if db:
        try:
            reports = db.query(SafetyReport).filter(SafetyReport.city == city).order_by(SafetyReport.created_at.desc()).all()
            return [_report_dict(r) for r in reports]
        finally:
            db.close()
    return [r for r in store.reports if r.get("city") == city]


def create_safety_report(
    report_type: str,
    description: str,
    latitude: float,
    longitude: float,
    city: str = "chennai",
) -> dict:
    db = _session()
    if db:
        try:
            report = SafetyReport(
                user_id=_demo_user_uuid(),
                report_type=report_type,
                description=description,
                latitude=latitude,
                longitude=longitude,
                city=city,
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return _report_dict(report)
        finally:
            db.close()
    report = {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": report_type,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "upvotes": 0,
        "verifications": 0,
        "is_verified": False,
        "city": city,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store.reports.insert(0, report)
    return report


def vote_report(report_id: str, vote_type: str) -> dict:
    db = _session()
    if db:
        try:
            rid = uuid.UUID(report_id)
            existing = db.query(CommunityVote).filter(
                CommunityVote.user_id == _demo_user_uuid(),
                CommunityVote.report_id == rid,
                CommunityVote.vote_type == vote_type,
            ).first()
            if existing:
                raise ValueError("Already voted")
            report = db.query(SafetyReport).filter(SafetyReport.id == rid).first()
            if not report:
                raise ValueError("Report not found")
            db.add(CommunityVote(user_id=_demo_user_uuid(), report_id=rid, vote_type=vote_type))
            if vote_type == "upvote":
                report.upvotes += 1
            elif vote_type == "verify":
                report.verifications += 1
                if report.verifications >= 3:
                    report.is_verified = True
            db.commit()
            db.refresh(report)
            return _report_dict(report)
        finally:
            db.close()
    for r in store.reports:
        if r["id"] == report_id:
            key = (DEMO_USER_ID, report_id, vote_type)
            if key in store.votes:
                raise ValueError("Already voted")
            store.votes.add(key)
            if vote_type == "upvote":
                r["upvotes"] += 1
            elif vote_type == "verify":
                r["verifications"] += 1
                if r["verifications"] >= 3:
                    r["is_verified"] = True
            return r
    raise ValueError("Report not found")


def get_road_ratings(city: str = "chennai") -> list:
    db = _session()
    if db:
        try:
            segments = db.query(RoadRating).filter(RoadRating.city == city).all()
            color_map = {"good": "green", "moderate": "yellow", "poor": "red"}
            return [{
                "id": str(s.id),
                "segment_id": s.segment_id,
                "latitude": float(s.latitude),
                "longitude": float(s.longitude),
                "rating": s.rating,
                "condition": s.condition,
                "color": color_map.get(s.condition, "yellow"),
            } for s in segments]
        finally:
            db.close()
    return [r for r in DEMO_ROAD_RATINGS if r.get("city") == city]


# ── Leaderboard ────────────────────────────────────────────

def get_leaderboard(entity_type: str, period: str = "weekly") -> list:
    db = _session()
    if db:
        try:
            entries = (
                db.query(LeaderboardEntry)
                .filter(LeaderboardEntry.entity_type == entity_type)
                .order_by(LeaderboardEntry.rank)
                .all()
            )
            if entries:
                return [{
                    "rank": e.rank,
                    "entity_name": e.entity_name,
                    "tokens_earned": e.tokens_earned,
                    "carbon_saved_kg": float(e.carbon_saved_kg),
                    "green_trips": e.green_trips,
                } for e in entries]
        finally:
            db.close()
    return DEMO_LEADERBOARD.get(entity_type, DEMO_LEADERBOARD["individual"])


# ── Emergency Contacts ─────────────────────────────────────

def get_emergency_contacts() -> list:
    db = _session()
    if db:
        try:
            contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == _demo_user_uuid()).all()
            return [{
                "id": str(c.id),
                "name": c.name,
                "phone": c.phone,
                "relationship": c.contact_relationship,
            } for c in contacts]
        finally:
            db.close()
    return store.contacts


def add_emergency_contact(name: str, phone: str, relationship: Optional[str]) -> dict:
    db = _session()
    if db:
        try:
            contact = EmergencyContact(
                user_id=_demo_user_uuid(),
                name=name,
                phone=phone,
                contact_relationship=relationship,
            )
            db.add(contact)
            db.commit()
            db.refresh(contact)
            return {"id": str(contact.id), "name": contact.name, "phone": contact.phone, "relationship": contact.contact_relationship}
        finally:
            db.close()
    contact = {"id": str(uuid.uuid4()), "name": name, "phone": phone, "relationship": relationship}
    store.contacts.append(contact)
    return contact


def delete_emergency_contact(contact_id: str) -> None:
    db = _session()
    if db:
        try:
            db.query(EmergencyContact).filter(
                EmergencyContact.id == uuid.UUID(contact_id),
                EmergencyContact.user_id == _demo_user_uuid(),
            ).delete()
            db.commit()
            return
        finally:
            db.close()
    store.contacts = [c for c in store.contacts if c["id"] != contact_id]


# ── Routes & Trips (in-memory, ephemeral) ──────────────────

def cache_routes(routes: list) -> None:
    store.cache_routes(routes)


def get_route(route_id: str) -> Optional[dict]:
    return store.get_route(route_id)


def save_trip(trip: dict) -> dict:
    store.trips[trip["id"]] = trip
    return trip


def get_trip(trip_id: str) -> Optional[dict]:
    return store.trips.get(trip_id)


def get_completed_trips() -> list:
    return [t for t in store.trips.values() if t.get("status") == "completed"][:20]


def get_trip_by_share_token(share_token: str) -> Optional[dict]:
    for trip in store.trips.values():
        if trip.get("share_token") == share_token:
            return trip
    return None
