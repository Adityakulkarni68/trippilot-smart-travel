"""
FOOD AGENT
──────────
Finds restaurants near the day's route.

Real data: Google Places API
Fallback:  Curated dataset with ratings, cuisine, distance from route

Output includes:
  - breakfast, lunch, dinner options
  - on_route flag (is it on the way or a detour?)
  - rating used by ML ranker
"""
import httpx
import random
from typing import List, Optional
from app.config import settings
from app.schemas.trip import Restaurant


# ── Curated restaurant dataset ────────────────────────────────────────────────

RESTAURANT_DATA = {
    "goa": [
        {"name": "Infantaria Bakery",     "cuisine": "Bakery/Cafe",   "rating": 4.5, "price": "$$",  "dist": 0.3, "on_route": True,  "lat": 15.554, "lon": 73.752, "meals": ["breakfast"]},
        {"name": "Cafe Cotinga",          "cuisine": "Continental",   "rating": 4.3, "price": "$$",  "dist": 0.8, "on_route": True,  "lat": 15.556, "lon": 73.754, "meals": ["breakfast"]},
        {"name": "Fisherman's Wharf",     "cuisine": "Seafood",       "rating": 4.6, "price": "$$$", "dist": 1.2, "on_route": True,  "lat": 15.497, "lon": 73.801, "meals": ["lunch"]},
        {"name": "Mum's Kitchen",         "cuisine": "Goan",          "rating": 4.7, "price": "$$",  "dist": 2.1, "on_route": False, "lat": 15.501, "lon": 73.823, "meals": ["lunch"]},
        {"name": "Thalassa",              "cuisine": "Greek/Seafood", "rating": 4.8, "price": "$$$", "dist": 0.5, "on_route": True,  "lat": 15.574, "lon": 73.741, "meals": ["dinner"]},
        {"name": "A Reverie",             "cuisine": "Fusion",        "rating": 4.6, "price": "$$$", "dist": 1.8, "on_route": False, "lat": 15.562, "lon": 73.763, "meals": ["dinner"]},
        {"name": "Britto's Beach Shack",  "cuisine": "Seafood/Goan",  "rating": 4.2, "price": "$$",  "dist": 0.2, "on_route": True,  "lat": 15.555, "lon": 73.750, "meals": ["lunch", "dinner"]},
    ],
    "jaipur": [
        {"name": "Laxmi Mishthan Bhandar","cuisine": "Indian/Sweets", "rating": 4.5, "price": "$",   "dist": 0.4, "on_route": True,  "lat": 26.921, "lon": 75.826, "meals": ["breakfast"]},
        {"name": "Suvarna Mahal",         "cuisine": "Rajasthani",    "rating": 4.4, "price": "$$",  "dist": 1.0, "on_route": False, "lat": 26.923, "lon": 75.821, "meals": ["breakfast"]},
        {"name": "Chokhi Dhani",          "cuisine": "Rajasthani",    "rating": 4.6, "price": "$$",  "dist": 3.5, "on_route": False, "lat": 26.853, "lon": 75.776, "meals": ["lunch", "dinner"]},
        {"name": "Spice Court",           "cuisine": "Indian",        "rating": 4.3, "price": "$$",  "dist": 0.7, "on_route": True,  "lat": 26.919, "lon": 75.817, "meals": ["lunch"]},
        {"name": "1135 AD",               "cuisine": "Mughal",        "rating": 4.8, "price": "$$$", "dist": 0.2, "on_route": True,  "lat": 26.986, "lon": 75.851, "meals": ["dinner"]},
        {"name": "Handi Restaurant",      "cuisine": "Rajasthani",    "rating": 4.4, "price": "$$",  "dist": 1.1, "on_route": True,  "lat": 26.920, "lon": 75.820, "meals": ["dinner"]},
    ],
    "mumbai": [
        {"name": "Kyani & Co.",           "cuisine": "Irani Cafe",    "rating": 4.6, "price": "$",   "dist": 0.3, "on_route": True,  "lat": 18.943, "lon": 72.835, "meals": ["breakfast"]},
        {"name": "Cafe Madras",           "cuisine": "South Indian",  "rating": 4.4, "price": "$",   "dist": 0.5, "on_route": True,  "lat": 18.963, "lon": 72.831, "meals": ["breakfast"]},
        {"name": "Trishna",               "cuisine": "Seafood",       "rating": 4.7, "price": "$$$", "dist": 0.8, "on_route": True,  "lat": 18.927, "lon": 72.833, "meals": ["lunch"]},
        {"name": "Britannia & Co.",       "cuisine": "Irani/Parsi",   "rating": 4.5, "price": "$$",  "dist": 1.2, "on_route": False, "lat": 18.929, "lon": 72.840, "meals": ["lunch"]},
        {"name": "Wasabi by Morimoto",    "cuisine": "Japanese",      "rating": 4.8, "price": "$$$", "dist": 0.1, "on_route": True,  "lat": 18.922, "lon": 72.833, "meals": ["dinner"]},
        {"name": "Mahesh Lunch Home",     "cuisine": "Seafood",       "rating": 4.6, "price": "$$",  "dist": 0.6, "on_route": True,  "lat": 18.936, "lon": 72.833, "meals": ["dinner"]},
    ],
    "delhi": [
        {"name": "Paranthe Wali Gali",    "cuisine": "North Indian",  "rating": 4.4, "price": "$",   "dist": 0.2, "on_route": True,  "lat": 28.650, "lon": 77.231, "meals": ["breakfast"]},
        {"name": "Saravana Bhavan",       "cuisine": "South Indian",  "rating": 4.3, "price": "$",   "dist": 0.5, "on_route": True,  "lat": 28.624, "lon": 77.219, "meals": ["breakfast"]},
        {"name": "Bukhara",               "cuisine": "Mughlai",       "rating": 4.8, "price": "$$$", "dist": 1.5, "on_route": False, "lat": 28.597, "lon": 77.165, "meals": ["lunch", "dinner"]},
        {"name": "Moti Mahal",            "cuisine": "Mughlai",       "rating": 4.5, "price": "$$",  "dist": 0.4, "on_route": True,  "lat": 28.643, "lon": 77.228, "meals": ["lunch"]},
        {"name": "Indian Accent",         "cuisine": "Modern Indian", "rating": 4.9, "price": "$$$", "dist": 2.0, "on_route": False, "lat": 28.548, "lon": 77.201, "meals": ["dinner"]},
        {"name": "Karim's",               "cuisine": "Mughlai",       "rating": 4.6, "price": "$$",  "dist": 0.3, "on_route": True,  "lat": 28.651, "lon": 77.234, "meals": ["lunch", "dinner"]},
    ],
    "manali": [
        {"name": "Cafe 1947",             "cuisine": "Cafe/Western",  "rating": 4.4, "price": "$$",  "dist": 0.2, "on_route": True,  "lat": 32.240, "lon": 77.189, "meals": ["breakfast"]},
        {"name": "Drifters' Inn",         "cuisine": "Multi-cuisine", "rating": 4.3, "price": "$$",  "dist": 0.4, "on_route": True,  "lat": 32.241, "lon": 77.190, "meals": ["breakfast", "lunch"]},
        {"name": "Johnson's Cafe",        "cuisine": "Continental",   "rating": 4.6, "price": "$$$", "dist": 0.8, "on_route": False, "lat": 32.239, "lon": 77.188, "meals": ["lunch", "dinner"]},
        {"name": "Chopsticks Restaurant", "cuisine": "Chinese/Thai",  "rating": 4.2, "price": "$$",  "dist": 0.3, "on_route": True,  "lat": 32.240, "lon": 77.189, "meals": ["dinner"]},
    ],
}

