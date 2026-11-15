# 🗺️ TripPilot — Smart Travel Planning & Recommendation System

> **B.Tech Major Project | Dept. of CSE (AI & ML) | GRIET, Hyderabad**  
> Mohammed Amer · Aditya Manoj Kulkarni · Budda Sathwik  
> Guide: Ms. P. Nethrasri

An AI-powered two-phase travel planning platform that generates a rough itinerary at booking time, then dynamically optimises each day's plan the night before travel using three autonomous agents and a numpy-based ML ranker.

---

## 📌 Problem Statement

Existing travel apps give every user the same **static, generic itinerary** decided at booking time. That plan never updates — it doesn't know if it will rain on Day 2, that the highway to the fort has a 45-minute jam at 9am, or that a highly-rated restaurant is just 300m off your route.

**TripPilot solves this with a two-phase approach.**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│  Phase 1 View: Rough itinerary, day tabs, cost estimate     │
│  Phase 2 View: Weather card, Traffic card, ML stops, Food   │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API (Axios)
┌───────────────────────▼─────────────────────────────────────┐
│                  FASTAPI BACKEND (Python)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            DAILY ORCHESTRATOR AGENT                  │   │
│  │   asyncio.gather() — all 3 agents run IN PARALLEL   │   │
│  └──────┬──────────────┬──────────────┬────────────────┘   │
│         │              │              │                     │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐             │
│  │   WEATHER   │ │  TRAFFIC   │ │   FOOD    │             │
│  │    AGENT    │ │   AGENT    │ │   AGENT   │             │
│  │             │ │            │ │           │             │
│  │OpenWeather  │ │  TomTom /  │ │ Curated   │             │
│  │API / Mock   │ │Time Model  │ │ Dataset   │             │
│  └──────┬──────┘ └─────┬──────┘ └────┬──────┘             │
│         └──────────────┴──────────────┘                     │
│                        │                                    │
│              ┌─────────▼──────────┐                        │
│              │    ML RANKER        │                        │
│              │  (numpy weighted)   │                        │
│              │                     │                        │
│              │  score = W · F      │                        │
│              │  W = [0.30, 0.25,   │                        │
│              │       0.20, 0.15,   │                        │
│              │       0.10]         │                        │
│              │                     │                        │
│              │  Factors:           │                        │
│              │  • Weather suit.    │                        │
│              │  • Traffic score    │                        │
│              │  • Popularity       │                        │
│              │  • Haversine dist.  │                        │
│              │  • Budget match     │                        │
│              └─────────┬──────────┘                        │
│                        │  Ordered stops + visit times       │
└───────────────────────┬┴────────────────────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  PostgreSQL / SQLite │
              │  users, trips,       │
              │  daily_plans,        │
              │  bookmarks, reviews  │
              └─────────────────────┘
```

---

## 🔄 Two-Phase Planning Flow

```
PHASE 1 — At Booking Time
─────────────────────────
User fills form (destination, days, budget, pace, travelers)
    → Rough Planner Agent runs
    → Day-wise areas, themes, highlights, hotel zones
    → Estimated cost breakdown
    → Saved to DB

PHASE 2 — Night Before Each Travel Day
────────────────────────────────────────
User clicks "Generate Day N Plan"
    → asyncio.gather() fires all 3 agents simultaneously:
        🌦 Weather Agent  → temperature, suitability score 0–1
        🚗 Traffic Agent  → congestion windows, best start time
        🍽 Food Agent     → on-route restaurants, rated & sorted
    → ML Ranker scores each stop out of 10
    → Stops ordered, visit times assigned
    → Detailed plan returned with full breakdown
