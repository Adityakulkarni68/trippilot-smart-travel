"""
Plan API:
  POST   /api/plan/rough                → Phase 1: create trip and generate skeleton itinerary
  POST   /api/plan/daily                → Phase 2: night-before run 3 agents (Weather, Traffic, Food) + ML ranker
  GET    /api/plan/trips                → List user's saved trips (isolated per user)
  GET    /api/plan/trips/{id}           → Get trip details & rough plan JSON
  DELETE /api/plan/trips/{id}           → Delete trip (authorized by owner)
  GET    /api/plan/trips/{id}/daily/{d} → Fetch previously generated daily plan
"""
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Trip, DailyPlan, User
from app.core.security import get_optional_current_user
from app.schemas.trip import (
    TripRequest, RoughPlanResponse,
    DailyPlanRequest, DailyPlanResponse,
    TripOut,
)
from app.agents.rough_planner import generate_rough_plan
from app.agents.daily_orchestrator import generate_daily_plan
from datetime import datetime, timedelta, timezone


def _parse_start_date(raw_date: Optional[str]) -> datetime:
    """Safely parse user-supplied start dates across multiple formats."""
    if not raw_date:
        return datetime.now()
    clean = str(raw_date).strip()[:10]
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(clean, fmt)
        except ValueError:
            pass
    return datetime.now()


router = APIRouter(prefix="/api/plan", tags=["plan"])


