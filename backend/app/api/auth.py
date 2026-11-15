"""
Auth API — User token synchronization and profile management.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from app.db.database import get_db
from app.db.models import User
from app.core.security import get_current_user, get_optional_current_user, _generate_unique_username

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SyncRequest(BaseModel):
    firebase_uid: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None


@router.post("/sync")
def sync_user(
    req: SyncRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Syncs Firebase user account with local database.
    If authenticated via Bearer token, enforces UID consistency.
    """
    if current_user and current_user.firebase_uid != req.firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user cannot sync a different Firebase UID.",
        )

    user = db.query(User).filter(User.firebase_uid == req.firebase_uid).first()
    if not user:
        # Check by email
        user = db.query(User).filter(User.email == req.email).first()

    if not user:
        base_name = req.display_name or req.email.split("@")[0]
        username = _generate_unique_username(db, base_name)

        user = User(
            firebase_uid=req.firebase_uid,
            email=req.email,
            username=username,
            full_name=req.display_name or username,
            avatar_url=req.photo_url,
        )
        db.add(user)
    else:
        user.firebase_uid = req.firebase_uid
        user.email = req.email
        if req.display_name:
            user.full_name = req.display_name
        if req.photo_url:
            user.avatar_url = req.photo_url

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "firebase_uid": user.firebase_uid,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile for the currently authenticated user."""
    return {
        "id": current_user.id,
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.put("/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile details for the authenticated user."""
    if data.display_name is not None:
        current_user.full_name = data.display_name.strip()
    if data.photo_url is not None:
        current_user.avatar_url = data.photo_url.strip()
    if data.bio is not None:
        current_user.bio = data.bio.strip()

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "firebase_uid": current_user.firebase_uid,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "message": "Profile updated successfully",
    }
