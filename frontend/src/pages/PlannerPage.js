import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createRoughPlan } from "../services/api";

const BUDGETS = [
  { val: "budget", label: "Budget", sub: "₹500–1,500/night" },
  { val: "mid", label: "Mid-Range", sub: "₹1,500–5,000/night" },
  { val: "luxury", label: "Luxury", sub: "₹5,000+/night" },
];

const PACES = [
  { val: "relaxed", label: "Relaxed", sub: "2 stops/day" },
  { val: "balanced", label: "Balanced", sub: "4 stops/day" },
  { val: "fast", label: "Fast-Paced", sub: "6 stops/day" },
];

const POPULAR_DESTINATIONS = ["Goa", "Jaipur", "Manali", "Mumbai", "Delhi", "Agra"];

export default function PlannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    destination: searchParams.get("destination") || "Goa",
    origin: "",
    start_date: searchParams.get("start_date") || new Date().toISOString().split("T")[0],
    num_days: Number(searchParams.get("num_days")) || 3,
    budget_tier: "mid",
    pace: "balanced",
    travelers: Number(searchParams.get("travelers")) || 2,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = searchParams.get("destination");
    if (d) setForm((f) => ({ ...f, destination: d }));
    const n = searchParams.get("num_days");
    if (n) setForm((f) => ({ ...f, num_days: Number(n) }));
    const t = searchParams.get("travelers");
    if (t) setForm((f) => ({ ...f, travelers: Number(t) }));
    const s = searchParams.get("start_date");
    if (s) setForm((f) => ({ ...f, start_date: s }));
  }, [searchParams]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handle = (e) => {
    const { name, value, type } = e.target;
    set(name, type === "number" ? Number(value) : value);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await createRoughPlan(form);
      navigate(`/trips/${res.data.trip_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planner-page">
      {/* Luxury Royal Hero */}
      <div
        className="planner-hero"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
          boxShadow: "0 12px 30px rgba(37, 99, 235, 0.22)",
        }}
      >
        <span
          style={{
            background: "rgba(255, 255, 255, 0.22)",
            backdropFilter: "blur(6px)",
            padding: "4px 16px",
            borderRadius: "50px",
            fontSize: "0.8rem",
            fontWeight: 800,
            textTransform: "uppercase",
            display: "inline-block",
            marginBottom: "14px",
            letterSpacing: "0.8px",
          }}
        >
          TRIPPILOT · DAY-WISE ITINERARY PLANNER
        </span>
        <h1 className="serif-heading" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
          Plan Your Custom Journey
        </h1>
        <p style={{ maxWidth: "660px", margin: "0 auto", opacity: 0.95, lineHeight: 1.7 }}>
          Daily itineraries coordinated with local weather windows, traffic patterns, attractions, and on-route dining.
        </p>
      </div>

      {/* Form card floats over hero */}
      <div className="planner-form-wrap">
        <form onSubmit={submit}>
          <div className="form-section-title">Step 1: Destination &amp; Dates</div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Popular Destinations:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {POPULAR_DESTINATIONS.map((city) => {
                const isSelected = form.destination.toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => set("destination", city)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "50px",
                      border: isSelected ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      color: isSelected ? "#2563eb" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Target Destination *</label>
              <input
                name="destination"
                required
                value={form.destination}
                onChange={handle}
                placeholder="e.g. Goa, Jaipur, Manali, Mumbai, Delhi, Agra"
              />
            </div>
            <div className="form-group">
              <label>Departing From (optional)</label>
              <input name="origin" value={form.origin} onChange={handle} placeholder="e.g. Bangalore, Delhi, Mumbai" />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input name="start_date" type="date" value={form.start_date} onChange={handle} />
            </div>
            <div className="form-group">
              <label>Number of Days</label>
              <input name="num_days" type="number" min="1" max="14" value={form.num_days} onChange={handle} />
            </div>
            <div className="form-group">
              <label>Travelers</label>
              <input name="travelers" type="number" min="1" max="10" value={form.travelers} onChange={handle} />
            </div>
          </div>

          <hr className="form-divider" />
          <div className="form-section-title">Step 2: Budget Preference</div>
          <div className="pill-group" style={{ marginBottom: 20 }}>
            {BUDGETS.map((b) => (
              <button
                key={b.val}
                type="button"
                className={`pill ${form.budget_tier === b.val ? "pill-active" : ""}`}
                onClick={() => set("budget_tier", b.val)}
                style={
                  form.budget_tier === b.val
                    ? { background: "#2563eb", borderColor: "#2563eb", color: "#fff", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }
                    : {}
                }
              >
                <span>{b.label}</span>
                <span style={{ fontSize: ".75rem", opacity: 0.85, marginLeft: 6 }}>{b.sub}</span>
              </button>
            ))}
          </div>

          <div className="form-section-title">Step 3: Travel Pace</div>
          <div className="pill-group" style={{ marginBottom: 26 }}>
            {PACES.map((p) => (
              <button
                key={p.val}
                type="button"
                className={`pill ${form.pace === p.val ? "pill-active" : ""}`}
                onClick={() => set("pace", p.val)}
                style={
                  form.pace === p.val
                    ? { background: "#2563eb", borderColor: "#2563eb", color: "#fff", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }
                    : {}
                }
              >
                <span>{p.label}</span>
                <span style={{ fontSize: ".75rem", opacity: 0.85, marginLeft: 6 }}>{p.sub}</span>
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              border: "none",
              fontSize: "1.08rem",
              fontWeight: 800,
              padding: "16px",
              borderRadius: "50px",
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.35)",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            {loading ? (
              <>
                <span className="spinner-inline" /> Generating Itinerary…
              </>
            ) : (
              "Generate Day-Wise Itinerary & Route"
            )}
          </button>
        </form>
      </div>

      {/* How it works info cards */}
      <div className="how-it-works">
        <h2 className="serif-heading" style={{ fontSize: "2rem", color: "#0f172a" }}>
          How TripPilot Works
        </h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>1</div>
            <h3>Traffic-Aware Route Loop</h3>
            <p>Stops are sequenced along optimal travel corridors to eliminate back-and-forth driving, with realistic travel times between stops.</p>
          </div>
          <div className="step-card">
            <div className="step-num" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>2</div>
            <h3>Weather-Smart Scheduling</h3>
            <p>Outdoor forts and scenic viewpoints are scheduled during cool morning hours, while indoor museums are prioritized during midday heat.</p>
          </div>
          <div className="step-card">
            <div className="step-num" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>3</div>
            <h3>Interactive Map Routing</h3>
            <p>Explore your entire day on a clean vector map featuring sequential stops, travel polylines, and curated on-route dining.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