@router.post("/rough", response_model=RoughPlanResponse)
async def create_rough_plan(
    req: TripRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 1 — Create trip and generate the rough overview itinerary at booking time.
    Saves the trip to DB (linked to customer if logged in) and returns the skeleton day plan.
    """
    trip = Trip(
        user_id=current_user.id if current_user else None,
        destination=req.destination.strip(),
        origin=req.origin.strip() if req.origin else None,
        start_date=req.start_date,
        num_days=req.num_days,
        budget_tier=req.budget_tier,
        pace=req.pace,
        travelers=req.travelers,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    try:
        plan = await generate_rough_plan(req, trip.id)
    except Exception as e:
        db.delete(trip)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rough plan generation failed: {e}",
        )

    # Store the rough plan JSON & cost
    trip.rough_plan_json = plan.model_dump_json()
    trip.total_cost_inr  = plan.grand_total_inr
    db.commit()

    # Pre-generate complete day-wise itineraries for all days immediately
    try:
        from datetime import datetime, timedelta
        start_d = datetime.strptime(req.start_date, "%Y-%m-%d") if req.start_date else datetime.now()
        start_d = _parse_start_date(req.start_date)
        for day_num in range(1, req.num_days + 1):
            day_date = (start_d + timedelta(days=day_num - 1)).strftime("%Y-%m-%d")
            daily_req = DailyPlanRequest(trip_id=trip.id, day_number=day_num, plan_date=day_date)
            d_plan = await generate_daily_plan(
                req=daily_req,
                destination=trip.destination,
                budget_tier=trip.budget_tier,
                pace=trip.pace,
                travelers=trip.travelers,
            )
            dp_record = DailyPlan(
                trip_id=trip.id,
                day_number=day_num,
                plan_date=day_date,
                plan_json=d_plan.model_dump_json(),
            )
            db.add(dp_record)
        db.commit()
    except Exception:
        # Graceful fallback: on-demand generation in get_daily_plan will cover any ungenerated days
        pass

    return plan


@router.post("/daily", response_model=DailyPlanResponse)
async def create_daily_plan(
    req: DailyPlanRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Phase 2 — Generate the night-before dynamic detailed plan for one specific day.
    Runs Weather Agent + Traffic Agent + Food Agent in parallel,
    then applies ML ranker to score and sequence the day's stops and meals.
    Saves result to daily_plans table.
    """
    trip = db.query(Trip).filter(Trip.id == req.trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # Access control: If trip belongs to a user, enforce ownership
    if trip.user_id is not None:
        if not current_user or current_user.id != trip.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify daily plans for this trip.",
            )

    try:
        plan = await generate_daily_plan(
            req=req,
            destination=trip.destination,
            budget_tier=trip.budget_tier,
            pace=trip.pace,
            travelers=trip.travelers,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Daily plan generation failed: {e}",
        )

    # Upsert daily plan record
    existing = db.query(DailyPlan).filter(
        DailyPlan.trip_id == req.trip_id,
        DailyPlan.day_number == req.day_number,
    ).first()

    plan_json    = plan.model_dump_json()
    weather_json = plan.weather.model_dump_json()
    traffic_json = plan.traffic.model_dump_json()
    food_json    = json.dumps([m.model_dump() for m in plan.meals])

    if existing:
        existing.plan_json    = plan_json
        existing.weather_json = weather_json
        existing.traffic_json = traffic_json
        existing.food_json    = food_json
        existing.plan_date    = req.plan_date
    else:
        db_plan = DailyPlan(
            trip_id=req.trip_id,
            day_number=req.day_number,
            plan_date=req.plan_date,
            plan_json=plan_json,
            weather_json=weather_json,
            traffic_json=traffic_json,
            food_json=food_json,
        )
        db.add(db_plan)

    db.commit()
    return plan


@router.get("/trips", response_model=List[TripOut])
def list_trips(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    List saved trips with complete user data isolation:
    - Logged-in users see exclusively their own trips.
    - Guest users without tokens see only anonymous/guest trips.
    """
    if current_user:
        return db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()

    # Anonymous / Guest view (no cross-user private data leakage)
    return db.query(Trip).filter(Trip.user_id.is_(None)).order_by(Trip.created_at.desc()).limit(20).all()


@router.get("/trips/{trip_id}")
def get_trip(
    trip_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Get a trip with its rough plan JSON and authorization check."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # If trip belongs to a user, enforce ownership if authenticated
    if trip.user_id is not None and current_user and trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this trip.",
        )

    return {
        "id":             trip.id,
        "user_id":        trip.user_id,
        "destination":    trip.destination,
        "origin":         trip.origin,
        "start_date":     trip.start_date,
        "num_days":       trip.num_days,
        "budget_tier":    trip.budget_tier,
        "pace":           trip.pace,
        "travelers":      trip.travelers,
        "total_cost_inr": trip.total_cost_inr,
        "rough_plan":     json.loads(trip.rough_plan_json) if trip.rough_plan_json else None,
        "created_at":     trip.created_at.isoformat() if trip.created_at else None,
    }


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Delete a trip with ownership validation."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    # If trip is claimed by a user, ensure the requesting user is the owner
    if trip.user_id is not None:
        if not current_user or current_user.id != trip.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this trip.",
            )

    db.delete(trip)
    db.commit()


@router.get("/trips/{trip_id}/daily/{day_number}")
async def get_daily_plan(
    trip_id: int,
    day_number: int,
    refresh: bool = False,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch a daily plan with automatic real-time telemetry freshness.
    If the cached weather & traffic telemetry is older than 15 minutes or if refresh=True,
    the plan automatically updates with the latest live conditions.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    if trip.user_id is not None and current_user and trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access plans for this trip.",
        )

    dp = db.query(DailyPlan).filter(
        DailyPlan.trip_id == trip_id,
        DailyPlan.day_number == day_number,
    ).first()

    # Check staleness: if generated more than 15 minutes ago, auto-refresh telemetry
    is_stale = False
    if dp and dp.generated_at:
        now_utc = datetime.now(timezone.utc)
        gen_at = dp.generated_at
        if gen_at.tzinfo is None:
            gen_at = gen_at.replace(tzinfo=timezone.utc)
        if (now_utc - gen_at).total_seconds() > 900:  # 15 minutes TTL
            is_stale = True

    if not dp or refresh or is_stale:
        start_d = _parse_start_date(trip.start_date)
        day_date = (start_d + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")
        daily_req = DailyPlanRequest(trip_id=trip.id, day_number=day_number, plan_date=day_date)
        d_plan = await generate_daily_plan(
            req=daily_req,
            destination=trip.destination,
            budget_tier=trip.budget_tier,
            pace=trip.pace,
            travelers=trip.travelers,
        )

        plan_json    = d_plan.model_dump_json()
        weather_json = d_plan.weather.model_dump_json()
        traffic_json = d_plan.traffic.model_dump_json()
        food_json    = json.dumps([m.model_dump() for m in d_plan.meals])

        if dp:
            dp.plan_json    = plan_json
            dp.weather_json = weather_json
            dp.traffic_json = traffic_json
            dp.food_json    = food_json
            dp.plan_date    = day_date
            dp.generated_at = datetime.now(timezone.utc)
        else:
            dp = DailyPlan(
                trip_id=trip.id,
                day_number=day_number,
                plan_date=day_date,
                plan_json=plan_json,
                weather_json=weather_json,
                traffic_json=traffic_json,
                food_json=food_json,
                generated_at=datetime.now(timezone.utc),
            )
            db.add(dp)

        db.commit()
        db.refresh(dp)

    return json.loads(dp.plan_json)
