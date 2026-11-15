import React, { useState } from "react";
import TripMap from "./TripMap";

const MEAL_BADGE = { breakfast: "B", lunch: "L", dinner: "D" };
const STOP_BADGE = "•";
const HOTEL_BADGE = "H";

export default function ItineraryView({ days }) {
  const [activeDay, setActiveDay] = useState(1);

  const currentDay = days.find((d) => d.day === activeDay);

  // Collect all stops with coordinates for the map
  const mapMarkers = days.flatMap((day) => {
    const points = [];
    if (day.hotel?.lat && day.hotel?.lon) {
      points.push({ ...day.hotel, label: `Day ${day.day} Hotel` });
    }
    day.stops.forEach((s) => {
      if (s.lat && s.lon) points.push({ ...s, label: s.name });
    });
    return points;
  });

  return (
    <div className="itinerary-container">
      {/* Day tabs */}
      <div className="day-tabs" role="tablist" aria-label="Itinerary days">
        {days.map((day) => (
          <button
            key={day.day}
            role="tab"
            aria-selected={day.day === activeDay}
            className={`day-tab ${day.day === activeDay ? "day-tab-active" : ""}`}
            onClick={() => setActiveDay(day.day)}
          >
            Day {day.day}
          </button>
        ))}
      </div>

      {currentDay && (
        <div className="day-content" role="tabpanel">
          <div className="day-columns">
            {/* Left: schedule */}
            <div className="day-schedule">
              {/* Hotel */}
              {currentDay.hotel && (
                <div className="schedule-item hotel-item">
                  <span className="schedule-icon">{HOTEL_BADGE}</span>
                  <div className="schedule-info">
                    <strong>{currentDay.hotel.name}</strong>
                    <span className="schedule-type">Hotel · ₹{currentDay.hotel.cost_inr?.toLocaleString("en-IN") ?? "—"}</span>
                    {currentDay.hotel.description && (
                      <p className="schedule-desc">{currentDay.hotel.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Breakfast */}
              {currentDay.meals
                .filter((m) => m.meal_type === "breakfast")
                .map((meal, i) => (
                  <MealItem key={i} meal={meal} />
                ))}

              {/* Stops (morning / afternoon) */}
              {currentDay.stops.map((stop, i) => (
                <div key={i} className="schedule-item">
                  <span className="schedule-icon">{STOP_BADGE}</span>
                  <div className="schedule-info">
                    <strong>{stop.name}</strong>
                    <span className="schedule-type">
                      Attraction · ₹{stop.cost_inr?.toLocaleString("en-IN") ?? "—"}
                      {stop.duration_hours && ` · ~${stop.duration_hours}h`}
                    </span>
                    {stop.description && <p className="schedule-desc">{stop.description}</p>}
                  </div>
                </div>
              ))}

              {/* Lunch & Dinner */}
              {currentDay.meals
                .filter((m) => m.meal_type !== "breakfast")
                .map((meal, i) => (
                  <MealItem key={i} meal={meal} />
                ))}

              {/* Daily total */}
              <div className="day-total">
                <span>Transit: ₹{currentDay.transport_cost_inr.toLocaleString("en-IN")}</span>
                <span className="day-total-value">
                  Day Total: ₹{currentDay.daily_total_inr.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Right: map */}
            {mapMarkers.length > 0 && (
              <div className="day-map">
                <TripMap markers={mapMarkers} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MealItem({ meal }) {
  return (
    <div className="schedule-item meal-item">
      <span className="schedule-icon">{MEAL_BADGE[meal.meal_type] ?? "M"}</span>
      <div className="schedule-info">
        <strong>{meal.name}</strong>
        <span className="schedule-type">
          {meal.meal_type?.charAt(0).toUpperCase() + meal.meal_type?.slice(1)} ·{" "}
          ₹{meal.cost_inr?.toLocaleString("en-IN") ?? "—"}
        </span>
        {meal.description && <p className="schedule-desc">{meal.description}</p>}
      </div>
    </div>
  );
}
