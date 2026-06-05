from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RouteSearchRequest(BaseModel):
    source: str
    destination: str
    city: str = "chennai"
    women_safety_mode: bool = False
    prefer_night_safe: bool = False


class SafetyFactorOut(BaseModel):
    factor: str
    impact: int
    description: str


class RouteLeg(BaseModel):
    mode: str
    from_: str = Field(alias="from")
    to: str
    duration_min: int
    distance_km: float

    class Config:
        populate_by_name = True


class RouteOption(BaseModel):
    id: str
    route_type: str
    source: str
    destination: str
    eta_minutes: int
    distance_km: float
    safety_score: int
    safety_label: str
    safety_breakdown: list[SafetyFactorOut]
    carbon_saved_kg: float
    reward_tokens: int
    legs: list[dict]
    recommendations: list[str] = []


class RouteSearchResponse(BaseModel):
    routes: list[RouteOption]


class TripStartRequest(BaseModel):
    route_id: str


class TripLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class TripCompleteResponse(BaseModel):
    tokens_earned: int
    co2_saved_kg: float
    wallet_balance: int
    message: str


class SafetyReportCreate(BaseModel):
    report_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    city: str = "chennai"


class VoteRequest(BaseModel):
    vote_type: str


class SOSRequest(BaseModel):
    trip_id: Optional[str] = None
    silent: bool = False
    latitude: float
    longitude: float


class RedeemRequest(BaseModel):
    reward_type: str
    tokens: int


class SettingsUpdate(BaseModel):
    women_safety_mode: Optional[bool] = None
    night_safe_preference: Optional[bool] = None


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: Optional[str] = None
