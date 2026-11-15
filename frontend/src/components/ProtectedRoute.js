import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-container">
        <p className="loading-text">Loading…</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
