from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime


# ── Phase 1 ──────────────────────────────────────────────────────────────────

class TripRequest(BaseModel):
    """What the user submits to create a trip and get the rough itinerary."""
    destination : str  = Field(..., min_length=2)
    origin      : Optional[str] = None
    start_date  : Optional[str] = None          # "YYYY-MM-DD"
    num_days    : int  = Field(..., ge=1, le=30)
    budget_tier : str  = Field("mid", pattern="^(budget|mid|luxury)$")
    pace        : str  = Field("balanced", pattern="^(relaxed|balanced|fast)$")
    travelers   : int  = Field(1, ge=1, le=20)

    @field_validator("budget_tier", mode="before")
    @classmethod
    def normalize_budget(cls, v: str) -> str:
        if not isinstance(v, str):
            return "mid"
        clean = v.strip().lower()
        if "lux" in clean:
            return "luxury"
        if "bud" in clean:
            return "budget"
        return "mid"

    @field_validator("pace", mode="before")
    @classmethod
    def normalize_pace(cls, v: str) -> str:
        if not isinstance(v, str):
            return "balanced"
        clean = v.strip().lower()
        if "rel" in clean:
            return "relaxed"
        if "fast" in clean or "rush" in clean:
            return "fast"
        return "balanced"



class RoughStop(BaseModel):
    """One attraction in the rough plan — no timing, just overview."""
    name        : str
    type        : str                    # attraction | area | landmark
    description : Optional[str] = None
    lat         : Optional[float] = None
    lon         : Optional[float] = None


class RoughDay(BaseModel):
    """One day in the rough plan."""
    day         : int
    area        : str                    # e.g. "North Goa"
    theme       : str                    # e.g. "Beaches & Forts"
    highlights  : List[RoughStop] = []
    hotel_zone  : str                    # e.g. "Calangute area"
    est_cost_inr: float = 0.0


class RoughPlanResponse(BaseModel):
    """Phase 1 response — the skeleton overview."""
    trip_id     : int
    destination : str
    num_days    : int
    budget_tier : str
    pace        : str
    travelers   : int
    days        : List[RoughDay]
    grand_total_inr: float
    summary     : str


# ── Phase 2 ──────────────────────────────────────────────────────────────────

class DailyPlanRequest(BaseModel):
    """Request to generate the detailed plan for one specific day."""
    trip_id     : int
    day_number  : int = Field(..., ge=1)
    plan_date   : Optional[str] = None   # "YYYY-MM-DD" — defaults to today


class WeatherInfo(BaseModel):
    temp_c          : float
    feels_like_c    : float
    description     : str
    humidity_pct    : int
    wind_kmh        : float
    suitability     : str    # outdoor_great | outdoor_ok | indoor_preferred
    suitability_score: float  # 0.0 – 1.0
    last_updated    : Optional[str] = None
    source          : Optional[str] = None


class TrafficWindow(BaseModel):
    time            : str    # "09:00"
    congestion_level: str    # low | moderate | high
    congestion_score: float  # 0.0 (bad) – 1.0 (clear)
    suggestion      : str


class TrafficInfo(BaseModel):
    overall_congestion : str
    best_windows       : List[TrafficWindow]
    avoid_times        : List[str]
    recommended_start  : str
    current_level      : Optional[str] = None
    current_score      : Optional[float] = None
    last_updated       : Optional[str] = None
    source             : Optional[str] = None


class Restaurant(BaseModel):
    name         : str
    cuisine      : str
    rating       : float
    price_band   : str   # $ $$ $$$
    distance_km  : float
    on_route     : bool
    lat          : Optional[float] = None
    lon          : Optional[float] = None
    meal_type    : str   # breakfast | lunch | dinner


class TransitLeg(BaseModel):
    """Transit leg from previous location to this stop."""
    from_name       : str
    to_name         : str
    distance_km     : float
    duration_mins   : int
    mode            : str = "drive"
    traffic_status  : str = "low"     # low | moderate | heavy
    route_tip       : Optional[str] = None


class DetailedStop(BaseModel):
    """One stop in the detailed daily plan with timing, transit, and weather context."""
    order           : int
    name            : str
    type            : str
    lat             : Optional[float] = None
    lon             : Optional[float] = None
    description     : Optional[str] = None
    suggested_time  : str         # e.g. "09:30"
    end_time        : Optional[str] = None  # e.g. "11:30"
    duration_hours  : float
    cost_inr        : float
    weather_suitable: bool
    weather_tip     : Optional[str] = None
    curator_badge   : Optional[str] = None
    ml_score        : float       # 0.0 – 10.0 final ML rank score
    score_breakdown : dict        # individual factor scores
    transit_from_previous: Optional[TransitLeg] = None


class DailyPlanResponse(BaseModel):
    """Detailed plan for one day with enriched transit routing and weather insights."""
    trip_id           : int
    day_number        : int
    plan_date         : Optional[str]
    destination       : str
    weather           : WeatherInfo
    traffic           : TrafficInfo
    stops             : List[DetailedStop]
    meals             : List[Restaurant]
    hotel             : RoughStop
    daily_total_inr   : float
    agent_summary     : str            # human-readable explanation of decisions
    total_distance_km : Optional[float] = 0.0
    total_transit_mins: Optional[int] = 0
    route_summary     : Optional[str] = None


# ── Storage responses ────────────────────────────────────────────────────────

class TripOut(BaseModel):
    id          : int
    destination : str
    origin      : Optional[str]
    num_days    : int
    budget_tier : str
    pace        : str
    travelers   : int
    total_cost_inr: Optional[float]
    created_at  : datetime

    model_config = ConfigDict(from_attributes=True)


class DailyPlanOut(BaseModel):
    id          : int
    trip_id     : int
    day_number  : int
    plan_date   : Optional[str]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)

