import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestExploreAndReviews(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_destinations(self):
        resp = self.client.get("/api/explore/destinations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 5)
        dest_ids = [d["id"] for d in data]
        self.assertIn("goa", dest_ids)
        self.assertIn("jaipur", dest_ids)

    def test_filter_hotels(self):
        resp = self.client.get("/api/explore/hotels?destination=goa&tier=luxury")
        self.assertEqual(resp.status_code, 200)
        hotels = resp.json()
        self.assertGreater(len(hotels), 0)
        for h in hotels:
            self.assertEqual(h["destination"], "goa")
            self.assertEqual(h["tier"], "luxury")

    def test_filter_attractions(self):
        resp = self.client.get("/api/explore/attractions?destination=jaipur")
        self.assertEqual(resp.status_code, 200)
        attractions = resp.json()
        self.assertGreater(len(attractions), 0)
        for a in attractions:
            self.assertEqual(a["destination"], "jaipur")

    def test_filter_restaurants(self):
        resp = self.client.get("/api/explore/restaurants?destination=delhi")
        self.assertEqual(resp.status_code, 200)
        restaurants = resp.json()
        self.assertGreater(len(restaurants), 0)
        for r in restaurants:
            self.assertEqual(r["destination"], "delhi")

    def test_news_and_alerts(self):
        news_resp = self.client.get("/api/news")
        self.assertEqual(news_resp.status_code, 200)
        self.assertGreater(len(news_resp.json()), 0)

        alerts_resp = self.client.get("/api/news/alerts")
        self.assertEqual(alerts_resp.status_code, 200)
        for a in alerts_resp.json():
            self.assertTrue(a.get("urgent"))

    def test_bookmarks_user_isolation(self):
        token_a = "demo-bmuserA"
        token_b = "demo-bmuserB"

        # User A saves a bookmark
        save_resp = self.client.post(
            "/api/bookmarks",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "item_type": "hotels",
                "item_name": "Taj Holiday Village",
                "destination": "goa",
                "details": {"price": 12000},
            },
        )
        self.assertEqual(save_resp.status_code, 200)
        bm_id = save_resp.json()["id"]

        # Duplicate save should be deduplicated
        dup_resp = self.client.post(
            "/api/bookmarks",
            headers={"Authorization": f"Bearer {token_a}"},
            json={
                "item_type": "hotels",
                "item_name": "Taj Holiday Village",
                "destination": "goa",
            },
        )
        self.assertEqual(dup_resp.json()["id"], bm_id)

        # User A lists bookmarks -> gets 1
        list_a = self.client.get(
            "/api/bookmarks",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        self.assertEqual(len(list_a.json()), 1)

        # User B lists bookmarks -> gets 0 (isolation!)
        list_b = self.client.get(
            "/api/bookmarks",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(len(list_b.json()), 0)

        # User B attempts to delete User A's bookmark -> 403 Forbidden
        del_unauthorized = self.client.delete(
            f"/api/bookmarks/{bm_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(del_unauthorized.status_code, 403)

        # User A deletes their bookmark -> 204 No Content
        del_authorized = self.client.delete(
            f"/api/bookmarks/{bm_id}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        self.assertEqual(del_authorized.status_code, 204)

    def test_create_review_and_helpful_vote(self):
        token = "demo-reviewer1"
        review_payload = {
            "item_name": "Fort Aguada & Lighthouse",
            "item_type": "attractions",
            "destination": "goa",
            "rating": 4.5,
            "title": "Breathtaking Coastal Vista",
            "content": "Loved walking around the fort perimeter. Beautiful views of the Arabian Sea.",
            "trip_type": "Solo",
        }
        res = self.client.post(
            "/api/reviews",
            headers={"Authorization": f"Bearer {token}"},
            json=review_payload,
        )
        self.assertEqual(res.status_code, 200)
        rev_id = res.json()["id"]

        # Helpful vote
        vote_res = self.client.post(f"/api/reviews/{rev_id}/helpful")
        self.assertEqual(vote_res.status_code, 200)
        self.assertEqual(vote_res.json()["helpful_count"], 1)


if __name__ == "__main__":
    unittest.main()

