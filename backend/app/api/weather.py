"""Real-time Weather Telemetry API."""
from fastapi import APIRouter, Query
from typing import Optional
from app.agents import weather_agent
from app.schemas.trip import WeatherInfo

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/{destination}", response_model=WeatherInfo)
async def get_current_weather(
    destination: str,
    plan_date: Optional[str] = Query(None, description="Date for weather forecasting (YYYY-MM-DD)"),
):
    """
    Get live, up-to-date weather telemetry for any destination city.
    Fetches from OpenWeatherMap / Open-Meteo live streams with automatic diurnal climatology fallback.
    """
    return await weather_agent.run(destination=destination, plan_date=plan_date)
