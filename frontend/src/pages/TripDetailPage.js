import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getTrip, getDailyPlan } from "../services/api";
import TripMap from "../components/TripMap";

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip]                     = useState(null);
  const [rough, setRough]                   = useState(null);
  const [activeDay, setActiveDay]           = useState(1);
  const [dailyPlan, setDailyPlan]           = useState(null);
  const [loadingPlan, setLoadingPlan]       = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [error, setError]                   = useState("");
  const [copied, setCopied]                 = useState(false);

  const stopRefs = useRef({});

  // 1. Initial Load
  useEffect(() => {
    getTrip(id)
      .then((r) => {
        setTrip(r.data);
        setRough(r.data.rough_plan);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Could not load trip details.");
        setLoadingPlan(false);
      });
  }, [id]);

  // 2. Fetch or auto-generate daily plan whenever activeDay or trip changes
  useEffect(() => {
    if (!trip) return;
    setLoadingPlan(true);
    setSelectedStopId(null);

    getDailyPlan(trip.id, activeDay)
      .then((r) => {
        setDailyPlan(r.data);
      })
      .catch((err) => {
        console.error("Error fetching daily plan:", err);
        setDailyPlan(null);
      })
      .finally(() => setLoadingPlan(false));
  }, [trip, activeDay]);

  // 3. Regular 60-second background polling for live weather & traffic conditions
  useEffect(() => {
    if (!trip) return;
    const telemetryInterval = setInterval(() => {
      getDailyPlan(trip.id, activeDay, true)
        .then((r) => {
          setDailyPlan(r.data);
        })
        .catch((err) => {
          console.warn("Background telemetry update failed:", err);
        });
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(telemetryInterval);
  }, [trip, activeDay]);

  // 4. User explicitly refreshes live weather / traffic
  const handleRefreshLive = async () => {
    if (!trip) return;
    setRefreshing(true);
    setError("");
    try {
      const res = await getDailyPlan(trip.id, activeDay, true);
      setDailyPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to refresh live conditions.");
    } finally {
      setRefreshing(false);
    }
  };

  // 4. Select stop from Map or Timeline
  const handleSelectStop = (stopId) => {
    setSelectedStopId(stopId);
    if (stopRefs.current[stopId]) {
      stopRefs.current[stopId].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!trip || !rough) {
    return (
      <div className="page-container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ color: "#0f172a", marginBottom: "8px" }}>Loading Trip Details…</h2>
        <p style={{ color: "#64748b" }}>Preparing your itinerary schedule and route loop.</p>
      </div>
    );
  }

  const currentRoughDay = rough.days?.find((d) => d.day === activeDay);
  const stops = (dailyPlan?.stops && dailyPlan.stops.length > 0) ? dailyPlan.stops : (currentRoughDay?.highlights || []);
  const meals = dailyPlan?.meals || [];
  const hotel = dailyPlan?.hotel || {
    name: `${trip.destination} Accommodation`,
    zone: currentRoughDay?.hotel_zone || "City Center",
    lat: stops[0]?.lat ? stops[0].lat - 0.01 : null,
    lon: stops[0]?.lon ? stops[0].lon - 0.01 : null,
  };
  const weather = dailyPlan?.weather;
  const traffic = dailyPlan?.traffic;


  const lunchMeal = meals.find((m) => m.meal_type === "lunch");
  const dinnerMeal = meals.find((m) => m.meal_type === "dinner");
  const halfStops = Math.max(1, Math.floor(stops.length / 2));

  return (
    <div className="page-container" style={{ maxWidth: "1320px", margin: "0 auto", padding: "24px 20px 80px" }}>
      {/* Top action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <Link to="/trips" className="back-link" style={{ margin: 0, fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
          &larr; My Trips
        </Link>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleShare}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "50px", fontWeight: 700, padding: "7px 16px" }}
          >
            {copied ? "Link Copied" : "Share Itinerary"}
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: "50px", fontWeight: 700, padding: "7px 16px" }}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div
        className="trip-hero"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
          boxShadow: "0 12px 30px rgba(37, 99, 235, 0.22)",
          borderRadius: "24px",
          padding: "32px 36px",
          color: "#ffffff",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(6px)",
                padding: "4px 14px",
                borderRadius: "50px",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "inline-block",
                marginBottom: "8px",
              }}
            >
              TRIPPILOT · ITINERARY #{trip.id}
            </span>
            <h1 className="serif-heading" style={{ margin: "4px 0 8px", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
              {trip.destination.toUpperCase()}
            </h1>
            <p style={{ margin: 0, opacity: 0.92, fontSize: "0.98rem", maxWidth: "680px", lineHeight: 1.6 }}>
              {currentRoughDay?.theme ? `${currentRoughDay.theme} — ${rough.summary}` : rough.summary}
            </p>
          </div>

          {trip.total_cost_inr && (
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", padding: "12px 24px", borderRadius: "18px", textAlign: "right" }}>
              <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", opacity: 0.9 }}>
                Estimated Trip Budget
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.2 }}>
                ₹{trip.total_cost_inr.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.74rem", opacity: 0.85, marginTop: "2px" }}>
                for {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>

        <div className="trip-meta-row" style={{ marginTop: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="trip-meta-pill">{trip.num_days} Days</span>
          <span className="trip-meta-pill">{trip.budget_tier?.toUpperCase()} Tier</span>
          <span className="trip-meta-pill">{trip.pace?.toUpperCase()} Pace</span>
          <span className="trip-meta-pill">{trip.travelers} Traveler{trip.travelers > 1 ? "s" : ""}</span>
          {trip.origin && <span className="trip-meta-pill">From {trip.origin}</span>}
        </div>
      </div>


      {/* Day Selector Tabs */}
      <div className="day-tabs-container" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {rough.days?.map((d) => {
            const isAct = d.day === activeDay;
            return (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                style={{
                  padding: "12px 22px",
                  borderRadius: "16px",
                  border: isAct ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                  background: isAct ? "#2563eb" : "#ffffff",
                  color: isAct ? "#ffffff" : "#334155",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  boxShadow: isAct ? "0 6px 18px rgba(37, 99, 235, 0.25)" : "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", opacity: isAct ? 0.9 : 0.6, letterSpacing: "0.5px" }}>
                  Day {d.day}
                </span>
                <span style={{ fontWeight: 800, fontSize: "0.98rem" }}>
                  {d.theme || `Exploration Day ${d.day}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "20px" }}>{error}</div>}

      {/* Main Split Grid: Left Itinerary Timeline, Right Sticky Interactive Map */}
      <div className="itinerary-grid">

        {/* ── Left Column: Day Itinerary & Briefing ───────────────────────── */}
        <div className="itinerary-timeline-column" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {loadingPlan ? (
            <div style={{ background: "#ffffff", padding: "60px 20px", borderRadius: "20px", border: "1.5px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <h3 style={{ color: "#0f172a" }}>Curating Day {activeDay} Schedule…</h3>
              <p style={{ color: "#64748b", margin: 0 }}>Reviewing transit flow, weather patterns, and optimal stop sequencing.</p>
            </div>
          ) : dailyPlan ? (
            <>
              {/* Day Weather & Traffic Briefing Card */}
              <div
                className="day-briefing-card"
                style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  border: "1.5px solid #e2e8f0",
                  padding: "22px 24px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#16a34a",
                        display: "inline-block",
                        boxShadow: "0 0 6px #16a34a",
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", color: "#1e293b", letterSpacing: "0.5px" }}>
                      DAY {activeDay} REAL-TIME TELEMETRY &amp; CONDITIONS
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "20px" }}>
                      Auto-updates every 60s
                    </span>
                    {weather?.last_updated && (
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        (Last synced: {weather.last_updated.split(" ")[1] || weather.last_updated})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleRefreshLive}
                    disabled={refreshing}
                    className="btn btn-secondary btn-sm"
                    style={{ borderRadius: "50px", fontSize: "0.76rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>{refreshing ? "Refreshing Live Data…" : "↻ Force Refresh"}</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Weather Snapshot */}
                  {weather && (
                    <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                          Weather Outlook
                        </span>
                        {weather.source && (
                          <span style={{ fontSize: "0.68rem", color: "#2563eb", background: "#eff6ff", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                            {weather.source}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>
                          {weather.temp_c}°C
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          {weather.description}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0" }}>
                        Feels like {weather.feels_like_c}°C &bull; {weather.humidity_pct}% humidity &bull; {weather.wind_kmh} km/h wind
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#334155", margin: "6px 0 0", lineHeight: 1.4 }}>
                        {weather.suitability === "outdoor_great"
                          ? "Pleasant skies — optimal for open-air exploration."
                          : weather.suitability === "indoor_preferred"
                          ? "Higher heat or precipitation probability — consider indoor alternatives."
                          : "Mild conditions throughout the day."}
                      </p>
                    </div>
                  )}

                  {/* Route & Traffic Snapshot */}
                  {traffic && (
                    <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                          Transit &amp; Congestion
                        </span>
                        {traffic.source && (
                          <span style={{ fontSize: "0.68rem", color: "#16a34a", background: "#f0fdf4", padding: "1px 6px", borderRadius: "10px", fontWeight: 600 }}>
                            {traffic.source}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 800, color: traffic.current_level === "high" || traffic.overall_congestion === "high" ? "#dc2626" : "#16a34a" }}>
                          {((traffic.current_level || traffic.overall_congestion || "low")).toUpperCase()} CONGESTION
                        </span>
                        {traffic.current_score !== undefined && (
                          <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                            (Score: {((traffic.current_score ?? 0.8) * 10).toFixed(1)}/10)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#334155", marginTop: "6px", lineHeight: 1.4 }}>
                        Depart hotel by: <strong>{traffic.recommended_start || "09:00 AM"}</strong>
                        {traffic.avoid_times && traffic.avoid_times.length > 0 && (
                          <div style={{ color: "#b45309", fontSize: "0.75rem", marginTop: "2px" }}>
                            Rush hour avoid: {traffic.avoid_times.slice(0, 3).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chronological Step-by-Step Day Timeline */}
              <div style={{ display: "flex", flexDirection: "column" }}>

                {/* 1. Starting Base Hotel */}
                <div
                  ref={(el) => (stopRefs.current["hotel"] = el)}
                  onClick={() => handleSelectStop("hotel")}
                  className={`timeline-stop-card ${selectedStopId === "hotel" ? "active-stop" : ""}`}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    border: "1.5px solid #e2e8f0",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 800 }}>
                      H
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "#4f46e5" }}>
                        START OF DAY · LODGING BASE
                      </span>
                      <h4 style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {hotel.name}
                      </h4>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {hotel.zone ? `Zone: ${hotel.zone}` : "Base accommodations"}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b" }}>
                    {traffic?.recommended_start || "09:00 AM"} Depart
                  </div>
                </div>

                {/* Stops and Meals in Chronological Sequence */}
                {stops.map((stop, idx) => {
                  const stopId = `stop-${idx}`;
                  const isAct = selectedStopId === stopId;
                  const transit = stop.transit_from_previous;

                  return (
                    <React.Fragment key={idx}>
                      {/* Midday Lunch Card insertion */}
                      {idx === halfStops && lunchMeal && (
                        <>
                          <div className="transit-connector">
                            <span className="transit-pill">
                              Transit ~10 mins (2.4 km) · Direct Route
                            </span>
                            <span className="transit-tip">Heading to curated lunch</span>
                          </div>

                          <div
                            ref={(el) => (stopRefs.current["meal-lunch"] = el)}
                            onClick={() => handleSelectStop("meal-lunch")}
                            className={`timeline-stop-card ${selectedStopId === "meal-lunch" ? "active-stop" : ""}`}
                            style={{
                              background: "linear-gradient(145deg, #fff7ed 0%, #ffedd5 100%)",
                              borderRadius: "18px",
                              border: "1.5px solid #fed7aa",
                              padding: "18px 22px",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ea580c", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800 }}>
                                  L
                                </span>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#ea580c" }}>
                                      CURATED LUNCH · 13:00 - 14:15
                                    </span>
                                    <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "50px" }}>
                                      Rating {lunchMeal.rating}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 800, color: "#7c2d12" }}>
                                    {lunchMeal.name}
                                  </h4>
                                </div>
                              </div>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9a3412" }}>
                                {lunchMeal.cuisine} ({lunchMeal.price_band})
                              </span>
                            </div>
                            <p style={{ margin: "8px 0 0", fontSize: "0.84rem", color: "#9a3412", lineHeight: 1.4 }}>
                              Directly on the day’s route. Authentic regional dishes with high community ratings.
                            </p>
                          </div>
                        </>
                      )}

                      {/* Transit Connector between locations */}
                      {transit && (
                        <div className="transit-connector">
                          <span className="transit-pill">
                            Transit {transit.duration_mins} mins ({transit.distance_km} km)
                          </span>
                          <span className="transit-tip">
                            {transit.route_tip || `Direct route to Stop #${stop.order}`}
                          </span>
                        </div>
                      )}

                      {/* Stop Card */}
                      <div
                        ref={(el) => (stopRefs.current[stopId] = el)}
                        onClick={() => handleSelectStop(stopId)}
                        className={`timeline-stop-card ${isAct ? "active-stop" : ""}`}
                        style={{
                          background: "#ffffff",
                          borderRadius: "18px",
                          border: isAct ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                          padding: "20px 22px",
                          boxShadow: isAct ? "0 8px 24px rgba(37, 99, 235, 0.15)" : "0 2px 6px rgba(0,0,0,0.03)",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                                color: "#ffffff",
                                fontWeight: 900,
                                fontSize: "0.95rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {stop.order}
                            </span>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: "0.78rem", fontWeight: 700, padding: "2px 8px", borderRadius: "50px" }}>
                                  {stop.suggested_time} {stop.end_time ? `– ${stop.end_time}` : ""}
                                </span>
                                {stop.curator_badge && (
                                  <span style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.74rem", fontWeight: 700, padding: "2px 8px", borderRadius: "50px" }}>
                                    {stop.curator_badge}
                                  </span>
                                )}
                              </div>
                              <h4 style={{ margin: "4px 0 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                                {stop.name}
                              </h4>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563eb" }}>
                              {stop.duration_hours} hrs
                            </span>
                            {stop.cost_inr > 0 && (
                              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                ₹{stop.cost_inr.toLocaleString("en-IN")} est.
                              </div>
                            )}
                          </div>
                        </div>

                        {stop.description && (
                          <p style={{ margin: "8px 0 10px", fontSize: "0.88rem", color: "#475569", lineHeight: 1.5 }}>
                            {stop.description}
                          </p>
                        )}

                        {stop.weather_tip && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #dcfce7", padding: "6px 12px", borderRadius: "10px", fontSize: "0.78rem", color: "#166534" }}>
                            <span style={{ fontWeight: 700 }}>Tip:</span>
                            <span>{stop.weather_tip}</span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Evening Dinner Stop */}
                {dinnerMeal && (
                  <>
                    <div className="transit-connector">
                      <span className="transit-pill">
                        Transit ~15 mins · Evening Route
                      </span>
                      <span className="transit-tip">Heading to evening dinner</span>
                    </div>

                    <div
                      ref={(el) => (stopRefs.current["meal-dinner"] = el)}
                      onClick={() => handleSelectStop("meal-dinner")}
                      className={`timeline-stop-card ${selectedStopId === "meal-dinner" ? "active-stop" : ""}`}
                      style={{
                        background: "#ffffff",
                        borderRadius: "18px",
                        border: "1.5px solid #fed7aa",
                        padding: "18px 22px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#b45309", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800 }}>
                            D
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#b45309" }}>
                                EVENING DINNER · 20:00
                              </span>
                              <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "50px" }}>
                                Rating {dinnerMeal.rating}
                              </span>
                            </div>
                            <h4 style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                              {dinnerMeal.name}
                            </h4>
                          </div>
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>
                          {dinnerMeal.cuisine} ({dinnerMeal.price_band})
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Return to Base Connector */}
                <div className="transit-connector">
                  <span className="transit-pill">
                    Transit ~12 mins · Return Route
                  </span>
                  <span className="transit-tip">Return to accommodation for rest</span>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "1.5px dashed #cbd5e1",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>Return to <strong>{hotel.name}</strong></span>
                  <span style={{ fontWeight: 600 }}>End of Day {activeDay} Itinerary</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: "#ffffff", padding: "60px 20px", borderRadius: "20px", border: "1.5px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 900, fontSize: "1.2rem" }}>
                D{activeDay}
              </div>
              <h3 style={{ color: "#0f172a" }}>Day {activeDay} Route Ready</h3>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>
                Generate your tailored day plan with real-time conditions, transit estimates, and dining recommendations.
              </p>
              <button onClick={handleRefreshLive} className="btn btn-primary" style={{ borderRadius: "50px" }}>
                Generate Day {activeDay} Plan
              </button>
            </div>
          )}
        </div>

        {/* ── Right Column: Sticky High-End Route Map ────────────────────── */}
        <div className="itinerary-map-column">
          <div className="sticky-map-column">
            <TripMap
              stops={stops}
              meals={meals}
              hotel={hotel}
              height="100%"
              activeStopId={selectedStopId}
              onSelectStop={handleSelectStop}
              totalDistanceKm={dailyPlan?.total_distance_km}
              totalTransitMins={dailyPlan?.total_transit_mins}
              trafficStatus={traffic?.overall_congestion || "low"}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
