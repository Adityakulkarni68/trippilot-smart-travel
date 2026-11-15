import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import SessionLocal
from app.db.models import Trip


class TestPlan(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_create_rough_plan_success(self):
        payload = {
            "destination": "Goa",
            "origin": "Mumbai",
            "start_date": "2026-10-01",
            "num_days": 3,
            "budget_tier": "mid",
            "pace": "balanced",
            "travelers": 2,
        }
        resp = self.client.post("/api/plan/rough", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["destination"], "Goa")
        self.assertEqual(data["num_days"], 3)
        self.assertEqual(len(data["days"]), 3)
        self.assertGreater(data["grand_total_inr"], 0)

        # Balanced pace = 4 stops per day
        for day in data["days"]:
            self.assertEqual(len(day["highlights"]), 4)
            self.assertGreater(day["est_cost_inr"], 0)

    def test_hotel_rooms_budgeting(self):
        # 4 travelers should calculate 2 rooms (ceil(4/2))
        payload_4 = {
            "destination": "Jaipur",
            "num_days": 2,
            "budget_tier": "mid",
            "pace": "relaxed",
            "travelers": 4,
        }
        resp_4 = self.client.post("/api/plan/rough", json=payload_4)
        self.assertEqual(resp_4.status_code, 200)
        cost_4 = resp_4.json()["grand_total_inr"]

        # 2 travelers should calculate 1 room
        payload_2 = {
            "destination": "Jaipur",
            "num_days": 2,
            "budget_tier": "mid",
            "pace": "relaxed",
            "travelers": 2,
        }
        resp_2 = self.client.post("/api/plan/rough", json=payload_2)
        self.assertEqual(resp_2.status_code, 200)
        cost_2 = resp_2.json()["grand_total_inr"]

        # cost for 4 shouldn't be 4x cost for 2 (since room count only doubles, not quadruples)
        self.assertLess(cost_4, cost_2 * 2.5)

    def test_create_daily_plan(self):
        # First create rough trip
        rough_resp = self.client.post(
            "/api/plan/rough",
            json={
                "destination": "Manali",
                "num_days": 2,
                "budget_tier": "mid",
                "pace": "balanced",
                "travelers": 2,
            },
        )
        self.assertEqual(rough_resp.status_code, 200)
        trip_id = rough_resp.json()["trip_id"]

        # Run Phase 2 daily plan
        daily_resp = self.client.post(
            "/api/plan/daily",
            json={
                "trip_id": trip_id,
                "day_number": 1,
                "plan_date": "2026-10-02",
            },
        )
        self.assertEqual(daily_resp.status_code, 200)
        data = daily_resp.json()
        self.assertEqual(data["trip_id"], trip_id)
        self.assertEqual(data["day_number"], 1)
        self.assertTrue("weather" in data)
        self.assertTrue("traffic" in data)
        self.assertTrue("stops" in data)
        self.assertTrue("meals" in data)
        self.assertGreaterEqual(len(data["stops"]), 2)
        self.assertGreaterEqual(len(data["meals"]), 1)
        self.assertGreater(data["total_distance_km"], 0)
        self.assertGreater(data["total_transit_mins"], 0)
        self.assertIn("Curated", data["route_summary"])

        # Verify transit leg on stops
        first_stop = data["stops"][0]
        self.assertIsNotNone(first_stop.get("transit_from_previous"))
        self.assertGreater(first_stop["transit_from_previous"]["distance_km"], 0)
        self.assertIsNotNone(first_stop.get("weather_tip"))

        # Verify GET /api/plan/trips/{trip_id}/daily/2 auto-generates or retrieves Day 2
        day2_resp = self.client.get(f"/api/plan/trips/{trip_id}/daily/2")
        self.assertEqual(day2_resp.status_code, 200)
        day2_data = day2_resp.json()
        self.assertEqual(day2_data["day_number"], 2)
        self.assertGreaterEqual(len(day2_data["stops"]), 2)

    def test_trip_ownership_and_idor_protection(self):
        user1_token = "demo-owneruser1"
        user2_token = "demo-otheruser2"

        # User 1 creates trip
        create_resp = self.client.post(
            "/api/plan/rough",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "destination": "Delhi",
                "num_days": 2,
                "budget_tier": "budget",
                "pace": "fast",
                "travelers": 1,
            },
        )
        self.assertEqual(create_resp.status_code, 200)
        trip_id = create_resp.json()["trip_id"]

        # User 2 tries to delete User 1's trip -> must be 403 Forbidden
        del_unauthorized = self.client.delete(
            f"/api/plan/trips/{trip_id}",
            headers={"Authorization": f"Bearer {user2_token}"},
        )
        self.assertEqual(del_unauthorized.status_code, 403)

        # User 1 deletes their own trip -> 204 No Content
        del_authorized = self.client.delete(
            f"/api/plan/trips/{trip_id}",
            headers={"Authorization": f"Bearer {user1_token}"},
        )
        self.assertEqual(del_authorized.status_code, 204)

        # Confirm deleted
        get_resp = self.client.get(f"/api/plan/trips/{trip_id}")
        self.assertEqual(get_resp.status_code, 404)


if __name__ == "__main__":
    unittest.main()

