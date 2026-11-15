import unittest
from fastapi.testclient import TestClient
from fastapi import HTTPException

from app.main import app
from app.core.security import decode_token_claims
from app.db.database import SessionLocal
from app.db.models import User


class TestAuth(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_decode_structured_demo_token(self):
        claims = decode_token_claims("demo-traveler1")
        self.assertEqual(claims["uid"], "demo_traveler1")
        self.assertEqual(claims["email"], "demo_traveler1@trippilot.local")
        self.assertEqual(claims["name"], "Demo Traveler1")

    def test_decode_guest_token(self):
        claims = decode_token_claims("guest-user99")
        self.assertEqual(claims["uid"], "guest_user99")
        self.assertEqual(claims["name"], "Guest User99")

    def test_reject_arbitrary_short_or_long_string(self):
        with self.assertRaises(HTTPException) as ctx:
            decode_token_claims("randomstring123")
        self.assertEqual(ctx.exception.status_code, 401)

    def test_reject_empty_token(self):
        with self.assertRaises(HTTPException) as ctx:
            decode_token_claims("")
        self.assertEqual(ctx.exception.status_code, 401)

    def test_get_me_unauthorized(self):
        resp = self.client.get("/api/auth/me")
        self.assertEqual(resp.status_code, 401)

    def test_get_me_authorized(self):
        token = "demo-testuser1"
        resp = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["firebase_uid"], "demo_testuser1")
        self.assertTrue("email" in data)
        self.assertTrue("id" in data)

    def test_update_profile(self):
        token = "demo-testuser2"
        headers = {"Authorization": f"Bearer {token}"}
        resp = self.client.put(
            "/api/auth/profile",
            headers=headers,
            json={
                "display_name": "Aarav Sharma",
                "photo_url": "https://example.com/avatar.jpg",
                "bio": "Adventure and food enthusiast.",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["full_name"], "Aarav Sharma")
        self.assertEqual(data["avatar_url"], "https://example.com/avatar.jpg")
        self.assertEqual(data["bio"], "Adventure and food enthusiast.")

        # Verify persistence via /me
        me_resp = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["full_name"], "Aarav Sharma")


if __name__ == "__main__":
    unittest.main()

