import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NewsTicker from "../components/NewsTicker";
import { listDestinations, listNews } from "../services/api";

export default function HomePage() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [news, setNews] = useState([]);

  // Search capsule form state
  const [targetDestination, setTargetDestination] = useState("Goa");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState("3");
  const [travelers, setTravelers] = useState("2");

  useEffect(() => {
    listDestinations()
      .then((res) => setDestinations(res.data || []))
      .catch(console.warn);
    listNews({ urgent_only: false })
      .then((res) => setNews((res.data || []).slice(0, 3)))
      .catch(console.warn);
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const dest = targetDestination.trim();
    if (dest) {
      navigate(
        `/plan?destination=${encodeURIComponent(dest)}&num_days=${duration}&travelers=${travelers}&start_date=${startDate}`
      );
    } else {
      navigate("/explore");
    }
  };

  const handleQuickDestination = (cityName) => {
    setTargetDestination(cityName);
    navigate(`/plan?destination=${encodeURIComponent(cityName)}&num_days=${duration}&travelers=${travelers}&start_date=${startDate}`);
  };

  return (
    <div style={{ background: "#fcfdfd", minHeight: "100vh" }}>
      {/* Travel Alert Ticker */}
      <NewsTicker />

      {/* ── Travorra-Style Luxury Hero Section ───────────────────────────── */}
      <section className="travorra-hero-section" style={{ position: "relative", padding: "60px 24px 80px", overflow: "hidden" }}>
        {/* Soft atmospheric curved background */}
        <div className="hero-curved-backdrop" />

        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
              marginBottom: "48px",
            }}
          >
            {/* Left Column: Pre-heading, Serif Title, Copy, Trending */}
            <div>
              <div className="pre-heading-track" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(37, 99, 235, 0.08)", color: "#2563eb", padding: "6px 14px", borderRadius: "50px", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "1px", marginBottom: "18px" }}>
                <span>CURATED ITINERARIES &amp; LOCAL GUIDANCE</span>
              </div>

              <h1
                className="serif-heading"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4.2rem)",
                  lineHeight: 1.15,
                  color: "#0f172a",
                  marginBottom: "20px",
                }}
              >
                The world awaits <br />
                <span className="italic-serif" style={{ color: "#2563eb" }}>
                  your next journey.
                </span>
              </h1>

              <p
                style={{
                  fontSize: "1.12rem",
                  color: "#475569",
                  maxWidth: "540px",
                  lineHeight: 1.7,
                  marginBottom: "28px",
                }}
              >
                Discover thoughtfully sequenced itineraries coordinated with local daylight, smooth driving corridors, verified attractions, and authentic dining.
              </p>

              {/* Quick Trending Chips */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Trending:
                </span>
                {["Jaipur", "Goa", "Manali", "Kerala"].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleQuickDestination(city)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "50px",
                      padding: "5px 14px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Visual with Overlays */}
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  height: "440px",
                  borderRadius: "28px",
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                  border: "4px solid #ffffff",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                  alt="Scenic Alpine Lake & Peaks"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Floating Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#fff",
                  borderRadius: "50px",
                  padding: "8px 16px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Coordinated Route Intelligence
              </div>
            </div>
          </div>

          {/* Search Capsule Form */}
          <div
            style={{
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: "22px",
              padding: "20px 24px",
              boxShadow: "0 14px 34px rgba(0,0,0,0.06)",
            }}
          >
            <form
              onSubmit={handleHeroSearch}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto",
                gap: "16px",
                alignItems: "flex-end",
              }}
            >
              {/* Destination Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Destination
                </label>
                <select
                  value={targetDestination}
                  onChange={(e) => setTargetDestination(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    background: "#f8fafc",
                  }}
                >
                  <option value="Goa">Goa (Beaches & Forts)</option>
                  <option value="Jaipur">Jaipur (Palaces & Culture)</option>
                  <option value="Kerala">Kerala (Backwaters & Hills)</option>
                  <option value="Manali">Manali (Mountains & Valleys)</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    background: "#f8fafc",
                  }}
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    background: "#f8fafc",
                  }}
                >
                  <option value="1">1 Day Getaway</option>
                  <option value="2">2 Days Weekend</option>
                  <option value="3">3 Days Standard</option>
                  <option value="4">4 Days Extended</option>
                  <option value="5">5 Days Vacation</option>
                  <option value="7">7 Days Grand Tour</option>
                </select>
              </div>

              {/* Travelers */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Travelers
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    background: "#f8fafc",
                  }}
                >
                  <option value="1">1 Solo Traveler</option>
                  <option value="2">2 Couple / Friends</option>
                  <option value="3">3 Small Group</option>
                  <option value="4">4 Family / Group</option>
                  <option value="6">6+ Large Group</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px 28px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 6px 18px rgba(37, 99, 235, 0.3)",
                    transition: "transform 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  Plan My Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Coordinated Travel Intelligence Feature Grid ──────────────────── */}
      <section style={{ padding: "60px 24px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 className="serif-heading" style={{ fontSize: "2rem", color: "#0f172a", marginBottom: "10px" }}>
            How TripPilot Coordinates Your Journey
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Rather than generic lists, TripPilot sequences each day around real-world conditions so you travel smoothly.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {/* Weather Card */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
              CLIMATE &amp; DAYLIGHT
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              Adaptive Weather Scheduling
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Schedules open-air viewpoints and heritage monuments during cooler morning hours, reserving sheltered spaces during midday heat or rain.
            </p>
          </div>

          {/* Traffic Card */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
              TRANSIT CORRIDORS
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              Congestion-Aware Sequencing
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Plots stops in continuous geographic circuits, steering clear of peak bottleneck hours and eliminating back-and-forth travel.
            </p>
          </div>

          {/* Food Card */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
              AUTHENTIC DINING
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              On-Route Curated Meals
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Matches high-rated regional eateries positioned directly along your day circuit, saving time without sacrificing culinary discovery.
            </p>
          </div>

          {/* Multi-Factor Ranking */}
          <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "18px", padding: "26px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
              CURATION SCORING
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>
              Multi-Factor Route Balance
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Balances traveler feedback, historical significance, and recommended visit durations to build an unhurried, memorable pace.
            </p>
          </div>
        </div>
      </section>

      {/* ── Popular Destinations ────────────────────────────────────────── */}
      <section style={{ padding: "40px 24px 60px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px" }}>
          <div>
            <h2 className="serif-heading" style={{ fontSize: "1.9rem", color: "#0f172a", marginBottom: "6px" }}>
              Explore Iconic Destinations
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
              Curated guides, verified hotels, and signature activities.
            </p>
          </div>
          <Link
            to="/explore"
            style={{
              color: "#2563eb",
              fontWeight: 700,
              fontSize: "0.92rem",
              textDecoration: "none",
            }}
          >
            View All Stays & Places →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "22px" }}>
          {destinations.map((dest) => (
            <div
              key={dest.id}
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
              }}
            >
              <div style={{ height: "180px", position: "relative" }}>
                <img
                  src={dest.image_url}
                  alt={dest.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "50px",
                  }}
                >
                  {dest.state}
                </span>
              </div>
              <div style={{ padding: "18px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>
                  {dest.name}
                </h3>
                <p style={{ fontSize: "0.84rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 14px", flex: 1 }}>
                  {dest.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                    Best: {dest.best_months?.join(", ")}
                  </span>
                  <button
                    onClick={() => handleQuickDestination(dest.name)}
                    style={{
                      background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50px",
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Plan Trip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Travel Advisories & News ────────────────────────────────────── */}
      {news.length > 0 && (
        <section style={{ padding: "40px 24px 60px", maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <h2 className="serif-heading" style={{ fontSize: "1.8rem", color: "#0f172a", marginBottom: "6px" }}>
                Real-Time Travel News &amp; Bulletins
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                Verified updates affecting transit, mountain passes, and coastal weather.
              </p>
            </div>
            <Link
              to="/news"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                fontSize: "0.92rem",
                textDecoration: "none",
              }}
            >
              Browse All News &rarr;
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {news.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: n.is_urgent ? "#fef2f2" : "#eff6ff",
                      color: n.is_urgent ? "#dc2626" : "#2563eb",
                    }}
                  >
                    {n.is_urgent ? "Urgent Alert" : "Advisory"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {n.destination}
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>
                  {n.title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  {n.summary}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px 80px", maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            borderRadius: "24px",
            padding: "48px 36px",
            color: "#ffffff",
            textAlign: "center",
            boxShadow: "0 14px 34px rgba(37, 99, 235, 0.25)",
          }}
        >
          <h2 className="serif-heading" style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "12px", color: "#fff" }}>
            Ready for Effortless, Intelligent Travel?
          </h2>
          <p style={{ fontSize: "1.05rem", opacity: 0.95, maxWidth: "560px", margin: "0 auto 28px", lineHeight: 1.6 }}>
            Create your itinerary in seconds. TripPilot optimizes your days so you can focus on making memories.
          </p>
          <Link
            to="/plan"
            style={{
              background: "#ffffff",
              color: "#1e3a8a",
              padding: "14px 32px",
              borderRadius: "50px",
              fontSize: "1rem",
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            }}
          >
            Start Planning Now
          </Link>
        </div>
      </section>
    </div>
  );
}
