import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db.database import engine, Base
import app.db.models  # ensure models are registered
from app.api import plan, auth, explore, reviews, news, bookmarks, weather, traffic

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("trippilot")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TripPilot – Intelligent Multi-Agent Travel Partner API",
    description=(
        "Production-grade Travel Companion & Planner.\n\n"
        "**Phase 1** `/api/plan/rough` — Generate skeleton itinerary at booking time.\n\n"
        "**Phase 2** `/api/plan/daily` — Night-before dynamic plan using "
        "Weather Agent + Traffic Agent + Food Agent + Vector ML Ranker.\n\n"
        "**Features** — Token Auth, TripAdvisor Explore (Hotels, Attractions, Dining), "
        "Community Bubble Reviews, Saved Wishlist, and Live Travel News."
    ),
    version="2.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Deduplicate allowed origins
allowed_origins = list({
    *settings.allowed_origins_list,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again later.", "error_type": type(exc).__name__},
    )


app.include_router(auth.router)
app.include_router(plan.router)
app.include_router(explore.router)
app.include_router(reviews.router)
app.include_router(news.router)
app.include_router(bookmarks.router)
app.include_router(weather.router)
app.include_router(traffic.router)


@app.get("/health", tags=["health"])
def health():
    db_status = "ok"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"degraded: {e}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "trippilot-travel-partner-v2.2",
        "database": db_status,
        "modules": ["auth", "plan", "explore", "reviews", "news", "bookmarks", "agents", "ml"],
    }
