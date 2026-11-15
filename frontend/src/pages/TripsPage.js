import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTrips, deleteTrip } from "../services/api";

const DEST_IMAGES = {
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
  jaipur: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80",
  mumbai: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop&q=80",
  manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
  agra: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80",
};

export default function TripsPage() {
  const [trips, setTrips]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTrips().then((r) => setTrips(r.data || [])).finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trip itinerary?")) return;
    await deleteTrip(id);
    setTrips((p) => p.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="loading-text">Loading your custom trips…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "28px" }}>
        <div>
          <h1 className="page-title serif-heading" style={{ margin: 0, fontSize: "2.2rem", color: "#0f172a" }}>
            My Planned Trips
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px" }}>
            Access your rough outlines and trigger Phase 2 agent optimizations.
          </p>
        </div>
        <Link
          to="/plan"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            border: "none",
            borderRadius: "50px",
            padding: "10px 22px",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          + Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state" style={{ background: "#fff", padding: "60px 20px", borderRadius: "20px", border: "2px dashed #cbd5e1", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.3rem", margin: "0 auto 16px" }}>T</div>
          <h3 className="serif-heading" style={{ fontSize: "1.5rem", color: "#0f172a", marginBottom: "8px" }}>
            No trips planned yet
          </h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Craft your personalized journey with real-time weather and traffic intelligence.
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
              fontWeight: 700,
              padding: "12px 24px",
              display: "inline-block",
            }}
          >
            Plan your first trip
          </Link>
        </div>
      ) : (
        <div className="trips-grid">
          {trips.map((t) => {
            const destKey = t.destination?.toLowerCase().trim() || "";
            const bgImg = DEST_IMAGES[destKey] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80";

            return (
              <div
                key={t.id}
                className="trip-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", height: "140px" }}>
                  <img
                    src={bgImg}
                    alt={t.destination}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: "12px",
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "50px",
                    }}
                  >
                    Trip #{t.id}
                  </span>
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div className="trip-card-header" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ color: "#0f172a", fontSize: "1.3rem", margin: 0 }}>{t.destination?.toUpperCase()}</h3>
                    <span
                      className="trip-badge"
                      style={{
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "50px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {t.budget_tier?.toUpperCase()}
                    </span>
                  </div>

                  <div className="trip-card-meta" style={{ gap: "6px", marginBottom: "14px", display: "flex", flexWrap: "wrap" }}>
                    <span className="trip-meta-chip">{t.num_days} days</span>
                    <span className="trip-meta-chip">{t.pace} pace</span>
                    <span className="trip-meta-chip">{t.travelers} traveler{t.travelers > 1 ? "s" : ""}</span>
                  </div>

                  {t.total_cost_inr && (
                    <div className="trip-cost" style={{ color: "#2563eb", fontSize: "1.25rem", margin: "0 0 16px", fontWeight: 800 }}>
                      ₹{t.total_cost_inr.toLocaleString("en-IN")} est.
                    </div>
                  )}

                  <div className="trip-card-actions" style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                    <Link
                      to={`/trips/${t.id}`}
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                        border: "none",
                        borderRadius: "50px",
                        textAlign: "center",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        color: "#fff",
                        textDecoration: "none",
                        padding: "8px 14px",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      View Day Plans
                    </Link>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: "50px", cursor: "pointer" }}
                      onClick={() => remove(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
