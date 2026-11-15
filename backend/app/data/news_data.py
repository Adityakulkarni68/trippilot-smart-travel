"""News data re-export from services for consistency."""
from app.services.news import TRAVEL_NEWS as NEWS_ARTICLES, get_news, refresh_news, get_last_refreshed_iso

__all__ = ["NEWS_ARTICLES", "get_news", "refresh_news", "get_last_refreshed_iso"]
