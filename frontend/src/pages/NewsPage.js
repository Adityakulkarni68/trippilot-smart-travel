import React, { useState, useEffect, useCallback } from "react";
import { listNews, refreshNews } from "../services/api";

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDest, setSelectedDest] = useState("");
  const [search, setSearch] = useState("");
  const [activeArticle, setActiveArticle] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchNews = useCallback((force = false) => {
    if (force) setRefreshing(true);
    listNews({
      category: selectedCat === "all" ? undefined : selectedCat,
      destination: selectedDest || undefined,
      refresh: force ? true : undefined,
    })
      .then((res) => {
        setArticles(res.data || []);
        setLastUpdated(new Date());
      })
      .catch(console.warn)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [selectedCat, selectedDest]);

  // Initial and parameter-triggered fetch
  useEffect(() => {
    setLoading(true);
    fetchNews(false);
  }, [fetchNews]);

  // Periodic 60-second background polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchNews(false);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchNews]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNews();
      fetchNews(true);
    } catch (err) {
      console.warn("Manual refresh failed, fetching standard list:", err);
      fetchNews(true);
    }
  };

  const filtered = articles.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.summary && a.summary.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: 800, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#16a34a",
                display: "inline-block",
                boxShadow: "0 0 8px #16a34a",
              }}
            />
            <span>LIVE OFFICIAL TRAVEL BULLETINS &amp; ADVISORIES</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#334155", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: "#2563eb", width: "16px", height: "16px" }}
              />
              Auto-update (60s)
            </label>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1.5px solid #2563eb",
                background: refreshing ? "#eff6ff" : "#2563eb",
                color: refreshing ? "#2563eb" : "#ffffff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: refreshing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <span>{refreshing ? "Refreshing…" : "↻ Refresh Feed"}</span>
            </button>
          </div>
        </div>

        <h1 className="serif-heading" style={{ fontSize: "2.4rem", color: "#0f172a", marginTop: "8px" }}>
          Travel News, Weather &amp; Safety Alerts
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.05rem", marginTop: "4px" }}>
          Stay updated with real-time notices on road transit, seasonal weather conditions, festival calendars, and travel safety.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
        {[
          { id: "all", label: "All Updates" },
          { id: "advisory", label: "Safety Advisories" },
          { id: "weather", label: "Weather Watch" },
          { id: "festival", label: "Cultural Festivals" },
          { id: "transit", label: "Transit & Expressways" },
          { id: "trends", label: "Travel Trends & Guides" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              padding: "9px 20px",
              borderRadius: "50px",
              border: selectedCat === cat.id ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
              background: selectedCat === cat.id ? "#2563eb" : "#ffffff",
              color: selectedCat === cat.id ? "#ffffff" : "#475569",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: selectedCat === cat.id ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "14px",
          padding: "14px 18px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "28px",
        }}
      >
        <div style={{ minWidth: "160px" }}>
          <select
            value={selectedDest}
            onChange={(e) => setSelectedDest(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          >
            <option value="">All Destinations</option>
            <option value="manali">Manali</option>
            <option value="goa">Goa</option>
            <option value="jaipur">Jaipur</option>
            <option value="mumbai">Mumbai</option>
            <option value="delhi">Delhi</option>
            <option value="agra">Agra</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search news by keywords (e.g. snowfall, beach, traffic, festival)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </div>
      </div>

      {/* News Articles Grid */}
      {loading ? (
        <p className="loading-text">Fetching latest travel bulletins…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
          {filtered.map((item) => {
            const isUrgent = item.urgent || item.is_urgent;
            return (
              <article
                key={item.id}
                onClick={() => setActiveArticle(item)}
                style={{
                  background: "#ffffff",
                  border: isUrgent ? "2px solid #ef4444" : "1.5px solid #e2e8f0",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ position: "relative", height: "190px" }}>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: isUrgent ? "#dc2626" : "rgba(0,0,0,0.7)",
                      color: "#fff",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "50px",
                      textTransform: "uppercase",
                    }}
                  >
                    {isUrgent ? "CRITICAL ADVISORY" : item.category}
                  </span>

                  {item.destination && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "50px",
                      }}
                    >
                      {item.destination.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b", marginBottom: "8px" }}>
                    <span>
                      {item.relative_time ? (
                        <strong style={{ color: isUrgent ? "#dc2626" : "#2563eb" }}>{item.relative_time}</strong>
                      ) : item.published_at ? (
                        new Date(item.published_at).toLocaleDateString()
                      ) : (
                        "Recent"
                      )}
                    </span>
                    <span>{item.read_time || "3 min read"}</span>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: "0 0 8px", lineHeight: 1.4 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.6, marginBottom: "16px", flex: 1 }}>
                    {item.summary}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
                      Source: {item.source}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 700 }}>
                      Read details &rarr;
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal View for Article Details */}
      {activeArticle && (
        <div
          onClick={() => setActiveArticle(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ position: "relative", height: "260px" }}>
              <img
                src={activeArticle.image_url}
                alt={activeArticle.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "20px 20px 0 0" }}
              />
              <button
                onClick={() => setActiveArticle(null)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  color: "#ffffff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span
                  style={{
                    background: (activeArticle.urgent || activeArticle.is_urgent) ? "#fee2e2" : "#e0f2fe",
                    color: (activeArticle.urgent || activeArticle.is_urgent) ? "#dc2626" : "#0369a1",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "50px",
                    textTransform: "uppercase",
                  }}
                >
                  {activeArticle.category}
                </span>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {activeArticle.relative_time || new Date(activeArticle.published_at).toLocaleString()}
                </span>
              </div>

              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "16px", lineHeight: 1.3 }}>
                {activeArticle.title}
              </h2>

              <p style={{ fontSize: "1.02rem", color: "#334155", lineHeight: 1.7, marginBottom: "20px" }}>
                {activeArticle.content}
              </p>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  borderLeft: "4px solid #2563eb",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  <strong>Official Authority:</strong> {activeArticle.source}
                </div>
                {activeArticle.destination && (
                  <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "4px" }}>
                    <strong>Destination Region:</strong> {activeArticle.destination.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setActiveArticle(null)}
                  style={{
                    padding: "10px 24px",
                    background: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Close Advisory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
