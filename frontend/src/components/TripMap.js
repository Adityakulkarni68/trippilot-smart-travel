import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 100% Free Tile Providers — Zero Payment, No Credit Card, No API Key Required
const TILE_PROVIDERS = {
  osm: {
    id: "osm",
    label: "Standard OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  hot: {
    id: "hot",
    label: "Pastel Travel",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
  },
};

// Auto-adjust zoom & bounds to fit all markers
function ChangeView({ bounds, activeCoord }) {
  const map = useMap();

  useEffect(() => {
    if (activeCoord && activeCoord[0] && activeCoord[1]) {
      map.setView(activeCoord, Math.max(map.getZoom(), 13), { animate: true, duration: 0.8 });
    } else if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        // fallback
      }
    }
  }, [bounds, activeCoord, map]);

  return null;
}

// Custom Minimal Vector Pin Generator
function createCustomIcon(label, bg = "#2563eb", symbol = null, isActive = false) {
  const size = isActive ? 36 : 30;
  const shadow = isActive
    ? "0 0 0 5px rgba(37, 99, 235, 0.3), 0 8px 16px rgba(0,0,0,0.3)"
    : "0 3px 10px rgba(0,0,0,0.2)";

  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        background: ${bg};
        color: #ffffff;
        font-weight: 800;
        font-size: ${isActive ? "13px" : "11px"};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadow};
        border: 2px solid #ffffff;
        transition: all 0.25s ease;
      ">
        <span style="transform: rotate(45deg); display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.5px;">
          ${symbol || label}
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function TripMap({
  stops = [],
  meals = [],
  hotel = null,
  markers = [],
  height = "100%",
  activeStopId = null,
  onSelectStop = null,
  totalDistanceKm = null,
  totalTransitMins = null,
  trafficStatus = "low",
}) {
  const markerRefs = useRef({});
  const [activeTileId, setActiveTileId] = useState("osm");

  // ── Build Chronological Waypoints ──────────────────────────────────────────
  const points = [];
  const routeLine = [];

  // 1. Hotel (Starting Base)
  if (hotel && hotel.lat && hotel.lon) {
    const isAct = activeStopId === "hotel";
    const hotelPt = {
      id: "hotel",
      name: hotel.name,
      lat: hotel.lat,
      lon: hotel.lon,
      type: "hotel",
      badge: "BASE ACCOMMODATION",
      desc: hotel.description || "Accommodations base for this leg",
      icon: createCustomIcon("H", "#4f46e5", "H", isAct),
    };
    points.push(hotelPt);
    routeLine.push([hotel.lat, hotel.lon]);
  }

  // 2. Stops and integrated dining along the day route
  const lunchMeal = meals.find((m) => m.meal_type === "lunch" && m.lat && m.lon);
  const dinnerMeal = meals.find((m) => m.meal_type === "dinner" && m.lat && m.lon);

  const halfIndex = Math.max(1, Math.floor(stops.length / 2));

  stops.forEach((s, idx) => {
    // Insert lunch stop mid-way through the day
    if (idx === halfIndex && lunchMeal) {
      const isAct = activeStopId === "meal-lunch";
      const lunchPt = {
        id: "meal-lunch",
        name: lunchMeal.name,
        lat: lunchMeal.lat,
        lon: lunchMeal.lon,
        type: "meal",
        meal_type: "lunch",
        cuisine: lunchMeal.cuisine,
        rating: lunchMeal.rating,
        price_band: lunchMeal.price_band,
        badge: "CURATED LUNCH",
        desc: `${lunchMeal.cuisine} · Rated ${lunchMeal.rating}/5 (${lunchMeal.price_band})`,
        icon: createCustomIcon("L", "#ea580c", "L", isAct),
      };
      points.push(lunchPt);
      routeLine.push([lunchMeal.lat, lunchMeal.lon]);
    }

    if (s.lat && s.lon) {
      const isAct = activeStopId === `stop-${idx}`;
      const stopPt = {
        id: `stop-${idx}`,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        type: "stop",
        order: s.order || idx + 1,
        time: s.suggested_time ? `${s.suggested_time} - ${s.end_time || ""}` : `Stop ${idx + 1}`,
        badge: s.curator_badge || `Stop #${s.order || idx + 1}`,
        weather_tip: s.weather_tip,
        cost: s.cost_inr,
        desc: s.description,
        icon: createCustomIcon(String(s.order || idx + 1), "#2563eb", null, isAct),
      };
      points.push(stopPt);
      routeLine.push([s.lat, s.lon]);
    }
  });

  // Insert dinner near the end of the day
  if (dinnerMeal && dinnerMeal.lat && dinnerMeal.lon) {
    const isAct = activeStopId === "meal-dinner";
    const dinnerPt = {
      id: "meal-dinner",
      name: dinnerMeal.name,
      lat: dinnerMeal.lat,
      lon: dinnerMeal.lon,
      type: "meal",
      meal_type: "dinner",
      cuisine: dinnerMeal.cuisine,
      rating: dinnerMeal.rating,
      price_band: dinnerMeal.price_band,
      badge: "EVENING DINNER",
      desc: `${dinnerMeal.cuisine} · Rated ${dinnerMeal.rating}/5 (${dinnerMeal.price_band})`,
      icon: createCustomIcon("D", "#b45309", "D", isAct),
    };
    points.push(dinnerPt);
    routeLine.push([dinnerMeal.lat, dinnerMeal.lon]);
  }

  // Return to Hotel to close the loop
  if (hotel && hotel.lat && hotel.lon && routeLine.length > 1) {
    routeLine.push([hotel.lat, hotel.lon]);
  }

  // 3. Fallback support for markers prop (e.g. from ItineraryView)
  if (points.length === 0 && markers.length > 0) {
    markers.forEach((m, idx) => {
      if (m.lat && m.lon) {
        const isHotel = m.label && m.label.toLowerCase().includes("hotel");
        points.push({
          id: `marker-${idx}`,
          name: m.name || m.label || `Location ${idx + 1}`,
          lat: m.lat,
          lon: m.lon,
          type: isHotel ? "hotel" : "stop",
          badge: isHotel ? "HOTEL" : `Stop #${idx + 1}`,
          desc: m.description || "",
          icon: isHotel
            ? createCustomIcon("H", "#4f46e5", "H", false)
            : createCustomIcon(String(idx + 1), "#2563eb", null, false),
        });
        routeLine.push([m.lat, m.lon]);
      }
    });
  }

  // Active coordinate for auto-focus
  const activePoint = points.find((p) => p.id === activeStopId);
  const activeCoord = activePoint ? [activePoint.lat, activePoint.lon] : null;

  if (points.length === 0) {
    return (
      <div
        style={{
          height: "300px",
          background: "#f8fafc",
          borderRadius: "18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          border: "1.5px dashed #cbd5e1",
          gap: "8px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 700, color: "#1e293b" }}>Interactive Route Visualizer</div>
        <p style={{ fontSize: "0.85rem", margin: 0, maxWidth: "260px" }}>
          Loading location coordinates to plot your day-wise itinerary loop.
        </p>
      </div>
    );
  }

  const bounds = points.map((p) => [p.lat, p.lon]);
  const center = activeCoord || bounds[0];
  const currentTile = TILE_PROVIDERS[activeTileId] || TILE_PROVIDERS.osm;

  return (
    <div
      className="trip-map-container"
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1.5px solid #e2e8f0",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height,
      }}
    >
      {/* Sleek Top Header Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "12px 18px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "0.82rem",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a" }}>
          <span>Day Route Circuit</span>
          <span style={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>
            ({points.filter((p) => p.type === "stop").length} stops mapped)
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Style Selector Pills (Both 100% Free) */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "20px", padding: "2px" }}>
            {Object.values(TILE_PROVIDERS).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTileId(t.id)}
                style={{
                  border: "none",
                  background: activeTileId === t.id ? "#ffffff" : "transparent",
                  color: activeTileId === t.id ? "#2563eb" : "#64748b",
                  fontWeight: activeTileId === t.id ? 700 : 500,
                  fontSize: "0.74rem",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  cursor: "pointer",
                  boxShadow: activeTileId === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {totalDistanceKm && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.78rem", fontWeight: 600 }}>
              <span style={{ color: "#475569" }}>
                ~{totalDistanceKm} km
              </span>
              {totalTransitMins && (
                <span style={{ color: "#475569" }}>
                  · {totalTransitMins} mins transit
                </span>
              )}
              <span style={{ color: trafficStatus === "high" ? "#dc2626" : "#16a34a" }}>
                · {trafficStatus === "high" ? "Heavy traffic" : trafficStatus === "moderate" ? "Moderate flow" : "Light flow"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Map Body */}
      <div style={{ flex: 1, position: "relative", minHeight: "360px" }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%", minHeight: "360px" }}
          scrollWheelZoom={false}
        >
          {/* 100% Free OpenStreetMap Tiles — Zero API Key Required & Zero Watermarks */}
          <TileLayer
            key={currentTile.id}
            attribution={currentTile.attribution}
            url={currentTile.url}
            maxZoom={currentTile.maxZoom}
          />

          <ChangeView bounds={bounds} activeCoord={activeCoord} />

          {/* Chronological Route Polyline */}
          {routeLine.length > 1 && (
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: "#2563eb",
                weight: 4.5,
                opacity: 0.85,
                dashArray: "4, 8",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          )}

          {/* Location Pins */}
          {points.map((pt) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lon]}
              icon={pt.icon}
              ref={(ref) => {
                if (ref) markerRefs.current[pt.id] = ref;
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectStop) onSelectStop(pt.id);
                },
              }}
            >
              <Popup>
                <div style={{ padding: "4px 2px", maxWidth: "230px" }}>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: pt.type === "hotel" ? "#4f46e5" : pt.type === "meal" ? "#ea580c" : "#2563eb",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "3px",
                    }}
                  >
                    {pt.badge}
                  </div>
                  {pt.time && (
                    <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, marginBottom: "2px" }}>
                      {pt.time}
                    </div>
                  )}
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                    {pt.name}
                  </strong>
                  {pt.desc && (
                    <p style={{ fontSize: "0.8rem", color: "#475569", margin: "5px 0", lineHeight: 1.4 }}>
                      {pt.desc}
                    </p>
                  )}
                  {pt.weather_tip && (
                    <div style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: "6px", marginTop: "4px" }}>
                      {pt.weather_tip}
                    </div>
                  )}
                  {pt.cost !== undefined && pt.cost > 0 && (
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginTop: "4px" }}>
                      Activity Fee: ₹{pt.cost.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div
        style={{
          background: "#ffffff",
          padding: "8px 16px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.74rem",
          color: "#64748b",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
            Stops (#1..4)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ea580c", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c" }} />
            Dining
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4f46e5", fontWeight: 700 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4f46e5" }} />
            Hotel Base
          </span>
        </div>
        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
          OpenStreetMap
        </div>
      </div>
    </div>
  );
}
