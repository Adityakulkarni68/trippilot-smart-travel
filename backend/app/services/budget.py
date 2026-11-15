"""Budget tier cost configuration — all values in INR per person."""

BUDGET_CONFIG = {
    "budget": {
        "hotel_range":         (500, 1500),
        "food_per_day":        400,
        "activity_per_stop":   150,
        "transport_per_km":    2.0,
        "daily_base_transport":150,
    },
    "mid": {
        "hotel_range":         (1500, 5000),
        "food_per_day":        1000,
        "activity_per_stop":   400,
        "transport_per_km":    5.0,
        "daily_base_transport":400,
    },
    "luxury": {
        "hotel_range":         (5000, 20000),
        "food_per_day":        3000,
        "activity_per_stop":   900,
        "transport_per_km":    12.0,
        "daily_base_transport":1200,
    },
}

PACE_STOPS = {"relaxed": 2, "balanced": 4, "fast": 6}

MEAL_SPLIT = {"breakfast": 0.20, "lunch": 0.35, "dinner": 0.45}


def get_config(tier: str) -> dict:
    return BUDGET_CONFIG.get(tier, BUDGET_CONFIG["mid"])


def stops_per_day(pace: str) -> int:
    return PACE_STOPS.get(pace, 3)


def meal_costs(tier: str) -> dict:
    daily = get_config(tier)["food_per_day"]
    return {m: round(daily * f, 2) for m, f in MEAL_SPLIT.items()}
