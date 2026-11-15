import React from "react";
import TripMap from "./TripMap";

const CON_COLOR = { low: "#16a34a", moderate: "#d97706", high: "#dc2626" };

function mlColor(score) {
  if (score >= 8) return "#16a34a";
  if (score >= 6) return "#d97706";
  return "#dc2626";
}

export default function DailyPlanView({ plan }) {
  if (!plan) return null;
  const {
    weather = {},
    traffic = {},
    stops = [],
    meals = [],
    hotel = {},
    daily_total_inr = 0,
    agent_summary = "",
  } = plan;

  return (
    <div className="daily-view" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* Interactive Map Visualizer */}
      <div style={{ marginBottom: "6px" }}>
        <TripMap stops={stops} meals={meals} hotel={hotel} height="400px" />
      </div>

      {/* Concierge Summary Banner */}
      {agent_summary && (
        <div
          className="agent-summary"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            borderRadius: "16px",
            padding: "20px 24px",
            color: "#fff",
            boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.3)",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              opacity: 0.9,
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>DAILY CONCIERGE BRIEFING</span>
          </div>
          <p style={{ fontSize: "0.95rem", lineHeight: "1.7", margin: 0, fontWeight: 500 }}>
            {agent_summary}
          </p>
        </div>
      )}

      {/* Weather & Traffic telemetry side by side */}
      <div className="agent-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {/* Weather card */}
        <div className="agent-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "20px" }}>
          <div className="agent-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
              Local Weather Outlook
            </div>
            {weather.source && (
              <span style={{ fontSize: "0.68rem", color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                {weather.source}
              </span>
            )}
          </div>
          <div className="weather-temp-row" style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "6px" }}>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, lineHeight: 1, color: "#1e293b" }}>
              {weather.temp_c ?? 26}°C
            </div>
            <div style={{ fontSize: "0.9rem", color: "#64748b", paddingBottom: "4px" }}>
              Feels like {weather.feels_like_c ?? weather.temp_c ?? 26}°C
            </div>
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155", marginBottom: "12px" }}>
            {weather.description || "Clear conditions"}
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
              {weather.humidity_pct ?? 55}% humidity
            </span>
            <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "50px", fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>
              {weather.wind_kmh ?? 12} km/h wind
            </span>
            {weather.last_updated && (
              <span style={{ background: "#f8fafc", padding: "4px 8px", borderRadius: "50px", fontSize: "0.74rem", color: "#94a3b8" }}>
                Synced: {weather.last_updated.split(" ")[1] || weather.last_updated}
              </span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginBottom: "4px" }}>
            <span>Outdoor sightseeing suitability</span>
            <strong style={{ color: "#2563eb" }}>{((weather.suitability_score ?? 0.85) * 10).toFixed(1)} / 10</strong>
          </div>
          <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "50px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(weather.suitability_score ?? 0.85) * 100}%`, background: "#2563eb", borderRadius: "50px" }} />
          </div>
        </div>

        {/* Traffic card */}
        <div className="agent-card" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: "16px", padding: "20px" }}>
          <div className="agent-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
              Transit & Road Flow
            </div>
            {traffic.source && (
              <span style={{ fontSize: "0.68rem", color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                {traffic.source}
              </span>
            )}
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: CON_COLOR[traffic.current_level || traffic.overall_congestion] || "#16a34a", marginBottom: "10px" }}>
            {((traffic.current_level || traffic.overall_congestion || "low")).toUpperCase()} CONGESTION LEVEL
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px", fontSize: "0.86rem" }}>
            <div>Recommended departure: <strong>{traffic.recommended_start || "09:00 AM"}</strong></div>
            {traffic.avoid_times && traffic.avoid_times.length > 0 && (
              <div style={{ color: "#dc2626" }}>Peak volume periods: {traffic.avoid_times.join(", ")}</div>
            )}
          </div>
          {traffic.best_windows && traffic.best_windows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              {traffic.best_windows.slice(0, 4).map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "6px 10px", borderRadius: "8px", fontSize: "0.8rem" }}>
                  <span style={{ fontWeight: 700, width: "55px" }}>{w.time}</span>
                  <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "50px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(w.congestion_score || 0.3) * 100}%`, background: CON_COLOR[w.congestion_level] || "#16a34a" }} />
                  </div>
                  <span style={{ fontWeight: 700, color: CON_COLOR[w.congestion_level] || "#16a34a", width: "70px", textAlign: "right" }}>
                    {w.congestion_level}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: "0.78rem", color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
            Transit legs scheduled to minimize peak corridor wait times.
          </div>
        </div>
      </div>

      {/* Sequenced Stops Timeline */}
      <div>
        <h3 className="serif-heading" style={{ fontSize: "1.3rem", color: "#0f172a", marginBottom: "14px" }}>
          Sequenced Day Timeline
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {stops.map((stop, i) => (
            <div
              key={i}
              className="daily-stop-card"
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                display: "flex",
              }}
            >
              {/* Order number strip */}
              <div
                style={{
                  width: "56px",
                  background: "linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {stop.order || i + 1}
              </div>

              <div style={{ flex: 1, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: 700, padding: "3px 10px", borderRadius: "50px" }}>
                      {stop.suggested_time}
                    </span>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                      {stop.name}
                    </h4>
                    {!stop.weather_suitable && (
                      <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "50px" }}>
                        Indoor Recommended
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "50px",
                      color: "#fff",
                      background: mlColor(stop.ml_score || 8.5),
                    }}
                  >
                    Match: {stop.ml_score || 8.5}/10
                  </div>
                </div>

                {stop.description && (
                  <p style={{ fontSize: "0.88rem", color: "#475569", margin: "6px 0 12px", lineHeight: 1.5 }}>
                    {stop.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "50px", fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                    Duration: {stop.duration_hours || 1.5} hrs
                  </span>
                  <span style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "50px", fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                    Estimated Activity Fee: ₹{stop.cost_inr?.toLocaleString("en-IN") || "0"}
                  </span>
                </div>

                {/* Score Breakdown Bars */}
                {stop.score_breakdown && (
                  <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 14px" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>
                      Evaluation Factor Breakdown
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                      {Object.entries(stop.score_breakdown).map(([k, v]) => (
                        <div key={k}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b" }}>
                            <span style={{ textTransform: "capitalize" }}>{k}</span>
                            <strong>{(v * 10).toFixed(1)}</strong>
                          </div>
                          <div style={{ height: "4px", background: "#e2e8f0", borderRadius: "50px", overflow: "hidden", marginTop: "2px" }}>
                            <div style={{ height: "100%", width: `${v * 100}%`, background: "#2563eb" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dining Section */}
      {meals.length > 0 && (
        <div>
          <h3 className="serif-heading" style={{ fontSize: "1.25rem", color: "#0f172a", marginBottom: "14px" }}>
            Curated Dining Along Route
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {meals.map((m, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#2563eb", letterSpacing: "0.5px" }}>
                    {m.meal_type}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "50px",
                      background: m.on_route ? "#eff6ff" : "#fff7ed",
                      color: m.on_route ? "#1d4ed8" : "#ea580c",
                    }}
                  >
                    {m.on_route ? "On Route" : `${m.distance_km} km detour`}
                  </span>
                </div>

                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e293b", margin: "4px 0" }}>
                  {m.name}
                </h4>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>
                  {m.cuisine}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginTop: "auto" }}>
                  Rating: {m.rating} / 5 · Price Band: {m.price_band}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Footer Total */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1.5px solid #cbd5e1",
          borderRadius: "16px",
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ background: "#4f46e5", color: "#fff", fontWeight: 800, fontSize: "0.72rem", padding: "4px 10px", borderRadius: "6px", textTransform: "uppercase" }}>
            BASE HOTEL
          </span>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Lodging Accommodations
            </div>
            <strong style={{ fontSize: "1rem", color: "#1e293b" }}>{hotel.name || "Selected Hotel"}</strong>
            {hotel.description && (
              <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "6px" }}>
                · {hotel.description}
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", textAlign: "right" }}>
            Total Daily Calculated Budget
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563eb", textAlign: "right" }}>
            ₹{daily_total_inr?.toLocaleString("en-IN")}
          </div>
        </div>
      </div>
    </div>
  );
}
