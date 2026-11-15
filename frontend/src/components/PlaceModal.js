import React from "react";
import RatingBubbles from "./RatingBubbles";
import ReviewsSection from "./ReviewsSection";
import { useBookmarks } from "../context/BookmarkContext";

export default function PlaceModal({ item, type, onClose }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (!item) return null;

  const saved = isBookmarked(item.name);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          &times;
        </button>

        {/* Hero image */}
        {item.image_url && (
          <div style={{ position: "relative", height: "300px", width: "100%" }}>
            <img
              src={item.image_url}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "24px",
                right: "24px",
                color: "#fff",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#fff",
                  padding: "4px 14px",
                  borderRadius: "50px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {type?.toUpperCase()} · {item.destination?.toUpperCase()}
              </span>
              <h2 className="serif-heading" style={{ fontSize: "1.9rem", marginTop: "8px" }}>
                {item.name}
              </h2>
            </div>
          </div>
        )}

        <div style={{ padding: "24px 30px" }}>
          {/* Header metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <RatingBubbles rating={item.rating || 4.8} count={item.review_count || 340} size="md" />
              {item.zone && (
                <div style={{ fontSize: "0.88rem", color: "#64748b", marginTop: "4px" }}>
                  {item.zone} area
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => toggleBookmark(type, item)}
                style={{
                  background: saved ? "#eff6ff" : "#f1f5f9",
                  border: saved ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                  borderRadius: "50px",
                  padding: "8px 16px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: saved ? "#1d4ed8" : "#475569",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {saved ? "Saved" : "Save Place"}
              </button>

              {item.price_per_night && (
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb" }}>
                  ₹{item.price_per_night.toLocaleString()}/night
                </span>
              )}
              {item.entry_fee_inr !== undefined && (
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>
                  {item.entry_fee_inr === 0 ? "Free Entry" : `₹${item.entry_fee_inr} entry`}
                </span>
              )}
              {item.price_band && (
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>
                  {item.price_band}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: "1.7", marginBottom: "16px" }}>
              {item.description}
            </p>
          )}

          {/* Key highlights / amenities */}
          {item.amenities && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                Property Amenities
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {item.amenities.map((amenity, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      padding: "5px 12px",
                      borderRadius: "50px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.signature_dish && (
            <div style={{ background: "#fffbeb", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
              <strong>Signature Dish:</strong> {item.signature_dish}
            </div>
          )}

          {item.best_time_to_visit && (
            <div style={{ background: "#f0f9ff", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
              <strong>Best Time to Visit:</strong> {item.best_time_to_visit}
            </div>
          )}

          {/* Reviews component */}
          <ReviewsSection
            itemName={item.name}
            itemType={type}
            destination={item.destination}
          />
        </div>
      </div>
    </div>
  );
}
