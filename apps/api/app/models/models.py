import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    email: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    college: Mapped[str | None] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    women_safety_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    night_safe_preference: Mapped[bool] = mapped_column(Boolean, default=False)
    trust_score: Mapped[int] = mapped_column(Integer, default=50)
    city: Mapped[str] = mapped_column(String(50), default="chennai")


class CarbonWallet(Base):
    __tablename__ = "carbon_wallets"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    balance: Mapped[int] = mapped_column(Integer, default=0)
    lifetime_tokens: Mapped[int] = mapped_column(Integer, default=0)
    lifetime_co2_kg: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    green_trips_count: Mapped[int] = mapped_column(Integer, default=0)


class Route(Base):
    __tablename__ = "routes"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_type: Mapped[str] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(255))
    destination: Mapped[str] = mapped_column(String(255))
    source_lat: Mapped[float | None] = mapped_column(Numeric(10, 7))
    source_lng: Mapped[float | None] = mapped_column(Numeric(10, 7))
    dest_lat: Mapped[float | None] = mapped_column(Numeric(10, 7))
    dest_lng: Mapped[float | None] = mapped_column(Numeric(10, 7))
    legs: Mapped[dict] = mapped_column(JSONB, default=list)
    safety_score: Mapped[int | None] = mapped_column(Integer)
    safety_label: Mapped[str | None] = mapped_column(String(20))
    safety_breakdown: Mapped[dict] = mapped_column(JSONB, default=list)
    distance_km: Mapped[float | None] = mapped_column(Numeric(8, 2))
    eta_minutes: Mapped[int | None] = mapped_column(Integer)
    carbon_saved_kg: Mapped[float | None] = mapped_column(Numeric(8, 2))
    reward_tokens: Mapped[int | None] = mapped_column(Integer)
    recommendations: Mapped[dict] = mapped_column(JSONB, default=list)
    city: Mapped[str] = mapped_column(String(50), default="chennai")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Trip(Base):
    __tablename__ = "trips"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id"))
    status: Mapped[str] = mapped_column(String(20), default="active")
    path_coordinates: Mapped[dict] = mapped_column(JSONB, default=list)
    current_lat: Mapped[float | None] = mapped_column(Numeric(10, 7))
    current_lng: Mapped[float | None] = mapped_column(Numeric(10, 7))
    co2_saved_kg: Mapped[float | None] = mapped_column(Numeric(8, 2))
    tokens_earned: Mapped[int | None] = mapped_column(Integer)
    share_token: Mapped[str | None] = mapped_column(String(64), unique=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SafetyReport(Base):
    __tablename__ = "safety_reports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    report_type: Mapped[str] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float] = mapped_column(Numeric(10, 7))
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    city: Mapped[str] = mapped_column(String(50), default="chennai")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(20))
    relationship: Mapped[str | None] = mapped_column(String(100))


class TokenTransaction(Base):
    __tablename__ = "token_transactions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("carbon_wallets.id"))
    trip_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id"))
    type: Mapped[str] = mapped_column(String(20))
    amount: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(20))
    entity_name: Mapped[str] = mapped_column(String(255))
    carbon_saved_kg: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tokens_earned: Mapped[int] = mapped_column(Integer, default=0)
    green_trips: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[int | None] = mapped_column(Integer)
    period: Mapped[str] = mapped_column(String(20), default="weekly")


class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    trip_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id"))
    silent: Mapped[bool] = mapped_column(Boolean, default=False)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7))
    contacts_notified: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
