"""
PHASE 2 — DAILY ORCHESTRATOR
──────────────────────────────
Runs all three agents in PARALLEL using asyncio.gather, then
feeds their outputs into the ML ranker to produce the detailed day plan.

Flow:
  1. asyncio.gather → Weather Agent, Traffic Agent, Food Agent, Places run simultaneously
  2. ML Ranker → scores and sequences stops using vector weighted model & Haversine distance
  3. Select best meals (breakfast, lunch, dinner) from Food Agent output
  4. Assemble final DailyPlanResponse with timing, scores, and agent summary
"""
import asyncio
import json
import math
from typing import Optional

from app.schemas.trip import (
    DailyPlanRequest, DailyPlanResponse, RoughStop, Restaurant, DetailedStop, TransitLeg
)
from app.agents import weather_agent, traffic_agent, food_agent
from app.services.places import get_places
from app.services.hotels import get_hotel
from app.services.budget import get_config, stops_per_day, meal_costs
from app.ml.ranker import rank_and_sequence, haversine_km


def _calculate_transit(from_name: str, lat1: Optional[float], lon1: Optional[float],
                       to_name: str, lat2: Optional[float], lon2: Optional[float],
                       congestion: str = "low") -> TransitLeg:
    """Calculates realistic driving/walking transit distance and duration between two locations."""
    if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
        raw_km = haversine_km(lat1, lon1, lat2, lon2)
        dist_km = max(round(raw_km * 1.3, 1), 0.6)  # Urban road winding factor 1.3
    else:
        dist_km = 3.5

    # Determine average speed based on congestion level
    if congestion == "high":
        speed = 15.0
        status = "heavy"
        tip = "Heavy traffic corridor — plan for extra buffer"
    elif congestion == "moderate":
        speed = 22.0
        status = "moderate"
        tip = "Moderate city traffic — steady flow"
    else:
        speed = 34.0
        status = "low"
        tip = "Clear route with smooth traffic flow"

    mins = max(5, round((dist_km / speed) * 60))
    mode = "walk" if dist_km <= 0.8 else "drive"

    return TransitLeg(
        from_name=from_name,
        to_name=to_name,
        distance_km=dist_km,
        duration_mins=mins,
        mode=mode,
        traffic_status=status,
        route_tip=tip,
    )


