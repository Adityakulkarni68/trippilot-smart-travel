import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTrips } from "../hooks/useTrips";
import { useBookmarks } from "../context/BookmarkContext";
import { listNews } from "../services/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, loading: tripsLoading } = useTrips();
  const { bookmarks } = useBookmarks();
  const [advisories, setAdvisories] = useState([]);

  useEffect(() => {
    listNews({ category: "advisory" })
      .then((res) => setAdvisories(res.data || []))
      .catch(console.warn);
  }, []);

  const totalDays = trips.reduce((s, t) => s + (t.num_days || 0), 0);

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "30px 24px 80px" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#fff",
          borderRadius: "24px",
          padding: "36px 32px",
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)",
        }}
      >
        <div>
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "4px 12px",
              borderRadius: "50px",
              fontSize: "0.78rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TRAVELER ACCOUNT
          </span>
          <h1 className="serif-heading" style={{ fontSize: "2.2rem", fontWeight: 800, margin: "10px 0 6px" }}>
            Welcome back, {user?.full_name || user?.username || "Explorer"}
          </h1>
          <p style={{ opacity: 0.9, fontSize: "1rem", maxWidth: "550px", margin: 0 }}>
            Track your custom itineraries, review night-before agent predictions, and check active destination alerts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            to="/plan"
            style={{
              background: "#ffffff",
              color: "#2563eb",
              fontWeight: 800,
              border: "none",
              borderRadius: "50px",
              padding: "12px 24px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              textDecoration: "none",
            }}
          >
            New Itinerary
          </Link>
          <Link
            to="/explore"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "50px",
              padding: "12px 24px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Explore Stays
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: "36px" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #2563eb" }}>
          <div className="stat-value" style={{ color: "#2563eb" }}>{trips.length}</div>
          <div className="stat-label">Trips Planned</div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div className="stat-value" style={{ color: "#3b82f6" }}>{totalDays}</div>
          <div className="stat-label">Total Days Scheduled</div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #ec4899" }}>
          <div className="stat-value" style={{ color: "#ec4899" }}>{bookmarks ? bookmarks.length : 0}</div>
          <div className="stat-label">Wishlist Saves</div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {new Set(trips.map((t) => t.destination.toLowerCase())).size}
          </div>
          <div className="stat-label">Destinations Visited</div>
        </div>
      </div>

      {/* Active Advisories Ticker */}
      {advisories.length > 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1.5px solid #fcd34d",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#f59e0b", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem" }}>!</span>
            <div>
              <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>
                Active Advisory for Travelers:
              </strong>
              <span style={{ color: "#78350f", fontSize: "0.9rem", marginLeft: "6px" }}>
                {advisories[0].title}
              </span>
            </div>
          </div>
          <Link to="/news" style={{ color: "#b45309", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none" }}>
            View Advisory →
          </Link>
        </div>
      )}

      {/* Recent Trips Section */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className="serif-heading" style={{ fontSize: "1.7rem", color: "#0f172a" }}>
            My Planned Itineraries
          </h2>
          <Link to="/trips" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
            View All ({trips.length}) →
          </Link>
        </div>

        {!tripsLoading && trips.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
            {trips.slice(0, 3).map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "24px",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  borderTop: "4px solid #2563eb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {trip.destination.toUpperCase()}
                  </h3>
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "50px",
                    }}
                  >
                    {trip.pace.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span style={{ background: "#f8fafc", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                    {trip.num_days} Days
                  </span>
                  <span style={{ background: "#f8fafc", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                    {trip.budget_tier} Tier
                  </span>
                  <span style={{ background: "#f8fafc", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>
                    {trip.travelers} Traveler{trip.travelers > 1 ? "s" : ""}
                  </span>
                </div>

                {trip.total_cost_inr && (
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb", marginTop: "auto" }}>
                    ₹{trip.total_cost_inr.toLocaleString("en-IN")} est.
                  </div>
                )}

                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "#64748b" }}>
                  <span>Created {new Date(trip.created_at).toLocaleDateString()}</span>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>Open Day Plans →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!tripsLoading && trips.length === 0 && (
          <div style={{ background: "#fff", padding: "50px", borderRadius: "20px", textAlign: "center", border: "2px dashed #cbd5e1" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.2rem", marginBottom: "16px" }}>
              T
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              No trips created yet
            </h3>
            <p style={{ color: "#64748b", marginBottom: "20px" }}>
              Design your tailored journey in minutes with real-time routing and conditions.
            </p>
            <Link
              to="/plan"
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                border: "none",
                borderRadius: "50px",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 26px",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              Start Planning Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
