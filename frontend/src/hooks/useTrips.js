import { useState, useEffect, useCallback } from "react";
import { listTrips, deleteTrip } from "../services/api";

export function useTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTrips();
      setTrips(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const removeTrip = async (id) => {
    await deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  return { trips, loading, error, refetch: fetchTrips, removeTrip };
}