def _format_end_time(start_time_str: str, duration_hours: float) -> str:
    """Compute finish time for an activity."""
    try:
        parts = start_time_str.split(":")
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        total_m = h * 60 + m + int(round(duration_hours * 60))
        end_h = (total_m // 60) % 24
        end_m = total_m % 60
        return f"{end_h:02d}:{end_m:02d}"
    except Exception:
        return ""


def _get_weather_tip(time_str: str, temp_c: float, weather_desc: str) -> str:
    """Generates a practical traveler recommendation based on time-of-day temperature."""
    try:
        hour = int(time_str.split(":")[0])
    except Exception:
        hour = 10
    if hour < 11:
        return f"Morning pleasant window ({temp_c:.0f}°C) — optimal time for outdoor sightseeing before peak heat."
    elif 11 <= hour < 15:
        if temp_c >= 32:
            return f"Midday heat peak ({temp_c:.0f}°C) — shaded or indoor air-conditioned galleries recommended."
        return f"Pleasant midday weather ({temp_c:.0f}°C, {weather_desc})."
    elif 15 <= hour < 18:
        return f"Late afternoon golden light — great for photography and scenic viewpoints."
    else:
        return f"Comfortable evening atmosphere ({temp_c:.0f}°C) — ideal for evening strolls and dinners."


def _get_curator_badge(stop_type: str, order: int) -> str:
    """Assigns an authentic travel badge."""
    if order == 1:
        return "Must-See Highlight"
    type_badges = {
        "fort": "Historic Fortress",
        "palace": "Royal Architecture",
        "beach": "Coastal Scenic",
        "market": "Cultural Bazaar",
        "heritage": "UNESCO Heritage",
        "falls": "Natural Wonder",
        "temple": "Spiritual Landmark",
        "viewpoint": "Panoramic Vista",
        "museum": "Art & History",
        "park": "Nature Retreat",
    }
    return type_badges.get(stop_type.lower(), "Curated Attraction")


async def generate_daily_plan(
    req: DailyPlanRequest,
    destination: str,
    budget_tier: str,
    pace: str,
    travelers: int,
) -> DailyPlanResponse:
    """
    Orchestrates Weather + Traffic + Food agents in parallel,
    then applies ML ranking and spatial transit routing to produce the detailed day plan.
    """

    # ── Step 1: Run all agents concurrently ─────────────────────────────────
    weather_result, traffic_result, food_results, all_places = await asyncio.gather(
        weather_agent.run(destination, req.plan_date),
        traffic_agent.run(destination, req.plan_date),
        food_agent.run(destination, budget_tier),
        get_places(destination, limit=14),
    )

    # ── Step 2: Prepare raw stops safely ─────────────────────────────────────
    cfg      = get_config(budget_tier)
    n_stops  = stops_per_day(pace)

    # Prevent ZeroDivisionError if places list is empty
    if not all_places:
        all_places = [
            {"name": f"{destination.title()} Central Walk", "lat": 20.0, "lon": 75.0, "type": "heritage", "description": "Historic city center exploration."},
            {"name": f"{destination.title()} Local Market", "lat": 20.01, "lon": 75.02, "type": "market", "description": "Authentic regional market and crafts."},
        ]

    # Cyclic, deterministic indexing based on day_number
    day_offset = (max(req.day_number, 1) - 1) * n_stops
    day_places = [all_places[(day_offset + i) % len(all_places)] for i in range(min(n_stops, len(all_places)))]

    # Enrich with cost and duration
    pace_duration = {"relaxed": 2.0, "balanced": 1.5, "fast": 1.0}
    duration = pace_duration.get(pace, 1.5)

    raw_stops = [
        {
            **p,
            "cost_inr":       cfg["activity_per_stop"] * travelers,
            "duration_hours": duration,
        }
        for p in day_places
    ]

    # ── Step 3: ML Ranker scores and sequences stops ───────────────────────────
    ranked_stops = rank_and_sequence(raw_stops, weather_result, traffic_result, budget_tier)

    # ── Step 4: Hotel Information ─────────────────────────────────────────────
    hotel_data = get_hotel(destination, budget_tier)
    hotel = RoughStop(
        name=hotel_data["name"],
        type="hotel",
        description=hotel_data["description"],
        lat=hotel_data.get("lat"),
        lon=hotel_data.get("lon"),
    )

    # ── Step 5: Calculate Step-by-Step Transit Legs & Timing ──────────────────
    total_distance_km = 0.0
    total_transit_mins = 0
    prev_loc = {"name": hotel.name, "lat": hotel.lat, "lon": hotel.lon}

    enriched_stops = []
    for s in ranked_stops:
        transit = _calculate_transit(
            from_name=prev_loc["name"],
            lat1=prev_loc["lat"],
            lon1=prev_loc["lon"],
            to_name=s.name,
            lat2=s.lat,
            lon2=s.lon,
            congestion=traffic_result.overall_congestion,
        )
        total_distance_km += transit.distance_km
        total_transit_mins += transit.duration_mins

        end_time = _format_end_time(s.suggested_time, s.duration_hours)
        weather_tip = _get_weather_tip(s.suggested_time, weather_result.temp_c, weather_result.description)
        curator_badge = _get_curator_badge(s.type, s.order)

        enriched_stop = DetailedStop(
            order=s.order,
            name=s.name,
            type=s.type,
            lat=s.lat,
            lon=s.lon,
            description=s.description,
            suggested_time=s.suggested_time,
            end_time=end_time,
            duration_hours=s.duration_hours,
            cost_inr=s.cost_inr,
            weather_suitable=s.weather_suitable,
            weather_tip=weather_tip,
            curator_badge=curator_badge,
            ml_score=s.ml_score,
            score_breakdown=s.score_breakdown,
            transit_from_previous=transit,
        )
        enriched_stops.append(enriched_stop)
        prev_loc = {"name": s.name, "lat": s.lat, "lon": s.lon}

    # ── Step 6: Select one restaurant per meal type ───────────────────────────
    meals_out = []
    mcosts    = meal_costs(budget_tier)
    for meal_type in ("breakfast", "lunch", "dinner"):
        candidates = [r for r in food_results if r.meal_type == meal_type]
        if candidates:
            best = sorted(candidates, key=lambda r: (not r.on_route, -r.rating))[0]
            meals_out.append(Restaurant(
                name=best.name, cuisine=best.cuisine, rating=best.rating,
                price_band=best.price_band,
                distance_km=best.distance_km,
                on_route=best.on_route,
                lat=best.lat, lon=best.lon,
                meal_type=meal_type,
            ))
        elif food_results:
            fallback_r = food_results[0]
            meals_out.append(Restaurant(
                name=fallback_r.name, cuisine=fallback_r.cuisine, rating=fallback_r.rating,
                price_band=fallback_r.price_band,
                distance_km=fallback_r.distance_km,
                on_route=fallback_r.on_route,
                lat=fallback_r.lat, lon=fallback_r.lon,
                meal_type=meal_type,
            ))

    # ── Step 7: Realistic Daily cost total ────────────────────────────────────
    rooms_needed  = math.ceil(travelers / 2.0)
    hotel_cost    = hotel_data["price_inr"] * rooms_needed
    stop_costs    = sum(s.cost_inr for s in enriched_stops)
    meal_cost     = sum(mcosts.values()) * travelers
    transport     = cfg["daily_base_transport"] + (20 * cfg["transport_per_km"] * (1 + 0.25 * (travelers - 1)))
    daily_total   = hotel_cost + stop_costs + meal_cost + transport

    # ── Step 8: Concierge summary & Route Summary ────────────────────────────
    weather_note = {
        "outdoor_great":     f"Favorable conditions ({weather_result.temp_c:.0f}°C, {weather_result.description}). Outdoor exploration is scheduled during morning and late afternoon hours.",
        "outdoor_ok":        f"Moderate conditions ({weather_result.temp_c:.0f}°C, {weather_result.description}). Good conditions for sightseeing throughout the day.",
        "indoor_preferred":  f"{weather_result.description} ({weather_result.temp_c:.0f}°C). Indoor galleries, covered monuments, and sheltered dining are prioritized.",
    }.get(weather_result.suitability, "")

    traffic_note = (
        f"Recommended departure: {traffic_result.recommended_start} "
        f"({traffic_result.overall_congestion} traffic window). "
        f"Anticipated peak corridors around {', '.join(traffic_result.avoid_times[:2])}."
    )

    top_restaurant = meals_out[1] if len(meals_out) > 1 else (meals_out[0] if meals_out else None)
    food_note = (
        f"Recommended lunch: {top_restaurant.name} ({top_restaurant.cuisine}, rated {top_restaurant.rating}/5) "
        f"— {'located directly along your route' if top_restaurant.on_route else f'{top_restaurant.distance_km} km detour'}."
        if top_restaurant else ""
    )

    agent_summary = "  ".join(filter(None, [weather_note, traffic_note, food_note]))
    route_summary = f"Curated circuit of {len(enriched_stops)} stops spanning {total_distance_km:.1f} km ({total_transit_mins} mins transit time), originating and concluding at {hotel.name}."


    return DailyPlanResponse(
        trip_id=req.trip_id,
        day_number=req.day_number,
        plan_date=req.plan_date,
        destination=destination,
        weather=weather_result,
        traffic=traffic_result,
        stops=enriched_stops,
        meals=meals_out,
        hotel=hotel,
        daily_total_inr=round(daily_total, 2),
        agent_summary=agent_summary,
        total_distance_km=round(total_distance_km, 1),
        total_transit_mins=total_transit_mins,
        route_summary=route_summary,
    )
