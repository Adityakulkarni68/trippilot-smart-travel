import unittest
from app.ml.ranker import rank_and_sequence, haversine_km
from app.schemas.trip import WeatherInfo, TrafficInfo, TrafficWindow


class TestMLRanker(unittest.TestCase):
    def setUp(self):
        self.weather_good = WeatherInfo(
            temp_c=26.0,
            feels_like_c=25.0,
            description="Sunny and Pleasant",
            humidity_pct=55,
            wind_kmh=12.0,
            suitability="outdoor_great",
            suitability_score=0.95,
        )
        self.weather_bad = WeatherInfo(
            temp_c=24.0,
            feels_like_c=24.0,
            description="Heavy Monsoon Rain",
            humidity_pct=95,
            wind_kmh=35.0,
            suitability="indoor_preferred",
            suitability_score=0.20,
        )
        self.traffic = TrafficInfo(
            overall_congestion="low",
            best_windows=[
                TrafficWindow(time="09:00", congestion_level="low", congestion_score=0.9, suggestion="Clear"),
                TrafficWindow(time="11:30", congestion_level="low", congestion_score=0.85, suggestion="Clear"),
            ],
            avoid_times=["17:00", "18:00"],
            recommended_start="09:00",
        )

    def test_haversine_distance(self):
        # Gateway of India (18.9220, 72.8347) to Marine Drive (18.9440, 72.8237)
        dist = haversine_km(18.9220, 72.8347, 18.9440, 72.8237)
        # Real-world distance is ~2.7 km
        self.assertAlmostEqual(dist, 2.7, delta=0.5)

    def test_rank_and_sequence_order_and_scores(self):
        stops = [
            {"name": "Amber Fort", "type": "fort", "lat": 26.9855, "lon": 75.8513, "description": "Historic hill fort", "cost_inr": 200},
            {"name": "Local Museum", "type": "museum", "lat": 26.9121, "lon": 75.8195, "description": "Indoor city museum", "cost_inr": 100},
            {"name": "City Palace", "type": "palace", "lat": 26.9258, "lon": 75.8237, "description": "Royal palace", "cost_inr": 300},
        ]

        ranked = rank_and_sequence(stops, self.weather_good, self.traffic, "mid")
        self.assertEqual(len(ranked), 3)

        # Check rankings and score validity
        for idx, stop in enumerate(ranked, start=1):
            self.assertEqual(stop.order, idx)
            self.assertGreaterEqual(stop.ml_score, 1.0)
            self.assertLessEqual(stop.ml_score, 10.0)
            self.assertTrue(isinstance(stop.suggested_time, str))
            self.assertTrue(len(stop.suggested_time) == 5)  # HH:MM format

    def test_weather_penalty_on_outdoor_attractions(self):
        outdoor_stop = {"name": "Baga Beach", "type": "beach", "lat": 15.555, "lon": 73.751, "description": "Open beach", "cost_inr": 100}
        indoor_stop = {"name": "Goa State Museum", "type": "museum", "lat": 15.498, "lon": 73.827, "description": "Indoor air-conditioned heritage museum", "cost_inr": 50}

        ranked_good = rank_and_sequence([outdoor_stop, indoor_stop], self.weather_good, self.traffic, "mid")
        ranked_bad = rank_and_sequence([outdoor_stop, indoor_stop], self.weather_bad, self.traffic, "mid")

        # In good weather, outdoor should rank higher or score high
        outdoor_good = next(s for s in ranked_good if s.name == "Baga Beach")
        outdoor_bad = next(s for s in ranked_bad if s.name == "Baga Beach")
        self.assertGreater(outdoor_good.ml_score, outdoor_bad.ml_score)

    def test_empty_stops_handling(self):
        ranked = rank_and_sequence([], self.weather_good, self.traffic, "budget")
        self.assertEqual(ranked, [])


if __name__ == "__main__":
    unittest.main()

