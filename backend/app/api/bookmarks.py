"""
Bookmarks / TripAdvisor Wishlist API with user isolation and IDOR protection.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Any, List

from app.db.database import get_db
from app.db.models import Bookmark, User
from app.core.security import get_optional_current_user

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


class BookmarkCreate(BaseModel):
    item_type: str   = Field(..., min_length=2)
    item_name: str   = Field(..., min_length=2)
    destination: Optional[str] = None
    details: Optional[Any] = None


@router.get("")
def list_bookmarks(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    List wishlist bookmarks.
    Returns only items saved by the currently authenticated user.
    """
    if not current_user:
        return []

    items = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return [
        {
            "id": b.id,
            "user_id": b.user_id,
            "item_type": b.item_type,
            "item_name": b.item_name,
            "destination": b.destination,
            "details": json.loads(b.details_json) if b.details_json else {},
            "created_at": b.created_at.isoformat() if b.created_at else None,
        }
        for b in items
    ]


@router.post("")
def add_bookmark(
    data: BookmarkCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Save an item to wishlist.
    Associates the bookmark with current user and prevents duplicates.
    """
    user_id = current_user.id if current_user else None

    # Check for existing bookmark to avoid duplicate entries
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.item_name.ilike(data.item_name.strip()),
    ).first()

    if existing:
        return {"id": existing.id, "message": "Already saved to wishlist"}

    bm = Bookmark(
        user_id=user_id,
        item_type=data.item_type.strip(),
        item_name=data.item_name.strip(),
        destination=data.destination.strip() if data.destination else None,
        details_json=json.dumps(data.details) if data.details else None,
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)

    return {"id": bm.id, "message": "Saved to wishlist"}


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Remove an item from wishlist with authorization check."""
    bm = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")

    if bm.user_id is not None:
        if not current_user or current_user.id != bm.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this bookmark.",
            )

    db.delete(bm)
    db.commit()
