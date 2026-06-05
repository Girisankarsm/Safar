import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String(255), unique=True)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    college = Column(String(255))
    company = Column(String(255))
    avatar_url = Column(Text)
    women_safety_mode = Column(Boolean, default=False)
    night_safe_preference = Column(Boolean, default=False)
    trust_score = Column(Integer, default=50)
    city = Column(String(50), default="hyderabad")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    wallet = relationship("CarbonWallet", back_populates="user", uselist=False)
    contacts = relationship("EmergencyContact", back_populates="user")


class CarbonWallet(Base):
    __tablename__ = "carbon_wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    balance = Column(Integer, default=0)
    lifetime_tokens = Column(Integer, default=0)
    lifetime_co2_kg = Column(Numeric(10, 2), default=0)
    green_trips_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="wallet")
    transactions = relationship("TokenTransaction", back_populates="wallet")


class TokenTransaction(Base):
    __tablename__ = "token_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("carbon_wallets.id", ondelete="CASCADE"))
    trip_id = Column(UUID(as_uuid=True), nullable=True)
    type = Column(String(20), nullable=False)
    amount = Column(Integer, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    wallet = relationship("CarbonWallet", back_populates="transactions")


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    report_type = Column(String(50), nullable=False)
    description = Column(Text)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    upvotes = Column(Integer, default=0)
    verifications = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    city = Column(String(50), default="hyderabad")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class CommunityVote(Base):
    __tablename__ = "community_votes"
    __table_args__ = (UniqueConstraint("user_id", "report_id", "vote_type"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    report_id = Column(UUID(as_uuid=True), ForeignKey("safety_reports.id", ondelete="CASCADE"))
    vote_type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    contact_relationship = Column("relationship", String(100))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="contacts")


class RoadRating(Base):
    __tablename__ = "road_ratings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_id = Column(String(100), nullable=False)
    city = Column(String(50), default="hyderabad")
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    rating = Column(Integer)
    condition = Column(String(20))
    factors = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(20), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    entity_name = Column(String(255), nullable=False)
    carbon_saved_kg = Column(Numeric(10, 2), default=0)
    tokens_earned = Column(Integer, default=0)
    green_trips = Column(Integer, default=0)
    rank = Column(Integer)
    period = Column(String(20), default="weekly")
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
