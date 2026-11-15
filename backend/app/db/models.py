from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    firebase_uid  = Column(String, unique=True, index=True, nullable=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    username      = Column(String, unique=True, index=True, nullable=True)
    full_name     = Column(String, nullable=True)
    avatar_url    = Column(String, nullable=True)
    bio           = Column(String, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=utc_now)

    trips         = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    bookmarks     = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    reviews       = relationship("Review", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    destination     = Column(String, nullable=False)
    origin          = Column(String, nullable=True)
    start_date      = Column(String, nullable=True)
    num_days        = Column(Integer, nullable=False)
    budget_tier     = Column(String, nullable=False)
    pace            = Column(String, nullable=False)
    travelers       = Column(Integer, default=1)
    rough_plan_json = Column(Text, nullable=True)
    total_cost_inr  = Column(Float, nullable=True)
    created_at      = Column(DateTime, default=utc_now)

    user            = relationship("User", back_populates="trips")
    daily_plans     = relationship("DailyPlan", back_populates="trip", cascade="all, delete-orphan", passive_deletes=True)


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id            = Column(Integer, primary_key=True, index=True)
    trip_id       = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number    = Column(Integer, nullable=False)
    plan_date     = Column(String, nullable=True)
    plan_json     = Column(Text, nullable=True)
    weather_json  = Column(Text, nullable=True)
    traffic_json  = Column(Text, nullable=True)
    food_json     = Column(Text, nullable=True)
    generated_at  = Column(DateTime, default=utc_now)

    trip          = relationship("Trip", back_populates="daily_plans")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    item_type   = Column(String, nullable=False)
    item_name   = Column(String, nullable=False)
    destination = Column(String, nullable=True)
    details_json= Column(Text, nullable=True)
    created_at  = Column(DateTime, default=utc_now)

    user        = relationship("User", back_populates="bookmarks")


class Review(Base):
    __tablename__ = "reviews"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    item_name     = Column(String, nullable=False, index=True)
    item_type     = Column(String, nullable=False)
    destination   = Column(String, nullable=True, index=True)
    user_name     = Column(String, default="Anonymous Traveler")
    user_avatar   = Column(String, nullable=True)
    rating        = Column(Float, nullable=False)
    title         = Column(String, nullable=False)
    content       = Column(Text, nullable=False)
    trip_type     = Column(String, nullable=True)
    helpful_count = Column(Integer, default=0)
    created_at    = Column(DateTime, default=utc_now)

    user          = relationship("User", back_populates="reviews")
