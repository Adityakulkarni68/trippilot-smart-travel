import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.db.models import Trip, DailyPlan


class TestTelemetryAndNews(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_live_weather_endpoint(self):
        resp = self.client.get("/api/weather/Goa")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("temp_c", data)
        self.assertIn("humidity_pct", data)
        self.assertIn("suitability", data)
        self.assertIn("last_updated", data)
        self.assertIn("source", data)
        self.assertIsNotNone(data["last_updated"])

    def test_live_traffic_endpoint(self):
        resp = self.client.get("/api/traffic/Mumbai")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("overall_congestion", data)
        self.assertIn("best_windows", data)
        self.assertIn("current_level", data)
        self.assertIn("current_score", data)
        self.assertIn("last_updated", data)
        self.assertIn("source", data)
        self.assertIsNotNone(data["last_updated"])

    def test_news_refresh_endpoint(self):
        # Test listing news
        resp = self.client.get("/api/news")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertTrue(len(items) > 0)
        first = items[0]
        self.assertIn("relative_time", first)
        self.assertIn("published_at", first)

        # Test POST /api/news/refresh
        refresh_resp = self.client.post("/api/news/refresh")
        self.assertEqual(refresh_resp.status_code, 200)
        refresh_data = refresh_resp.json()
        self.assertEqual(refresh_data["status"], "refreshed")
        self.assertIn("last_updated", refresh_data)
        self.assertTrue(refresh_data["total_articles"] > 0)

    def test_plan_telemetry_force_refresh(self):
        # 1. Create a trip
        payload = {
            "destination": "Goa",
            "num_days": 1,
            "budget_tier": "mid",
            "pace": "balanced",
            "travelers": 2,
        }
        create_resp = self.client.post("/api/plan/rough", json=payload)
        self.assertEqual(create_resp.status_code, 200)
        trip_id = create_resp.json()["trip_id"]

        # 2. Get daily plan without refresh
        plan1_resp = self.client.get(f"/api/plan/trips/{trip_id}/daily/1")
        self.assertEqual(plan1_resp.status_code, 200)
        plan1 = plan1_resp.json()
        self.assertIn("weather", plan1)
        self.assertIn("traffic", plan1)

        # 3. Call get daily plan with refresh=true
        plan2_resp = self.client.get(f"/api/plan/trips/{trip_id}/daily/1?refresh=true")
        self.assertEqual(plan2_resp.status_code, 200)
        plan2 = plan2_resp.json()
        self.assertIn("weather", plan2)
        self.assertIn("traffic", plan2)
        self.assertIsNotNone(plan2["weather"]["last_updated"])
        self.assertIsNotNone(plan2["traffic"]["last_updated"])


if __name__ == "__main__":
    unittest.main()