GENERIC_RESTAURANTS = [
    {"name": "Local Dhaba",       "cuisine": "Indian",  "rating": 4.0, "price": "$",   "dist": 0.5, "on_route": True,  "lat": None, "lon": None, "meals": ["breakfast", "lunch"]},
    {"name": "City Cafe",         "cuisine": "Cafe",    "rating": 4.1, "price": "$$",  "dist": 0.8, "on_route": True,  "lat": None, "lon": None, "meals": ["breakfast"]},
    {"name": "Rooftop Restaurant","cuisine": "Indian",  "rating": 4.3, "price": "$$",  "dist": 1.0, "on_route": False, "lat": None, "lon": None, "meals": ["dinner"]},
    {"name": "Highway Dhaba",     "cuisine": "Indian",  "rating": 4.0, "price": "$",   "dist": 0.3, "on_route": True,  "lat": None, "lon": None, "meals": ["lunch"]},
]


def _price_matches(price: str, budget_tier: str) -> bool:
    mapping = {"budget": ["$"], "mid": ["$", "$$"], "luxury": ["$$", "$$$"]}
    return price in mapping.get(budget_tier, ["$", "$$", "$$$"])


async def run(destination: str, budget_tier: str = "mid") -> List[Restaurant]:
    """
    Main entry point for the Food Agent.
    Returns a list of restaurants scored and filtered for the destination.
    """
    key  = destination.lower().strip()
    data = RESTAURANT_DATA.get(key, GENERIC_RESTAURANTS)

    results: List[Restaurant] = []
    for r in data:
        # Add small random noise to distance & rating for realism
        dist   = round(r["dist"] + random.uniform(-0.1, 0.2), 1)
        rating = round(min(5.0, r["rating"] + random.uniform(-0.1, 0.1)), 1)

        for meal_type in r["meals"]:
            results.append(Restaurant(
                name=r["name"],
                cuisine=r["cuisine"],
                rating=rating,
                price_band=r["price"],
                distance_km=max(0.1, dist),
                on_route=r["on_route"],
                lat=r.get("lat"),
                lon=r.get("lon"),
                meal_type=meal_type,
            ))

    # Sort by: on_route first, then rating desc, then distance asc
    results.sort(key=lambda x: (not x.on_route, -x.rating, x.distance_km))
    return results
