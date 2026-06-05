from pydantic import BaseModel, Field


class RouteSearchRequest(BaseModel):
    source: str
    destination: str
    city: str = "chennai"
    night_mode: bool = False
    women_mode: bool = False


class ReportCreate(BaseModel):
    report_type: str
    description: str | None = None
    latitude: float
    longitude: float
    city: str = "chennai"


class TripStartRequest(BaseModel):
    route_id: str


class TripLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class TripCheckIn(BaseModel):
    latitude: float
    longitude: float
    mode: str = "metro"


class SOSRequest(BaseModel):
    trip_id: str | None = None
    silent: bool = False
    latitude: float | None = None
    longitude: float | None = None


class UserPreferences(BaseModel):
    women_safety_mode: bool | None = None
    night_safe_preference: bool | None = None
    city: str | None = None
