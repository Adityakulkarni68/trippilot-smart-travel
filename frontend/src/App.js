import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BookmarkProvider } from "./context/BookmarkContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import PlannerPage from "./pages/PlannerPage";
import TripsPage from "./pages/TripsPage";
import TripDetailPage from "./pages/TripDetailPage";
import NewsPage from "./pages/NewsPage";
import SavedPage from "./pages/SavedPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import "./App.css";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <BookmarkProvider>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/plan" element={<PlannerPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Authenticated / User routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/trips/:id" element={<TripDetailPage />} />
                <Route path="/saved" element={<SavedPage />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer
              style={{
                background: "#0f172a",
                color: "#94a3b8",
                padding: "36px 24px",
                borderTop: "1px solid #1e293b",
                marginTop: "60px",
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem" }}>T</span>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: "1.1rem" }}>TripPilot</span>
                  <span style={{ color: "#64748b" }}>— Intelligent Concierge &amp; Itinerary Platform</span>
                </div>

                <div>
                  Intelligent Travel Platform with real-time routing, weather-adaptive scheduling, and curated recommendations.
                </div>
              </div>
            </footer>
          </div>
        </BookmarkProvider>
      </AuthProvider>
    </Router>
  );
}
