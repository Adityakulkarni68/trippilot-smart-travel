"""
Attraction discovery service.
Priority: Geoapify → Google Places → hardcoded fallback
"""
import httpx
from typing import List, Dict, Any
from app.config import settings

FALLBACK: Dict[str, List[Dict]] = {
    "goa": [
        {"name": "Baga Beach",          "lat": 15.5553, "lon": 73.7517, "type": "beach",      "description": "Popular beach with water sports and beach shacks"},
        {"name": "Fort Aguada",         "lat": 15.4945, "lon": 73.7730, "type": "fort",       "description": "17th-century Portuguese sea fort with lighthouse"},
        {"name": "Dudhsagar Falls",     "lat": 15.3144, "lon": 74.3148, "type": "falls",      "description": "Stunning four-tiered waterfall on the Mandovi river"},
        {"name": "Calangute Beach",     "lat": 15.5438, "lon": 73.7546, "type": "beach",      "description": "Queen of Beaches in Goa — lively and scenic"},
        {"name": "Old Goa Churches",    "lat": 15.5008, "lon": 73.9116, "type": "heritage",   "description": "UNESCO World Heritage churches including Basilica of Bom Jesus"},
        {"name": "Anjuna Flea Market",  "lat": 15.5740, "lon": 73.7404, "type": "market",     "description": "Vibrant weekly flea market every Wednesday"},
        {"name": "Chapora Fort",        "lat": 15.5995, "lon": 73.7393, "type": "fort",       "description": "16th century fort with panoramic views of Vagator beach"},
    ],
    "jaipur": [
        {"name": "Amber Fort",          "lat": 26.9855, "lon": 75.8513, "type": "fort",       "description": "Majestic hilltop fort with mirror palace — UNESCO site"},
        {"name": "Hawa Mahal",          "lat": 26.9239, "lon": 75.8267, "type": "palace",     "description": "Palace of Winds — iconic pink facade with 953 windows"},
        {"name": "City Palace",         "lat": 26.9258, "lon": 75.8237, "type": "palace",     "description": "Royal palace complex still home to the royal family"},
        {"name": "Jantar Mantar",       "lat": 26.9246, "lon": 75.8242, "type": "heritage",   "description": "UNESCO astronomical observatory with massive instruments"},
        {"name": "Nahargarh Fort",      "lat": 26.9387, "lon": 75.8004, "type": "fort",       "description": "Viewpoint fort — best sunset view in Jaipur"},
        {"name": "Albert Hall Museum",  "lat": 26.9121, "lon": 75.8195, "type": "museum",     "description": "Oldest museum in Rajasthan — Indo-Saracenic architecture"},
    ],
    "mumbai": [
        {"name": "Gateway of India",           "lat": 18.9220, "lon": 72.8347, "type": "monument",  "description": "Iconic arch monument overlooking the Arabian Sea"},
        {"name": "Marine Drive",               "lat": 18.9440, "lon": 72.8237, "type": "viewpoint",  "description": "3.6 km seafront promenade — the Queen's Necklace"},
        {"name": "Elephanta Caves",            "lat": 18.9633, "lon": 72.9315, "type": "heritage",   "description": "UNESCO rock-cut cave temples from the 5th century"},
        {"name": "Chhatrapati Shivaji Terminus","lat": 18.9400, "lon": 72.8351, "type": "heritage",   "description": "UNESCO Victorian Gothic railway station built in 1888"},
        {"name": "Juhu Beach",                 "lat": 19.0883, "lon": 72.8260, "type": "beach",      "description": "Popular beach known for street food and sunsets"},
        {"name": "Sanjay Gandhi National Park","lat": 19.2147, "lon": 72.9107, "type": "park",       "description": "Urban national park with ancient Kanheri Caves"},
    ],
    "delhi": [
        {"name": "Red Fort",            "lat": 28.6562, "lon": 77.2410, "type": "fort",       "description": "Mughal-era UNESCO fortress — symbol of India"},
        {"name": "Qutub Minar",         "lat": 28.5245, "lon": 77.1855, "type": "heritage",   "description": "UNESCO 73m minaret built in 1193 — oldest in Delhi"},
        {"name": "India Gate",          "lat": 28.6129, "lon": 77.2295, "type": "monument",   "description": "War memorial arch at the heart of New Delhi"},
        {"name": "Humayun's Tomb",      "lat": 28.5933, "lon": 77.2507, "type": "heritage",   "description": "UNESCO Mughal mausoleum — precursor to the Taj Mahal"},
        {"name": "Lotus Temple",        "lat": 28.5535, "lon": 77.2588, "type": "temple",     "description": "Stunning Bahá'í House of Worship shaped like a lotus"},
        {"name": "Chandni Chowk",       "lat": 28.6506, "lon": 77.2303, "type": "market",     "description": "Iconic 17th century bazaar — street food and spices"},
    ],
    "manali": [
        {"name": "Rohtang Pass",        "lat": 32.3729, "lon": 77.2468, "type": "pass",       "description": "High altitude mountain pass at 3978m with snow"},
        {"name": "Solang Valley",       "lat": 32.3219, "lon": 77.1588, "type": "valley",     "description": "Adventure sports valley — skiing, paragliding, zorbing"},
        {"name": "Hadimba Temple",      "lat": 32.2430, "lon": 77.1890, "type": "temple",     "description": "Unique 1553 wooden temple in ancient deodar cedar forest"},
        {"name": "Mall Road",           "lat": 32.2396, "lon": 77.1887, "type": "market",     "description": "Main shopping and dining promenade of Manali"},
        {"name": "Beas River",          "lat": 32.2350, "lon": 77.1920, "type": "viewpoint",  "description": "Scenic river with riverside walks and rafting"},
    ],
    "agra": [
        {"name": "Taj Mahal",           "lat": 27.1751, "lon": 78.0421, "type": "heritage",   "description": "UNESCO wonder of the world — Mughal marble mausoleum"},
        {"name": "Agra Fort",           "lat": 27.1800, "lon": 78.0219, "type": "fort",       "description": "UNESCO Mughal fort — residence of Mughal emperors"},
        {"name": "Fatehpur Sikri",      "lat": 27.0945, "lon": 77.6614, "type": "heritage",   "description": "UNESCO abandoned Mughal city built by Akbar in 1571"},
        {"name": "Mehtab Bagh",         "lat": 27.1822, "lon": 78.0384, "type": "garden",     "description": "Moonlit garden directly across the Taj — best sunset view"},
    ],
}

