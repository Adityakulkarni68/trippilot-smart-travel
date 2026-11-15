"""Explore Hub — destinations, hotels, attractions, restaurants."""
from fastapi import APIRouter, Query
from typing import Optional
from app.data.explore_data import DESTINATIONS, HOTELS, ATTRACTIONS, RESTAURANTS

router = APIRouter(prefix="/api/explore", tags=["explore"])


@router.get("/destinations")
def list_destinations():
    return DESTINATIONS


@router.get("/hotels")
def list_hotels(
    destination: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
):
    items = HOTELS
    if destination:
        items = [h for h in items if h["destination"].lower() == destination.lower()]
    if tier:
        items = [h for h in items if h.get("tier") == tier]
    if min_rating:
        items = [h for h in items if h.get("rating", 0) >= min_rating]
    return items


@router.get("/attractions")
def list_attractions(
    destination: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
):
    items = ATTRACTIONS
    if destination:
        items = [a for a in items if a["destination"].lower() == destination.lower()]
    if min_rating:
        items = [a for a in items if a.get("rating", 0) >= min_rating]
    return items


@router.get("/restaurants")
def list_restaurants(
    destination: Optional[str] = Query(None),
    price_band: Optional[str] = Query(None),
):
    items = RESTAURANTS
    if destination:
        items = [r for r in items if r["destination"].lower() == destination.lower()]
    if price_band:
        items = [r for r in items if r.get("price_band") == price_band]
    return items
