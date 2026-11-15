import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach Firebase Bearer Token automatically to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("trippilot_token") || localStorage.getItem("navigen_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic fallback between localhost and 127.0.0.1 if browser hits IPv6/IPv4 resolution mismatch
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    if (config && error?.message === "Network Error" && !config._retriedHost) {
      config._retriedHost = true;
      if (config.baseURL && config.baseURL.includes("localhost:8000")) {
        config.baseURL = config.baseURL.replace("localhost:8000", "127.0.0.1:8000");
        return api(config);
      } else if (config.baseURL && config.baseURL.includes("127.0.0.1:8000")) {
        config.baseURL = config.baseURL.replace("127.0.0.1:8000", "localhost:8000");
        return api(config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth & Profile ─────────────────────────────────────────────────────────────
export const syncUser         = (data)               => api.post("/api/auth/sync", data);
export const getMe            = ()                   => api.get("/api/auth/me");
export const updateProfile    = (data)               => api.put("/api/auth/profile", data);

// ── TripAdvisor Explore Hub ───────────────────────────────────────────────────
export const listDestinations = ()                   => api.get("/api/explore/destinations");
export const listHotels       = (params)             => api.get("/api/explore/hotels", { params });
export const listAttractions  = (params)             => api.get("/api/explore/attractions", { params });
export const listRestaurants  = (params)             => api.get("/api/explore/restaurants", { params });

// ── Community Reviews & Bubble Ratings ─────────────────────────────────────────
export const listReviews      = (params)             => api.get("/api/reviews", { params });
export const createReview     = (data)               => api.post("/api/reviews", data);
export const voteHelpful      = (reviewId)           => api.post(`/api/reviews/${reviewId}/helpful`);

// ── TripAdvisor Saves / Wishlist ───────────────────────────────────────────────
export const listBookmarks    = ()                   => api.get("/api/bookmarks");
export const addBookmark      = (data)               => api.post("/api/bookmarks", data);
export const deleteBookmark   = (id)                 => api.delete(`/api/bookmarks/${id}`);

// ── Travel News & Safety Advisories ───────────────────────────────────────────
export const listNews         = (params)             => api.get("/api/news", { params });
export const getUrgentAlerts  = ()                   => api.get("/api/news/alerts");
export const refreshNews      = ()                   => api.post("/api/news/refresh");

// ── Live Weather & Traffic Telemetry ──────────────────────────────────────────
export const getLiveWeather   = (destination, params) => api.get(`/api/weather/${encodeURIComponent(destination)}`, { params });
export const getLiveTraffic   = (destination, params) => api.get(`/api/traffic/${encodeURIComponent(destination)}`, { params });

// ── Two-Phase Itinerary Planner ───────────────────────────────────────────────
// Phase 1: Booking time rough itinerary
export const createRoughPlan  = (data)               => api.post("/api/plan/rough", data);

// Phase 2: Night-before dynamic plan with Weather + Traffic + Food Agents + ML
export const createDailyPlan  = (data)               => api.post("/api/plan/daily", data);
export const getDailyPlan     = (tripId, day, refresh = false) =>
  api.get(`/api/plan/trips/${tripId}/daily/${day}`, { params: refresh ? { refresh: true } : {} });

// ── Trips Storage ─────────────────────────────────────────────────────────────
export const listTrips        = ()                   => api.get("/api/plan/trips");
export const getTrip          = (id)                 => api.get(`/api/plan/trips/${id}`);
export const deleteTrip       = (id)                 => api.delete(`/api/plan/trips/${id}`);