GENERIC = [
    {"name": "City Heritage Walk",  "lat": None, "lon": None, "type": "heritage", "description": "Guided walk through the historic old quarters"},
    {"name": "Local Museum",        "lat": None, "lon": None, "type": "museum",   "description": "Discover local history, art and culture"},
    {"name": "Botanical Garden",    "lat": None, "lon": None, "type": "garden",   "description": "Peaceful green space with native flora"},
    {"name": "Viewpoint Hill",      "lat": None, "lon": None, "type": "viewpoint","description": "Panoramic views of the city and surroundings"},
    {"name": "Local Craft Market",  "lat": None, "lon": None, "type": "market",   "description": "Shop for local handicrafts and souvenirs"},
]


async def get_places(destination: str, limit: int = 12) -> List[Dict]:
    # Try Geoapify
    if settings.GEOAPIFY_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                geo = await client.get(
                    "https://api.geoapify.com/v1/geocode/search",
                    params={"text": destination, "apiKey": settings.GEOAPIFY_API_KEY, "limit": 1},
                )
                geo.raise_for_status()
                coords = geo.json()["features"][0]["geometry"]["coordinates"]
                resp = await client.get(
                    "https://api.geoapify.com/v2/places",
                    params={
                        "categories": "tourism.attraction,tourism.sights",
                        "filter": f"circle:{coords[0]},{coords[1]},10000",
                        "limit": limit,
                        "apiKey": settings.GEOAPIFY_API_KEY,
                    },
                )
                resp.raise_for_status()
                features = resp.json().get("features", [])
                if features:
                    return [
                        {
                            "name": f["properties"].get("name", "Place"),
                            "lat": f["geometry"]["coordinates"][1],
                            "lon": f["geometry"]["coordinates"][0],
                            "type": "attraction",
                            "description": f["properties"].get("categories", [""])[0].replace(".", " ").title(),
                        }
                        for f in features
                    ]
        except Exception:
            pass

    # Fallback
    key = destination.lower().strip()
    places = FALLBACK.get(key, GENERIC)
    return places[:limit]
