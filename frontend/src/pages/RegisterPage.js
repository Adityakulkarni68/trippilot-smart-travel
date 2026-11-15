import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUpWithEmail(form.email, form.password, form.username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInAsGuest();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Guest sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ padding: "40px 16px" }}>
      <div className="auth-card" style={{ maxWidth: "440px", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "1.3rem", margin: "0 auto 8px" }}>T</div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
            Create Free Account
          </h2>
          <p style={{ fontSize: "0.88rem", color: "#64748b" }}>
            Join discerning travelers planning seamless journeys across India
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px",
              borderRadius: "12px",
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              fontWeight: 700,
              fontSize: "0.92rem",
              color: "#1e293b",
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign up with Google
          </button>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            style={{
              padding: "10px",
              borderRadius: "12px",
              border: "1.5px dashed #2563eb",
              background: "#eff6ff",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#1d4ed8",
              cursor: "pointer",
            }}
          >
            Continue as Guest Demo Traveler
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0", color: "#94a3b8" }}>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>OR WITH EMAIL</span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Full Name / Nickname</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="Aarav Sharma"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="aarav@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              border: "none",
              borderRadius: "50px",
              fontWeight: 800,
              marginTop: "8px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              cursor: "pointer",
            }}
          >
            {loading ? "Creating account…" : "Create Traveler Account"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
