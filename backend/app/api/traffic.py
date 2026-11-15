"""Real-time Traffic Telemetry API."""
from fastapi import APIRouter, Query
from typing import Optional
from app.agents import traffic_agent
from app.schemas.trip import TrafficInfo

router = APIRouter(prefix="/api/traffic", tags=["traffic"])


@router.get("/{destination}", response_model=TrafficInfo)
async def get_current_traffic(
    destination: str,
    plan_date: Optional[str] = Query(None, description="Date for traffic analysis (YYYY-MM-DD)"),
):
    """
    Get live, real-time traffic congestion telemetry and optimal departure windows for any destination city.
    Uses TomTom Live Flow API with diurnal city congestion profiling.
    """
    return await traffic_agent.run(destination=destination, plan_date=plan_date)
