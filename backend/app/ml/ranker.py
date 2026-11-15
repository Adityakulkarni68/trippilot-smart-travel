"""
ML RANKER
─────────
Combines outputs from all 3 agents to score and sequence each stop.

Scoring model:
  Each stop gets a composite score out of 10.
  score = Σ (weight_i × factor_i)

  Factors and weights:
  ┌────────────────────────┬────────┬──────────────────────────────────────┐
  │ Factor                 │ Weight │ Description                          │
  ├────────────────────────┼────────┼──────────────────────────────────────┤
  │ Weather suitability    │  0.30  │ Is outdoor activity viable today?    │
  │ Traffic score at slot  │  0.25  │ How clear are roads at visit time?   │
  │ Attraction popularity  │  0.20  │ Known/ranked landmark score          │
  │ Distance from previous │  0.15  │ Haversine proximity to save transit  │
  │ Budget match           │  0.10  │ Is entry cost within tier budget?    │
  └────────────────────────┴────────┴──────────────────────────────────────┘

Uses numpy for vectorized scoring across all candidate stops simultaneously.
"""
import math
import numpy as np
from typing import List, Dict, Any, Optional
from app.schemas.trip import WeatherInfo, TrafficInfo, DetailedStop


# ── Configuration & Weights ───────────────────────────────────────────────────

WEIGHTS = np.array([0.30, 0.25, 0.20, 0.15, 0.10])

BUDGET_ACTIVITY_COST = {"budget": 150, "mid": 400, "luxury": 1000}