```

---

## ✨ Key Features

| Feature | Detail |
|---|---|
| Two-phase planning | Rough overview at booking + live plan night before |
| Parallel agents | 3 agents run simultaneously via `asyncio.gather()` |
| ML ranking | numpy weighted dot product across 5 factors |
| Haversine routing | Real GPS distance between stops for proximity scoring |
| Budget tiers | Budget / Mid-range / Luxury cost constraints |
| Travel pace | Relaxed (2 stops) / Balanced (4) / Fast (6) per day |
| Fallback resilience | Works fully without any API keys |
| Firebase Auth | Google, Email, Guest login |
| Interactive map | Leaflet + OpenStreetMap — all stops plotted |
| Community reviews | TripAdvisor-style bubble ratings |
| Wishlist | Save hotels, attractions, restaurants |
| Travel news | Live advisories via Google News RSS + curated dataset |

---

## 🤖 ML Ranker — How It Works

Each tourist stop gets a **composite score out of 10**:

```
score = (0.30 × weather_suitability)
      + (0.25 × traffic_score_at_visit_time)
      + (0.20 × landmark_popularity)
      + (0.15 × haversine_proximity_score)
      + (0.10 × budget_match_score)

final_score = score × 10
```

Implemented in `backend/app/ml/ranker.py` using `numpy`:
```python
factor_matrix = np.column_stack([weather, traffic, popularity, distance, budget])
composite     = factor_matrix @ WEIGHTS          # vectorised dot product
order         = np.argsort(composite)[::-1]      # sort descending
```

---

## 🌐 External APIs Used

| API | Used For | Free Tier |
|---|---|---|
| **OpenWeatherMap** | Live temperature, humidity, wind | 1,000 calls/day |
| **Geoapify** | Tourist attraction discovery near a city | 3,000 calls/day |
| **TomTom Traffic Flow** | Real-time road congestion | 2,500 calls/day |
| **OpenRouteService** | Actual road distance (Haversine fallback) | 2,000 calls/day |
| **Google News RSS** | Live travel advisory headlines | Free (public RSS) |
| **Firebase Auth** | Google / Email / Guest login | Free (Spark plan) |

> All keys are **optional** — the system uses realistic fallback data when keys are absent.

---

## 🗄️ Our Custom Dataset

We built a **manually curated dataset** from Google Maps, Wikipedia, Zomato, and MakeMyTrip:

| Dataset | Entries | Fields |
|---|---|---|
| Tourist Attractions | 40+ across 6 cities | name, lat, lon, type, description, popularity score |
| Hotels | 30+ | name, price/night INR, tier, zone, GPS |
| Restaurants | 35+ | name, cuisine, rating, on-route flag, meal type, price band |
| Traffic Profiles | 3 city types × 16 time windows | congestion score per hour |
| Weather Profiles | 6 cities × 3 seasons | temp, humidity, wind, description |
| News Advisories | 8 curated articles | category, destination, urgency flag |

**Cities covered:** Goa · Jaipur · Mumbai · Delhi · Manali · Agra

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.12 | Core language |
| FastAPI | REST API framework, auto Swagger docs |
| SQLAlchemy | ORM — Python class → DB table |
| Alembic | Database migrations |
| numpy | ML weighted scoring (vectorised dot product) |
| httpx | Async HTTP calls to external APIs |
| asyncio | Parallel agent execution |
| Pydantic | Request/response validation |
| SQLite (dev) / PostgreSQL (prod) | Data persistence |
| python-jose | JWT token handling |
| passlib/bcrypt | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side navigation |
| Axios | HTTP calls + request interceptors |
| Firebase Auth | Google / Email / Guest login |
| Leaflet + React-Leaflet | Interactive maps (OpenStreetMap) |
| Context API | Global auth + bookmark state |
| CSS Custom Properties | Full design system (no UI library) |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerisation |
| Docker Compose | Orchestrates all 3 services |
| Nginx | Serves React build, proxies /api/ |

---

## 📁 Repository Structure

```
smart-travel-guide/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── weather_agent.py      # Weather Agent
│   │   │   ├── traffic_agent.py      # Traffic Agent
│   │   │   ├── food_agent.py         # Food Agent
│   │   │   ├── rough_planner.py      # Phase 1
│   │   │   └── daily_orchestrator.py # Phase 2 (asyncio.gather)
│   │   ├── ml/
│   │   │   └── ranker.py             # numpy ML ranker
│   │   ├── api/
│   │   │   ├── auth.py               # Firebase sync
│   │   │   ├── plan.py               # Phase 1 + Phase 2 endpoints
│   │   │   ├── weather.py            # Weather endpoint
│   │   │   ├── traffic.py            # Traffic endpoint
│   │   │   ├── explore.py            # Hotels, attractions, restaurants
│   │   │   ├── reviews.py            # Community reviews
│   │   │   ├── bookmarks.py          # Wishlist
│   │   │   └── news.py               # Travel advisories
│   │   ├── services/
│   │   │   ├── places.py             # Geoapify → fallback dataset
│   │   │   ├── hotels.py             # Hotel recommendations
│   │   │   ├── budget.py             # Cost tier configuration
│   │   │   └── news.py               # News + RSS feed
│   │   ├── data/
│   │   │   └── explore_data.py       # Curated datasets
│   │   ├── db/
│   │   │   ├── models.py             # SQLAlchemy models
│   │   │   └── database.py           # DB session
│   │   └── main.py                   # FastAPI app entry
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/                    # HomePage, PlannerPage, TripDetailPage...
│       ├── components/               # Navbar, DailyPlanView, TripMap...
│       ├── context/                  # AuthContext, BookmarkContext
│       └── services/api.js           # Axios API client
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Backend
```bash
cd smart-travel-guide/backend
python3 -m venv ../venv && source ../venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd smart-travel-guide/frontend
npm install && npm start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

### Docker (all-in-one)
```bash
docker compose up --build
```

---

## ⚙️ Environment Configuration

Create `backend/.env`:
```env
DATABASE_URL=postgresql://travel_user:travel_pass@localhost:5432/travel_planner
SECRET_KEY=your-strong-secret-key

