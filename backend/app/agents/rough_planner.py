"""
PHASE 1 — ROUGH PLANNER
────────────────────────
Generates the skeleton itinerary at booking time.
No real-time data needed — this is the overview the user reviews before travel.

Output: day-by-day areas, themes, highlights, hotel zones, realistic cost estimate.
"""
import math
from typing import List
from app.schemas.trip import TripRequest, RoughPlanResponse, RoughDay, RoughStop
from app.services.places import get_places
from app.services.hotels import get_hotel
from app.services.budget import get_config, stops_per_day, meal_costs


THEMES = {
    "goa":     ["Beaches & Water Sports", "Forts & Heritage", "Markets & Nightlife", "Nature & Falls", "Relaxation Day"],
    "jaipur":  ["Pink City Heritage", "Forts & Palaces", "Art, Craft & Cuisine", "Temples & Gardens"],
    "mumbai":  ["Colonial Heritage & Sea", "Island Excursion", "Markets & Street Food", "Modern Mumbai"],
    "delhi":   ["Mughal History", "New Delhi & Monuments", "Old Delhi Streets", "Museums & Culture"],
    "manali":  ["Valley Exploration", "High Altitude Pass", "Adventure Sports", "Temple & Local Life"],
    "agra":    ["The Taj & Mughal Trail", "Fatehpur Sikri Excursion", "Artisan Quarter"],
}

AREAS = {
    "goa":     ["North Goa", "South Goa", "Panaji Area", "Dudhsagar Hinterland", "Coastal Belt"],
    "jaipur":  ["Old City (Walled City)", "Amber-Jaigarh Area", "City Centre", "Outskirts"],
    "mumbai":  ["South Mumbai / Colaba", "Elephanta Island", "Bandra-Juhu", "Navi Mumbai"],
    "delhi":   ["Old Delhi / Shahjahanabad", "Lutyens Delhi", "South Delhi", "Central Delhi"],
    "manali":  ["Old Manali & Mall Road", "Solang-Rohtang", "Kullu Valley", "Naggar"],
    "agra":    ["Taj Ganj Area", "Fatehpur Sikri", "Agra Cantonment"],
}


async def generate_rough_plan(req: TripRequest, trip_id: int) -> RoughPlanResponse:
    cfg        = get_config(req.budget_tier)
    n_stops    = stops_per_day(req.pace)
    meals      = meal_costs(req.budget_tier)
    all_places = await get_places(req.destination, limit=max(n_stops * req.num_days, 12))

    dest_key   = req.destination.lower().strip()
    themes     = THEMES.get(dest_key, [f"Day {i} Exploration" for i in range(1, req.num_days + 1)])
    areas      = AREAS.get(dest_key,  [f"{req.destination.title()} Area" for _ in range(req.num_days)])

    days: List[RoughDay] = []
    cursor = 0
    grand_total = 0.0

    # Realistic hotel rooms calculation (2 guests per room)
    rooms_needed = math.ceil(req.travelers / 2.0)

    for day_num in range(1, req.num_days + 1):
        if not all_places:
            day_places = []
        else:
            day_places = all_places[cursor: cursor + n_stops]
            cursor += n_stops
            if not day_places or len(day_places) < n_stops:
                cursor = 0
                day_places = [all_places[i % len(all_places)] for i in range(n_stops)]

        hotel   = get_hotel(req.destination, req.budget_tier)
        theme   = themes[(day_num - 1) % len(themes)]
        area    = areas[(day_num - 1) % len(areas)]

        highlights = [
            RoughStop(
                name=p["name"],
                type=p.get("type", "attraction"),
                description=p.get("description"),
                lat=p.get("lat"),
                lon=p.get("lon"),
            )
            for p in day_places
        ]

        # Realistic party cost estimation
        hotel_cost     = hotel["price_inr"] * rooms_needed
        activity_cost  = cfg["activity_per_stop"] * n_stops * req.travelers
        food_cost      = sum(meals.values()) * req.travelers
        # Base party transport + mileage
        transport_cost = cfg["daily_base_transport"] + (20 * cfg["transport_per_km"] * (1 + 0.25 * (req.travelers - 1)))
        day_total      = hotel_cost + activity_cost + food_cost + transport_cost
        grand_total   += day_total

        days.append(RoughDay(
            day=day_num,
            area=area,
            theme=theme,
            highlights=highlights,
            hotel_zone=hotel["zone"],
            est_cost_inr=round(day_total, 2),
        ))

    summary = (
        f"{req.num_days}-day {req.pace} trip to {req.destination.title()} "
        f"for {req.travelers} traveler{'s' if req.travelers > 1 else ''} — {req.budget_tier} budget. "
        f"Estimated total ₹{grand_total:,.0f}. "
        f"Daily plans will be dynamically curated the night before each travel day based on live weather, traffic, and restaurant data."
    )

    return RoughPlanResponse(
        trip_id=trip_id,
        destination=req.destination,
        num_days=req.num_days,
        budget_tier=req.budget_tier,
        pace=req.pace,
        travelers=req.travelers,
        days=days,
        grand_total_inr=round(grand_total, 2),
        summary=summary,
    )
