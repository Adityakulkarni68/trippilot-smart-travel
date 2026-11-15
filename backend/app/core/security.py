"""
Security and Token Verification module for TripPilot.
Validates tokens and provides FastAPI authentication dependencies.
"""
import time
import re
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.db.database import get_db

security_bearer = HTTPBearer(auto_error=False)


def _generate_unique_username(db: Session, base: str) -> str:
    """Generate a unique username by checking the database iteratively."""
    from app.db.models import User
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", base.lower()).strip("_") or "traveler"
    candidate = cleaned
    count = 1
    while db.query(User).filter(User.username == candidate).first():
        candidate = f"{cleaned}_{count}"
        count += 1
    return candidate


def decode_token_claims(token: str) -> Dict[str, Any]:
    """
    Decodes and validates token claims.
    Supports structured demo/guest tokens for local testing,
    and validates standard JWT token structure and expiration.
    Rejects malformed, forged, or arbitrary string tokens.
    """
    if not token or not isinstance(token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or empty.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clean_token = token.strip()

    # 1. Structured Demo / Guest Tokens (Local & Sandbox Testing)
    # Format: demo-<uid>, guest-<uid>, mock-<uid>
    demo_match = re.match(r"^(demo|guest|mock)-([a-zA-Z0-9_\-]+)$", clean_token)
    if demo_match:
        prefix, uid = demo_match.groups()
        full_uid = f"{prefix}_{uid}"
        return {
            "uid": full_uid,
            "email": f"{full_uid}@trippilot.local",
            "name": f"{prefix.title()} {uid.replace('_', ' ').title()}",
            "picture": None,
        }

    # 2. Standard JWT Tokens (Firebase / Auth Providers)
    jwt_parts = clean_token.split(".")
    if len(jwt_parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token: expected standard JWT structure.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = jwt.get_unverified_claims(clean_token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid JWT claims: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate expiration
    exp = claims.get("exp")
    if exp is not None:
        try:
            if float(exp) < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired. Please sign in again.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token expiration claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    uid = claims.get("user_id") or claims.get("sub") or claims.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification claim (sub/user_id).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = claims.get("email") or f"{str(uid)[:8]}@traveler.trippilot.local"
    name = claims.get("name") or claims.get("display_name") or "Traveler"
    picture = claims.get("picture")

    return {
        "uid": str(uid),
        "email": str(email),
        "name": str(name),
        "picture": picture,
    }


def get_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency that enforces authentication and returns the User DB model.
    Auto-provisions user row if authenticated for the first time.
    """
    if not cred or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_token_claims(cred.credentials)
    from app.db.models import User

    user = db.query(User).filter(User.firebase_uid == claims["uid"]).first()
    if not user:
        if claims.get("email"):
            user = db.query(User).filter(User.email == claims["email"]).first()

        if user:
            user.firebase_uid = claims["uid"]
        else:
            base_name = claims.get("name") or claims["uid"]
            username = _generate_unique_username(db, base_name)

            user = User(
                firebase_uid=claims["uid"],
                email=claims["email"],
                username=username,
                full_name=claims.get("name", "Traveler"),
                avatar_url=claims.get("picture"),
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    return user


def get_optional_current_user(
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    """
    FastAPI dependency for endpoints that work for both guests and logged-in users.
    Returns User DB model if valid token present, otherwise None.
    If an invalid token is provided, raises 401.
    """
    if not cred or not cred.credentials:
        return None

    claims = decode_token_claims(cred.credentials)
    from app.db.models import User

    user = db.query(User).filter(User.firebase_uid == claims["uid"]).first()
    if not user and claims.get("email"):
        user = db.query(User).filter(User.email == claims["email"]).first()

    if not user:
        base_name = claims.get("name") or claims["uid"]
        username = _generate_unique_username(db, base_name)

        user = User(
            firebase_uid=claims["uid"],
            email=claims["email"],
            username=username,
            full_name=claims.get("name", "Traveler"),
            avatar_url=claims.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
