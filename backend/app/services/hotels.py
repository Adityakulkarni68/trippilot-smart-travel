"""Hotel recommendation service — price-band filtered with fallback dataset."""
import random
from typing import Dict, Any
from app.services.budget import get_config

HOTELS = {
    "goa": [
        {"name": "Zostel Goa",                "lat": 15.5553, "lon": 73.7517, "price": 700,   "tier": "budget", "zone": "Baga"},
        {"name": "The Hosteller Goa",         "lat": 15.5541, "lon": 73.7540, "price": 900,   "tier": "budget", "zone": "Calangute"},
        {"name": "Casa Sea Shell",            "lat": 15.5500, "lon": 73.7500, "price": 2200,  "tier": "mid",    "zone": "Calangute"},
        {"name": "Lemon Tree Candolim",       "lat": 15.5180, "lon": 73.7640, "price": 3800,  "tier": "mid",    "zone": "Candolim"},
        {"name": "Taj Holiday Village",       "lat": 15.5148, "lon": 73.7619, "price": 12000, "tier": "luxury", "zone": "Sinquerim"},
        {"name": "W Goa",                     "lat": 15.5973, "lon": 73.7370, "price": 18000, "tier": "luxury", "zone": "Vagator"},
    ],
    "jaipur": [
        {"name": "Moustache Hostel Jaipur",   "lat": 26.9200, "lon": 75.8200, "price": 600,   "tier": "budget", "zone": "Old City"},
        {"name": "Hotel Pearl Palace",        "lat": 26.9181, "lon": 75.8041, "price": 1200,  "tier": "budget", "zone": "Hathroi"},
        {"name": "Dera Mandawa",              "lat": 26.9310, "lon": 75.8190, "price": 2800,  "tier": "mid",    "zone": "C-Scheme"},
        {"name": "Hotel Sarang Palace",       "lat": 26.9222, "lon": 75.8149, "price": 4200,  "tier": "mid",    "zone": "Civil Lines"},
        {"name": "Rambagh Palace",            "lat": 26.8929, "lon": 75.8126, "price": 15000, "tier": "luxury", "zone": "Bhawani Singh Road"},
    ],
    "mumbai": [
        {"name": "Zostel Mumbai",             "lat": 18.9396, "lon": 72.8355, "price": 800,   "tier": "budget", "zone": "Colaba"},
        {"name": "Hotel Moti International",  "lat": 18.9627, "lon": 72.8310, "price": 1400,  "tier": "budget", "zone": "Bandra"},
        {"name": "Trident Nariman Point",     "lat": 18.9257, "lon": 72.8233, "price": 5000,  "tier": "mid",    "zone": "Nariman Point"},
        {"name": "Taj Mahal Palace",          "lat": 18.9217, "lon": 72.8332, "price": 19000, "tier": "luxury", "zone": "Colaba"},
    ],
    "delhi": [
        {"name": "Stops Hostel Delhi",        "lat": 28.6100, "lon": 77.2300, "price": 700,   "tier": "budget", "zone": "Paharganj"},
        {"name": "Bloom Hotel",               "lat": 28.5215, "lon": 77.1499, "price": 3200,  "tier": "mid",    "zone": "Vasant Kunj"},
        {"name": "The Imperial",              "lat": 28.6214, "lon": 77.2190, "price": 14000, "tier": "luxury", "zone": "Connaught Place"},
    ],
    "manali": [
        {"name": "Snow Valley Resorts",       "lat": 32.2430, "lon": 77.1892, "price": 1000,  "tier": "budget", "zone": "Mall Road"},
        {"name": "Solang Valley Resort",      "lat": 32.3215, "lon": 77.1580, "price": 3500,  "tier": "mid",    "zone": "Solang"},
        {"name": "The Himalayan",             "lat": 32.2348, "lon": 77.1885, "price": 8000,  "tier": "luxury", "zone": "Model Town"},
    ],
}

GENERIC_HOTELS = [
    {"name": "Budget Traveller Inn", "lat": None, "lon": None, "price": 900,   "tier": "budget", "zone": "City Centre"},
    {"name": "City Comforts Hotel",  "lat": None, "lon": None, "price": 2500,  "tier": "mid",    "zone": "City Centre"},
    {"name": "Grand Luxury Suites",  "lat": None, "lon": None, "price": 10000, "tier": "luxury", "zone": "City Centre"},
]


def get_hotel(destination: str, budget_tier: str) -> Dict[str, Any]:
    key    = destination.lower().strip()
    hotels = HOTELS.get(key, GENERIC_HOTELS)
    cfg    = get_config(budget_tier)
    lo, hi = cfg["hotel_range"]

    matching = [h for h in hotels if lo <= h["price"] <= hi]
    if not matching:
        matching = [h for h in hotels if h["tier"] == budget_tier]
    if not matching:
        matching = hotels

    h = random.choice(matching)
    return {
        "name": h["name"], "lat": h.get("lat"), "lon": h.get("lon"),
        "type": "hotel", "description": f"{h['zone']} area · ₹{h['price']:,}/night",
        "price_inr": h["price"], "zone": h["zone"],
    }
