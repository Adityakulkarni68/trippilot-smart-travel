"""Travel news & safety advisories API."""
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from app.services.news import get_news, refresh_news, get_last_refreshed_iso

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
async def list_news(
    category   : Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    urgent_only: Optional[bool] = Query(None),
    refresh    : Optional[bool] = Query(False, description="Force refresh news feed from live sources"),
):
    """
    List travel news, weather bulletins, and safety notices.
    Auto-updates on a rolling schedule. Supports explicit refresh via query param.
    """
    return await get_news(
        category=category,
        destination=destination,
        urgent_only=bool(urgent_only),
        force_refresh=bool(refresh),
    )


@router.get("/alerts")
async def get_urgent_alerts():
    """Fetch high-priority urgent advisories for real-time tickers and emergency banners."""
    return await get_news(urgent_only=True)


@router.post("/refresh")
async def force_refresh_news():
    """
    Manually trigger an immediate update of travel bulletins and safety advisories.
    Updates the rolling cache with fresh real-time timestamps and online RSS feeds.
    """
    items = await refresh_news()
    return {
        "status": "refreshed",
        "last_updated": get_last_refreshed_iso(),
        "total_articles": len(items),
        "items": items,
    }