# Optional — app works with fallback data without these
OPENWEATHER_API_KEY=
GEOAPIFY_API_KEY=
TOMTOM_API_KEY=
ORS_API_KEY=

# Firebase (optional for auth)
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
```

---

## 📊 API Reference (25 Endpoints)

| Group | Endpoints | Base Path |
|---|---|---|
| Auth | sync, me, profile | `/api/auth` |
| Plan | rough, daily, trips CRUD, daily fetch | `/api/plan` |
| Weather | live weather per city | `/api/weather` |
| Traffic | congestion windows per city | `/api/traffic` |
| Explore | destinations, hotels, attractions, restaurants | `/api/explore` |
| Reviews | list, create, helpful vote | `/api/reviews` |
| Bookmarks | list, save, delete | `/api/bookmarks` |
| News | list, urgent alerts, refresh | `/api/news` |

Full interactive docs: **http://localhost:8000/docs**

---

## 📈 Performance Results

| Metric | Value |
|---|---|
| Itinerary Quality Validity Rate | 94.8% |
| Pilot User Satisfaction | 78% |
| Phase 2 Generation Time | < 1 second (parallel agents) |
| API Response (Phase 1) | ~300ms |

---

## 🔮 Future Scope

- Real-time rerouting using Google Maps Directions API during travel
- Push notification at 9pm every night with next-day plan
- Trained LightGBM ranker on real user preference data
- Multi-city trip with inter-city transport booking
- Mobile app (React Native) with offline itinerary access
- WhatsApp/SMS delivery of daily plan

---

## 👥 Team

| Name | Roll No |
|---|---|
| Mohammed Amer | 23241A6699 |
| Aditya Manoj Kulkarni | 23241A6668 |
| Budda Sathwik | 23241A6676 |

**Guide:** Ms. P. Nethrasri, Assistant Professor  
**Department:** CSE (AI & ML), GRIET, Hyderabad  
**Academic Year:** 2026–2027
