import unittest
from sqlalchemy import text
from app.db.database import SessionLocal, engine
from app.db.models import User, Trip, DailyPlan, Bookmark


class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_sqlite_foreign_keys_enabled(self):
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA foreign_keys;")).scalar()
            self.assertEqual(result, 1, "SQLite foreign keys must be enabled via pragma")

    def test_trip_daily_plan_cascade_delete(self):
        # Create a test trip
        trip = Trip(
            destination="Goa",
            num_days=2,
            budget_tier="mid",
            pace="balanced",
            travelers=2,
        )
        self.db.add(trip)
        self.db.commit()
        self.db.refresh(trip)

        # Create daily plan linked to trip
        dp = DailyPlan(
            trip_id=trip.id,
            day_number=1,
            plan_json="{}",
        )
        self.db.add(dp)
        self.db.commit()
        self.db.refresh(dp)

        dp_id = dp.id

        # Delete the trip
        self.db.delete(trip)
        self.db.commit()

        # Check that daily plan was cascade deleted
        remaining_dp = self.db.query(DailyPlan).filter(DailyPlan.id == dp_id).first()
        self.assertIsNone(remaining_dp, "DailyPlan must be cascade deleted when Trip is deleted")

    def test_user_trip_cascade_delete(self):
        user = User(
            firebase_uid="cascade_test_user",
            email="cascade_test@trippilot.local",
            username="cascade_tester",
            full_name="Cascade Tester",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        trip = Trip(
            user_id=user.id,
            destination="Jaipur",
            num_days=1,
            budget_tier="luxury",
            pace="relaxed",
            travelers=1,
        )
        self.db.add(trip)

        bm = Bookmark(
            user_id=user.id,
            item_type="attractions",
            item_name="Amber Fort",
        )
        self.db.add(bm)
        self.db.commit()

        trip_id = trip.id
        bm_id = bm.id

        # Delete user
        self.db.delete(user)
        self.db.commit()

        # Both trip and bookmark should be removed
        self.assertIsNone(self.db.query(Trip).filter(Trip.id == trip_id).first())
        self.assertIsNone(self.db.query(Bookmark).filter(Bookmark.id == bm_id).first())


if __name__ == "__main__":
    unittest.main()

