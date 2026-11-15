import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import RatingBubbles from "../components/RatingBubbles";
import PlaceModal from "../components/PlaceModal";
import { useBookmarks } from "../context/BookmarkContext";
import {
  listHotels,
  listAttractions,
  listRestaurants,
  listDestinations,
} from "../services/api";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "hotels";
  const initialDest = searchParams.get("destination") || "";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedDest, setSelectedDest] = useState(initialDest);
  const [selectedTier, setSelectedTier] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [minRating, setMinRating] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState(null);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    setLoading(true);
    const dest = selectedDest || undefined;

    if (activeTab === "hotels") {
      listHotels({
        destination: dest,
        tier: selectedTier || undefined,
        min_rating: minRating ? parseFloat(minRating) : undefined,
      })
        .then((res) => setItems(res.data || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "attractions") {
      listAttractions({
        destination: dest,
        min_rating: minRating ? parseFloat(minRating) : undefined,
      })
        .then((res) => setItems(res.data || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "restaurants") {
      listRestaurants({
        destination: dest,
        price_band: selectedTier || undefined,
      })
        .then((res) => setItems(res.data || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "destinations") {
      listDestinations()
        .then((res) => setItems(res.data || []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab, selectedDest, selectedTier, minRating]);

  const filteredItems = items.filter((it) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      (it.cuisine && it.cuisine.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div style={{ marginBottom: "28px" }}>
        <h1 className="serif-heading" style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
          TripPilot Explore Hub
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.05rem", marginTop: "4px" }}>
          Browse hotels, must-see attractions, and curated dining with community reviews.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {[
          { id: "hotels", label: "Hotels & Stays" },
          { id: "attractions", label: "Attractions & Sights" },
          { id: "restaurants", label: "Restaurants & Dining" },
          { id: "destinations", label: "Destination Guides" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchParams({ tab: tab.id, destination: selectedDest });
            }}
            style={{
              padding: "12px 22px",
              fontWeight: 700,
              fontSize: "0.95rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid #2563eb" : "3px solid transparent",
              color: activeTab === tab.id ? "#2563eb" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "28px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        {/* Destination filter */}
        <div style={{ minWidth: "160px" }}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Destination
          </label>
          <select
            value={selectedDest}
            onChange={(e) => {
              setSelectedDest(e.target.value);
              setSearchParams({ tab: activeTab, destination: e.target.value });
            }}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          >
            <option value="">All Destinations</option>
            <option value="Goa">Goa</option>
            <option value="Jaipur">Jaipur</option>
            <option value="Kerala">Kerala</option>
            <option value="Manali">Manali</option>
          </select>
        </div>

        {/* Tier / Price filter */}
        {activeTab === "hotels" && (
          <div style={{ minWidth: "140px" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
              Hotel Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="">All Tiers</option>
              <option value="luxury">Luxury</option>
              <option value="mid-range">Mid-Range</option>
              <option value="budget">Budget</option>
            </select>
          </div>
        )}

        {/* Rating filter */}
        <div style={{ minWidth: "130px" }}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Min Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Excellent</option>
            <option value="4.0">4.0+ Very Good</option>
          </select>
        </div>

        {/* Search keyword filter */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Keyword
          </label>
          <input
            type="text"
            placeholder="Filter by name, cuisine, features..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <p className="loading-text">Loading listings…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
          {filteredItems.map((item) => {
            const saved = isBookmarked(item.name);
            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  transition: "transform 0.2s",
                }}
              >
                {/* Heart bookmark button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(activeTab, item);
                  }}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(4px)",
                    border: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    zIndex: 10,
                  }}
                  title={saved ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "#dc2626" : "none"} stroke={saved ? "#dc2626" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>

                {/* Card thumbnail image */}
                <div style={{ position: "relative", height: "200px" }}>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "50px",
                    }}
                  >
                    {item.destination?.toUpperCase()} {item.zone && `· ${item.zone}`}
                  </span>
                </div>

                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0, lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                  </div>

                  <div style={{ marginBottom: "8px" }}>
                    <RatingBubbles rating={item.rating || 4.8} count={item.review_count || 320} size="sm" />
                  </div>

                  {item.description && (
                    <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5, margin: "4px 0 14px", flex: 1 }}>
                      {item.description}
                    </p>
                  )}

                  {/* Pricing and Action */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      {item.price_per_night && (
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#2563eb" }}>
                          ₹{item.price_per_night.toLocaleString()}
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}> / night</span>
                        </div>
                      )}
                      {item.entry_fee_inr !== undefined && (
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#2563eb" }}>
                          {item.entry_fee_inr === 0 ? "Free Entry" : `₹${item.entry_fee_inr} entry`}
                        </div>
                      )}
                      {item.price_band && (
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#2563eb" }}>
                          {item.price_band} · {item.meal_type}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveModalItem({ item, type: activeTab })}
                      style={{
                        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                        border: "none",
                        borderRadius: "50px",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                        color: "#fff",
                        padding: "8px 16px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      View Details & Reviews
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Place detail & reviews modal */}
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
