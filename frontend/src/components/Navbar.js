import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBookmarks } from "../context/BookmarkContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate("/");
  };

  const linkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "0.92rem",
    color: isActive ? "#2563eb" : "#475569",
    padding: "8px 14px",
    borderRadius: "50px",
    background: isActive ? "#eff6ff" : "transparent",
    textDecoration: "none",
    transition: "all 0.2s ease",
  });

  return (
    <header
      style={{
        position: "sticky",
        top: "14px",
        zIndex: 500,
        padding: "0 16px",
      }}
    >
      <nav
        className="navbar"
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          borderRadius: "9999px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow: "0 6px 30px rgba(15, 23, 42, 0.07)",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.2rem",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>T</span>
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-serif, 'Playfair Display', serif)",
                fontSize: "1.45rem",
                fontWeight: 800,
                letterSpacing: "-0.3px",
                color: "#0f172a",
                display: "block",
                lineHeight: 1.1,
              }}
            >
              TripPilot
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                marginTop: "1px",
              }}
            >
              Smart Travel Guide
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div
          className="navbar-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <NavLink to="/explore" style={linkStyle}>
            <span>Explore</span>
          </NavLink>

          <NavLink to="/plan" style={linkStyle}>
            <span>Plan Trip</span>
          </NavLink>

          <NavLink to="/trips" style={linkStyle}>
            <span>My Trips</span>
          </NavLink>

          <NavLink to="/news" style={linkStyle}>
            <span>News & Alerts</span>
          </NavLink>

          <NavLink to="/saved" style={linkStyle}>
            <span>Wishlist</span>
            {bookmarks && bookmarks.length > 0 && (
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "50px",
                  fontSize: "0.72rem",
                  padding: "1px 7px",
                  fontWeight: 800,
                }}
              >
                {bookmarks.length}
              </span>
            )}
          </NavLink>
        </div>

        {/* Right side authentication & account */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "50px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    border: "1.5px solid #bfdbfe",
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" }}>
                  {user.name || "Account"}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>▼</span>
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: 0,
                    background: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    border: "1px solid #e2e8f0",
                    padding: "8px 0",
                    minWidth: "160px",
                    zIndex: 100,
                  }}
                >
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      padding: "8px 16px",
                      color: "#334155",
                      textDecoration: "none",
                      fontSize: "0.88rem",
                      fontWeight: 500,
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/saved"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      padding: "8px 16px",
                      color: "#334155",
                      textDecoration: "none",
                      fontSize: "0.88rem",
                      fontWeight: 500,
                    }}
                  >
                    Saved Places
                  </Link>
                  <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid #f1f5f9" }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "8px 16px",
                      color: "#dc2626",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                to="/login"
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#475569",
                  textDecoration: "none",
                  padding: "6px 12px",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "8px 18px",
                  borderRadius: "50px",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