# Known landmark popularity scores (0.0 to 1.0)
LANDMARK_SCORES: Dict[str, float] = {
    "taj mahal": 1.0, "amber fort": 0.95, "red fort": 0.93,
    "qutub minar": 0.90, "hawa mahal": 0.88, "baga beach": 0.82,
    "fort aguada": 0.84, "dudhsagar falls": 0.87, "gateway of india": 0.91,
    "marine drive": 0.85, "elephanta caves": 0.84, "rohtang pass": 0.89,
    "solang valley": 0.85, "hadimba temple": 0.80, "city palace": 0.88,
    "jantar mantar": 0.86, "nahargarh fort": 0.82, "india gate": 0.92,
    "lotus temple": 0.86, "humayun's tomb": 0.89, "calangute beach": 0.80,
    "old goa churches": 0.86, "anjuna flea market": 0.75, "chandni chowk": 0.82,
    "agra fort": 0.90, "fatehpur sikri": 0.88, "mehtab bagh": 0.78,
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two geographic coordinates."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def _popularity_score(stop_name: str) -> float:
    """Look up verified popularity score; default to 0.65 for lesser-known attractions."""
    return LANDMARK_SCORES.get(stop_name.lower().strip(), 0.65)


def _traffic_score_at_time(time_slot: str, traffic: TrafficInfo) -> float:
    """Find congestion score for the closest matching time window."""
    if traffic and traffic.best_windows:
        for window in traffic.best_windows:
            if window.time == time_slot:
                return window.congestion_score

    # Fallback to overall status
    if traffic.overall_congestion == "low":
        return 0.85
    elif traffic.overall_congestion == "moderate":
        return 0.60
    return 0.35


def _proximity_score(current_stop: Dict, previous_stop: Optional[Dict], idx: int, total: int) -> float:
    """
    Computes geographical proximity score (0.0 to 1.0) using Haversine distance
    between consecutive stops. Falls back to index decay when coordinates are missing.
    """
    if previous_stop and current_stop.get("lat") and current_stop.get("lon") and previous_stop.get("lat") and previous_stop.get("lon"):
        try:
            dist = haversine_km(
                previous_stop["lat"], previous_stop["lon"],
                current_stop["lat"], current_stop["lon"]
            )
            if dist <= 2.0:
                return 1.0
            elif dist <= 6.0:
                return 0.85
            elif dist <= 12.0:
                return 0.70
            elif dist <= 20.0:
                return 0.50
            return 0.30
        except Exception:
            pass

    return max(0.4, 1.0 - (idx / max(total, 1)) * 0.35)


def _budget_match_score(stop_cost: float, budget_tier: str) -> float:
    """Check how well the stop's expected entry fee fits the user's budget tier."""
    ideal = BUDGET_ACTIVITY_COST.get(budget_tier, 400)
    ratio = stop_cost / ideal
    if ratio <= 1.1:
        return 1.0
    elif ratio <= 1.8:
        return 0.7
    return 0.4


def _assign_times(
    ordered_stops: List[Dict],
    start_time: str,
    traffic: TrafficInfo,
) -> List[str]:
    """
    Assign visit times to each stop based on:
    - Recommended start from traffic agent
    - Duration of each stop
    - Transit interval
    Ensures times stay strictly within 24-hour cycle (capped at 22:30).
    """
    def to_min(t: str) -> int:
        try:
            h, m = map(int, t.split(":"))
            return h * 60 + m
        except Exception:
            return 9 * 60  # 09:00 AM default

    def to_str(m: int) -> str:
        capped_m = min(m, 22 * 60 + 30)  # capped at 10:30 PM
        return f"{capped_m // 60:02d}:{capped_m % 60:02d}"

    current = to_min(start_time)
    times = []
    for stop in ordered_stops:
        times.append(to_str(current))
        duration_min = int(stop.get("duration_hours", 1.5) * 60)
        transit_min  = 25  # realistic transit
        current += duration_min + transit_min

    return times


def rank_and_sequence(
    raw_stops: List[Dict[str, Any]],
    weather: WeatherInfo,
    traffic: TrafficInfo,
    budget_tier: str,
) -> List[DetailedStop]:
    """
    Core ML function.
    Takes raw stop candidates + agent telemetry → returns ordered DetailedStop list.
    """
    if not raw_stops:
        return []

    n = len(raw_stops)

    # ── Build factor vectors ──────────────────────────────────────────────────
    weather_scores = np.full(n, weather.suitability_score)
    traffic_scores = np.full(n, 0.65)  # initial average
    popularity_scores = np.array([_popularity_score(s.get("name", "")) for s in raw_stops])

    # Haversine distance scores
    distance_scores = np.zeros(n)
    for i in range(n):
        prev = raw_stops[i - 1] if i > 0 else None
        distance_scores[i] = _proximity_score(raw_stops[i], prev, i, n)

    budget_scores = np.array([
        _budget_match_score(s.get("cost_inr", 300), budget_tier)
        for s in raw_stops
    ])

    # Outdoor weather penalty
    outdoor_types = {"beach", "fort", "park", "garden", "viewpoint", "falls", "pass", "valley"}
    for i, stop in enumerate(raw_stops):
        desc = (stop.get("description") or stop.get("name") or stop.get("type") or "").lower()
        is_outdoor = any(kw in desc for kw in outdoor_types)
        if is_outdoor and weather.suitability == "indoor_preferred":
            weather_scores[i] = max(0.1, weather_scores[i] - 0.45)

    factor_matrix = np.column_stack([
        weather_scores,
        traffic_scores,
        popularity_scores,
        distance_scores,
        budget_scores,
    ])  # shape: (n, 5)

    # ── Weighted dot product → composite score out of 10 ──────────────────────
    composite = factor_matrix @ WEIGHTS
    scores_out_of_10 = np.round(np.clip(composite * 10, 1.0, 10.0), 2)

    # ── Sort stops descending by score ────────────────────────────────────────
    order = np.argsort(composite)[::-1]
    ordered_stops = [raw_stops[i] for i in order]
    ordered_scores = scores_out_of_10[order]
    ordered_factors = factor_matrix[order]

    # ── Assign realistic, traffic-aware visit times ────────────────────────────
    times = _assign_times(ordered_stops, traffic.recommended_start, traffic)

    # ── Assemble final DetailedStop objects ────────────────────────────────────
    results: List[DetailedStop] = []
    for rank, (stop, score, factors, visit_time) in enumerate(
        zip(ordered_stops, ordered_scores, ordered_factors, times), start=1
    ):
        traffic_at_slot = _traffic_score_at_time(visit_time, traffic)
        weather_ok = float(factors[0]) >= 0.40

        results.append(DetailedStop(
            order=rank,
            name=stop["name"],
            type=stop.get("type", "attraction"),
            lat=stop.get("lat"),
            lon=stop.get("lon"),
            description=stop.get("description"),
            suggested_time=visit_time,
            duration_hours=stop.get("duration_hours", 1.5),
            cost_inr=stop.get("cost_inr", 300),
            weather_suitable=weather_ok,
            ml_score=float(score),
            score_breakdown={
                "weather":    round(float(factors[0]), 2),
                "traffic":    round(float(traffic_at_slot), 2),
                "popularity": round(float(factors[2]), 2),
                "distance":   round(float(factors[3]), 2),
                "budget":     round(float(factors[4]), 2),
            },
        ))

    return results
