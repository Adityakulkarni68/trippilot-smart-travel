import React, { useState, useEffect, useCallback } from "react";
import RatingBubbles from "./RatingBubbles";
import { listReviews, createReview, voteHelpful } from "../services/api";

export default function ReviewsSection({ itemName, itemType, destination }) {
  const [data, setData] = useState({
    total_reviews: 0,
    average_rating: 5.0,
    distribution: {},
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    content: "",
    trip_type: "Couples",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const res = await listReviews({
        item_name: itemName,
        item_type: itemType,
        destination,
      });
      setData(res.data);
    } catch (e) {
      console.warn("Could not load reviews:", e);
    } finally {
      setLoading(false);
    }
  }, [itemName, itemType, destination]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await createReview({
        item_name: itemName,
        item_type: itemType,
        destination,
        rating: form.rating,
        title: form.title,
        content: form.content,
        trip_type: form.trip_type,
      });
      setMessage("Your TripAdvisor review has been posted!");
      setMessage("Your review has been posted!");
      setForm({ rating: 5, title: "", content: "", trip_type: "Couples" });
      setShowForm(false);
      loadReviews();
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (id) => {
    try {
      const res = await voteHelpful(id);
      setData((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === id ? { ...r, helpful_count: res.data.helpful_count } : r
        ),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="reviews-container" style={{ marginTop: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "14px",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a202c" }}>
            Community Reviews
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <RatingBubbles rating={data.average_rating} size="lg" />
            <span style={{ color: "#4a5568", fontSize: "0.95rem" }}>
              Based on {data.total_reviews} reviews
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            border: "none",
            borderRadius: "50px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            color: "#fff",
            padding: "8px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => setShowForm(!showForm)}
        >
          Write a Review
        </button>
      </div>

      {message && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
          {message}
        </div>
      )}

      {/* Write a review form */}
      {showForm && (
        <div
          style={{
            background: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>
            Share your experience for {itemName}
          </h4>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                YOUR RATING (CLICK BUBBLES)
              </label>
              <RatingBubbles
                rating={form.rating}
                interactive={true}
                size="lg"
                onChange={(val) => setForm({ ...form, rating: val })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  TRIP TYPE
                </label>
                <select
                  value={form.trip_type}
                  onChange={(e) => setForm({ ...form, trip_type: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Solo">Solo Traveler</option>
                  <option value="Couples">Couples / Romance</option>
                  <option value="Family">Family Vacation</option>
                  <option value="Friends">Friends Getaway</option>
                  <option value="Business">Business Travel</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                  REVIEW TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your visit in a few words"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                DETAILED REVIEW
              </label>
              <textarea
                required
                rows={4}
                placeholder="What made your experience memorable? Tips for other travelers on timing, location, or food..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
                style={{ borderRadius: "50px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  border: "none",
                  borderRadius: "50px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                  color: "#fff",
                  cursor: "pointer",
                }}
                disabled={submitting}
              >
                {submitting ? "Publishing…" : "Publish Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {data.reviews.map((rev) => (
          <div
            key={rev.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 22px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={
                    rev.user_avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user_name)}&background=00aa6c&color=fff`
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user_name)}&background=2563eb&color=fff`
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user_name || "Traveler")}&background=2563eb&color=fff`
                  }
                  alt={rev.user_name}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a202c" }}>
                    {rev.user_name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#718096" }}>
                    Traveler {rev.trip_type && `· ${rev.trip_type}`}
                  </div>
                </div>
              </div>

              <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>
                {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}
              </span>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <RatingBubbles rating={rev.rating} size="sm" />
            </div>

            <h5 style={{ fontSize: "1.02rem", fontWeight: 700, color: "#2d3748", marginBottom: "6px" }}>
              "{rev.title}"
            </h5>

            <p style={{ fontSize: "0.9rem", color: "#4a5568", lineHeight: "1.6", marginBottom: "12px" }}>
              {rev.content}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                onClick={() => handleHelpful(rev.id)}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "50px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  color: "#475569",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                Helpful ({rev.helpful_count || 0})
              </button>
            </div>
          </div>
        ))}

        {!loading && data.reviews.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", color: "#718096" }}>
            No traveler reviews yet for this spot. Be the first to share your experience!
          </div>
        )}
      </div>
    </div>
  );
}
