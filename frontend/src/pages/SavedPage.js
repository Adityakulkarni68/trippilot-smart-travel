import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useBookmarks } from "../context/BookmarkContext";
import RatingBubbles from "../components/RatingBubbles";
import PlaceModal from "../components/PlaceModal";

export default function SavedPage() {
  const { bookmarks, loading, toggleBookmark } = useBookmarks();
  const [activeModalItem, setActiveModalItem] = useState(null);

  return (
    <div className="page-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "30px 24px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ color: "#2563eb", fontWeight: 800, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            TRIPPILOT WISHLIST &amp; SAVES
          </span>
          <h1 className="serif-heading" style={{ fontSize: "2.4rem", color: "#0f172a", marginTop: "4px" }}>
            My Saved Places ({bookmarks.length})
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", marginTop: "4px" }}>
            Hotels, attractions, and restaurants you bookmarked for upcoming journeys.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <Link
            to="/plan"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              border: "none",
              borderRadius: "50px",
              padding: "12px 26px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Plan Itinerary from Saved Places
          </Link>
        )}
      </div>

      {loading && <p className="loading-text">Loading your saved spots…</p>}

      {!loading && bookmarks.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#ffffff", borderRadius: "24px", border: "2px dashed #cbd5e1" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#eff6ff", color: "#2563eb", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 className="serif-heading" style={{ fontSize: "1.5rem", color: "#0f172a", marginBottom: "8px" }}>
            No saved places yet
          </h3>
          <p style={{ color: "#64748b", maxWidth: "440px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            Browse curated stays, attractions, and dining in the Explore section to save them to your trip wishlist.
          </p>
          <Link
            to="/explore"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              border: "none",
              borderRadius: "50px",
              padding: "12px 26px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Explore TripPilot Catalog
          </Link>
        </div>
      )}

      {/* Grid of saves */}
      {!loading && bookmarks.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {bookmarks.map((bm) => {
            const details = bm.details || {};
            return (
              <div
                key={bm.id}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div style={{ position: "relative", height: "190px" }}>
                  <img
                    src={
                      details.image_url ||
                      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80"
                    }
                    alt={bm.item_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "14px",
                      background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                      color: "#fff",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: "50px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {bm.item_type}
                  </span>

                  <button
                    onClick={() => toggleBookmark(bm.item_type, { name: bm.item_name, destination: bm.destination })}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    title="Remove from wishlist"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 className="serif-heading" style={{ fontSize: "1.25rem", color: "#0f172a", margin: "0 0 6px" }}>
                    {bm.item_name}
                  </h3>

                  {details.destination && (
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>
                      {details.destination.toUpperCase()} {details.zone && `· ${details.zone}`}
                    </div>
                  )}

                  <div style={{ marginBottom: "10px" }}>
                    <RatingBubbles rating={details.rating || 4.8} size="sm" />
                  </div>

                  {details.description && (
                    <p style={{ fontSize: "0.86rem", color: "#64748b", lineHeight: 1.5, margin: "0 0 16px", flex: 1 }}>
                      {details.description}
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    {details.price_per_night && (
                      <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "1.05rem" }}>
                        ₹{details.price_per_night.toLocaleString()}/nt
                      </span>
                    )}
                    {details.entry_fee_inr !== undefined && (
                      <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "1.05rem" }}>
                        {details.entry_fee_inr === 0 ? "Free Entry" : `₹${details.entry_fee_inr}`}
                      </span>
                    )}
                    {details.price_band && (
                      <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "1.05rem" }}>
                        {details.price_band}
                      </span>
                    )}

                    <button
                      onClick={() => setActiveModalItem({ item: { ...details, name: bm.item_name, destination: bm.destination }, type: bm.item_type })}
                      style={{
                        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                        border: "none",
                        borderRadius: "50px",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        color: "#fff",
                        padding: "8px 16px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reviews & Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeModalItem && (
        <PlaceModal
          item={activeModalItem.item}
          type={activeModalItem.type}
          onClose={() => setActiveModalItem(null)}
        />
      )}
    </div>
  );
}
