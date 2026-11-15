import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUrgentAlerts } from "../services/api";

export default function NewsTicker() {
  const [alerts, setAlerts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [closed, setClosed] = useState(false);

  // Initial fetch and regular 30-second background polling
  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = () => {
      getUrgentAlerts()
        .then((res) => {
          if (isMounted) {
            setAlerts(res.data || []);
          }
        })
        .catch((err) => console.warn("News alerts fetch error:", err));
    };

    fetchAlerts();
    const pollInterval = setInterval(fetchAlerts, 30000); // 30s auto-refresh

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Cycle through alerts if multiple exist
  useEffect(() => {
    if (alerts.length <= 1) return;
    const cycleInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 7000);
    return () => clearInterval(cycleInterval);
  }, [alerts]);

  if (closed || alerts.length === 0) return null;

  const current = alerts[currentIndex] || alerts[0];

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #991b1b 0%, #b91c1c 100%)",
        color: "#fff",
        padding: "8px 24px",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(185, 28, 28, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
        <span
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.7rem",
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: "50px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#dc2626",
              display: "inline-block",
            }}
          />
          LIVE ADVISORY
        </span>
        <span style={{ fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
          {current.title}
        </span>
        {current.relative_time && (
          <span style={{ fontSize: "0.75rem", color: "#fecaca", opacity: 0.85, whiteSpace: "nowrap" }}>
            ({current.relative_time})
          </span>
        )}
        <Link
          to="/news"
          style={{
            color: "#fecaca",
            textDecoration: "underline",
            fontWeight: 700,
            whiteSpace: "nowrap",
            marginLeft: "6px",
          }}
        >
          Read Details →
        </Link>
      </div>

      <button
        onClick={() => setClosed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "#fecaca",
          fontSize: "1.1rem",
          cursor: "pointer",
          padding: "0 4px",
        }}
        title="Dismiss alert"
      >
        &times;
      </button>
    </div>
  );
}
