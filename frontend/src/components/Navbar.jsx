import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({
  isConnected,
  status,
  onOpenAuth,
  activeView,
  onNavigate,
}) {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function scrollToSection(id) {
    if (activeView !== "planner" && onNavigate) {
      onNavigate("planner");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Traveler";

  return (
    <nav style={styles.nav} aria-label="Main Navigation">
      <div style={styles.container}>
        {/* Brand */}
        <div
          style={styles.brand}
          onClick={() => {
            if (onNavigate) onNavigate("planner");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span style={styles.brandIcon} aria-hidden="true">
            🧭
          </span>
          <div style={styles.brandTextGroup}>
            <span style={styles.brandName}>VoyagePlan</span>
            <span style={styles.brandSubtitle}>AI Travel Planner</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div style={styles.desktopLinks}>
          <button
            type="button"
            onClick={() => scrollToSection("plan-trip")}
            style={{
              ...styles.navLink,
              ...(activeView === "planner" ? styles.navLinkActive : {}),
            }}
          >
            Plan a Trip
          </button>

          {/* My Trips Navigation for authenticated users */}
          {user && (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("mytrips")}
              style={{
                ...styles.navLink,
                ...(activeView === "mytrips" ? styles.navLinkActive : {}),
              }}
            >
              📁 My Trips
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollToSection("features")}
            style={styles.navLink}
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            style={styles.navLink}
          >
            How It Works
          </button>
        </div>

        {/* Right side: Auth + Status indicator + mobile button */}
        <div style={styles.rightGroup}>
          {/* User Auth Controls */}
          {user ? (
            <div style={styles.userProfileGroup}>
              <span style={styles.userAvatar} title={user.email}>
                👤
              </span>
              <span style={styles.userName} title={user.email}>
                {userDisplayName}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                style={styles.signOutBtn}
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              style={styles.signInBtn}
            >
              Sign In
            </button>
          )}

          {/* Backend Status indicator */}
          <div
            style={{
              ...styles.statusPill,
              background: isConnected
                ? "rgba(220, 252, 231, 0.7)"
                : "rgba(254, 243, 199, 0.7)",
              borderColor: isConnected ? "#86efac" : "#fde68a",
              color: isConnected ? "#15803d" : "#b45309",
            }}
            title={status}
            role="status"
          >
            <span
              style={{
                ...styles.statusDot,
                background: isConnected ? "#16a34a" : "#d97706",
              }}
            />
            <span style={styles.statusText}>
              {isConnected ? "FastAPI Online" : "Connecting..."}
            </span>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            style={styles.mobileToggle}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span style={styles.hamburgerBar} />
            <span style={styles.hamburgerBar} />
            <span style={styles.hamburgerBar} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          style={styles.mobileMenu}
          role="dialog"
          aria-label="Mobile Navigation"
        >
          {/* Mobile Auth button */}
          {user ? (
            <div style={styles.mobileUserBox}>
              <div style={styles.mobileUserInfo}>
                <span style={styles.userAvatar}>👤</span>
                <span style={styles.userName}>{userDisplayName}</span>
                <span style={styles.userEmail}>({user.email})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                style={styles.signOutBtn}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              style={styles.mobileSignInBtn}
            >
              🔑 Sign In / Sign Up
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollToSection("plan-trip")}
            style={styles.mobileNavLink}
          >
            🗺️ Plan a Trip
          </button>

          {user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigate) onNavigate("mytrips");
              }}
              style={styles.mobileNavLink}
            >
              📁 My Trips
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollToSection("features")}
            style={styles.mobileNavLink}
          >
            ✨ Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("how-it-works")}
            style={styles.mobileNavLink}
          >
            ⚙️ How It Works
          </button>
          <div style={styles.mobileStatusWrapper}>
            <span style={styles.mobileStatusLabel}>API Connection:</span>
            <span
              style={{
                fontWeight: 600,
                color: isConnected ? "#16a34a" : "#d97706",
              }}
            >
              {status}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    userSelect: "none",
  },
  brandIcon: {
    fontSize: "24px",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 4px rgba(2, 132, 199, 0.2))",
  },
  brandTextGroup: {
    display: "flex",
    flexDirection: "column",
  },
  brandName: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.4px",
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  desktopLinks: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navLink: {
    background: "none",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
  },
  navLinkActive: {
    color: "#0284c7",
    background: "rgba(2, 132, 199, 0.08)",
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userProfileGroup: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px 4px 6px",
    borderRadius: "100px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
  },
  userAvatar: {
    fontSize: "14px",
  },
  userName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1e293b",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: "12px",
    color: "#64748b",
  },
  signInBtn: {
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    padding: "7px 16px",
    borderRadius: "100px",
    fontSize: "13.5px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
    transition: "opacity 0.15s ease",
  },
  signOutBtn: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 12px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  statusText: {
    lineHeight: 1,
  },
  mobileToggle: {
    display: "none",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "36px",
    height: "36px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
  },
  hamburgerBar: {
    width: "100%",
    height: "2px",
    background: "#334155",
    borderRadius: "2px",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    padding: "16px 24px 20px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
    gap: "6px",
  },
  mobileUserBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    marginBottom: "8px",
  },
  mobileUserInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  mobileSignInBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    marginBottom: "8px",
  },
  mobileNavLink: {
    background: "none",
    border: "none",
    padding: "10px 0",
    textAlign: "left",
    fontSize: "15px",
    fontWeight: 600,
    color: "#1e293b",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  },
  mobileStatusWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    paddingTop: "14px",
    fontSize: "12px",
    color: "#64748b",
  },
  mobileStatusLabel: {
    fontWeight: 500,
  },
};
