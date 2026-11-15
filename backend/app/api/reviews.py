"""
Community reviews & TripAdvisor-style bubble ratings API.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List

from app.db.database import get_db
from app.db.models import Review, User
from app.core.security import get_optional_current_user
from app.data.explore_data import SEED_REVIEWS

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class ReviewCreate(BaseModel):
    item_name   : str = Field(..., min_length=2)
    item_type   : str = Field(..., min_length=2)
    destination : Optional[str] = None
    rating      : float = Field(..., ge=1.0, le=5.0)
    title       : str = Field(..., min_length=3, max_length=150)
    content     : str = Field(..., min_length=5, max_length=3000)
    trip_type   : Optional[str] = "Couples"


@router.get("")
def list_reviews(
    item_name   : Optional[str] = Query(None),
    item_type   : Optional[str] = Query(None),
    destination : Optional[str] = Query(None),
    db          : Session = Depends(get_db),
):
    """
    List verified community reviews and seed feedback.
    Calculates average rating and star distribution.
    """
    q = db.query(Review)
    if item_name:
        q = q.filter(Review.item_name.ilike(f"%{item_name.strip()}%"))
    if item_type:
        q = q.filter(Review.item_type == item_type.strip())
    if destination:
        q = q.filter(Review.destination.ilike(destination.strip()))

    db_reviews = q.order_by(Review.created_at.desc()).all()

    # Filter seed reviews
    key = (item_name or "").lower().strip()
    dest_key = (destination or "").lower().strip()

    seed = SEED_REVIEWS
    if key:
        seed = [r for r in seed if key in r["item_name"].lower()]
    if dest_key:
        seed = [r for r in seed if (r.get("destination") or "").lower() == dest_key]

    all_reviews = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "item_name": r.item_name,
            "item_type": r.item_type,
            "user_name": r.user_name,
            "user_avatar": r.user_avatar,
            "rating": r.rating,
            "title": r.title,
            "content": r.content,
            "trip_type": r.trip_type,
            "helpful_count": r.helpful_count or 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in db_reviews
    ] + seed

    total = len(all_reviews)
    avg = round(sum(r["rating"] for r in all_reviews) / total, 1) if total > 0 else 5.0

    # Rating distribution breakdown
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in all_reviews:
        star = min(5, max(1, int(round(r["rating"]))))
        distribution[star] += 1

    return {
        "total_reviews": total,
        "average_rating": avg,
        "distribution": distribution,
        "reviews": all_reviews,
    }


@router.post("")
def create_review(
    data: ReviewCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Publish a verified traveler review with user attribution."""
    user_id     = current_user.id if current_user else None
    user_name   = (current_user.full_name or current_user.username) if current_user else "Verified Traveler"
    user_avatar = current_user.avatar_url if current_user else None

    review = Review(
        user_id=user_id,
        item_name=data.item_name.strip(),
        item_type=data.item_type.strip(),
        destination=data.destination.strip() if data.destination else None,
        rating=round(data.rating, 1),
        title=data.title.strip(),
        content=data.content.strip(),
        trip_type=data.trip_type,
        user_name=user_name,
        user_avatar=user_avatar,
        helpful_count=0,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {"id": review.id, "message": "Review published successfully"}


@router.post("/{review_id}/helpful")
def vote_helpful(review_id: int, db: Session = Depends(get_db)):
    """Increment helpful votes for a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if review:
        review.helpful_count = (review.helpful_count or 0) + 1
        db.commit()
        return {"helpful_count": review.helpful_count}

    # For seed reviews stored in-memory
    for r in SEED_REVIEWS:
        if r["id"] == review_id:
            r["helpful_count"] = (r.get("helpful_count") or 0) + 1
            return {"helpful_count": r["helpful_count"]}

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
