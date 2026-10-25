import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserTrips } from "../services/api";

export default function MyTrips({ onSelectTrip, onBackToPlanner, onOpenAuth }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setIsSessionExpired(true);
      return;
    }

    setLoading(true);
    setError("");
    setIsSessionExpired(false);

    fetchUserTrips()
      .then((data) => {
        setTrips(data || []);
        setLoading(false);
      })
      .catch((err) => {
        const errorMsg = err.message || "Failed to load your trips.";
        setError(errorMsg);
        if (
          errorMsg.toLowerCase().includes("session has expired") ||
          errorMsg.toLowerCase().includes("sign in again") ||
          errorMsg.toLowerCase().includes("authentication required") ||
          errorMsg.toLowerCase().includes("invalid or expired")
        ) {
          setIsSessionExpired(true);
        }
        setLoading(false);
      });
  }, [user]);

  const formatDate = (val) => {
    if (!val) return "";
    const parsed = new Date(`${String(val).slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? String(val)
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <section style={styles.section} aria-labelledby="mytrips-heading">
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.tag}>
              <span>📁 My Travel Journal</span>
            </div>
            <h2 id="mytrips-heading" style={styles.title}>
              Saved Itineraries
            </h2>
            <p style={styles.subtitle}>
              Review, reopen, or print your previously generated travel plans.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToPlanner}
            style={styles.backBtn}
          >
            ← Back to Trip Planner
          </button>
        </div>

        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading your itineraries...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}>⚠️</span>
            <div style={styles.errorContent}>
              <p style={styles.errorText}>
                {isSessionExpired
                  ? "Your session has expired. Please sign in again to view your saved trips."
                  : error}
              </p>
              {isSessionExpired && onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  style={styles.reSignInBtn}
                >
                  Sign In Again
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && trips.length === 0 && (
          <div style={styles.emptyCard}>
            <span style={styles.emptyIcon}>🏖️</span>
            <h3 style={styles.emptyTitle}>No saved trips yet</h3>
            <p style={styles.emptyDesc}>
              Generate a custom itinerary with VoyagePlan and save it to review anytime.
            </p>
            <button
              type="button"
              onClick={onBackToPlanner}
              style={styles.primaryBtn}
            >
              Plan Your First Trip
            </button>
          </div>
        )}

        {!loading && trips.length > 0 && (
          <div style={styles.grid}>
            {trips.map((trip) => {
              const daysCount =
                trip.content?.days?.length ||
                trip.itinerary?.days?.length ||
                trip.days ||
                trip.day_count ||
                0;
              const daysLabel = daysCount > 0 ? `${daysCount} ${daysCount === 1 ? "day" : "days"}` : "Custom trip";

              return (
                <div key={trip.id} style={styles.tripCard}>
                  <div style={styles.tripCardHeader}>
                    <span style={styles.tripIcon}>📍</span>
                    <h3 style={styles.tripTitle}>{trip.title}</h3>
                  </div>

                  <p style={styles.tripDestination}>
                    Destination: <strong>{trip.destination}</strong>
                  </p>

                  <div style={styles.pillRow}>
                    <span style={styles.metaPill}>⏱️ {daysLabel}</span>
                    {trip.preferences?.budget && (
                      <span style={styles.metaPill}>
                        💰 {trip.preferences.budget}
                      </span>
                    )}
                    {trip.preferences?.pace && (
                      <span style={styles.metaPill}>
                        🚶 {trip.preferences.pace}
                      </span>
                    )}
                  </div>

                  {trip.start_date && (
                    <p style={styles.dateRange}>
                      🗓️ {formatDate(trip.start_date)}
                      {trip.end_date ? ` - ${formatDate(trip.end_date)}` : ""}
                    </p>
                  )}

                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => onSelectTrip(trip)}
                      style={styles.viewBtn}
                    >
                      View Itinerary →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "48px 24px 80px",
    background: "#fcfbf9",
    minHeight: "70vh",
  },
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "36px",
  },
  tag: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "100px",
    background: "rgba(2, 132, 199, 0.1)",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  title: {
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14.5px",
    color: "#64748b",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1.5px solid #cbd5e1",
    color: "#334155",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 0",
    gap: "14px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: "14px",
    color: "#64748b",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px 20px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#991b1b",
    marginBottom: "24px",
  },
  errorIcon: {
    fontSize: "20px",
    marginTop: "2px",
  },
  errorContent: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  errorText: {
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
  },
  reSignInBtn: {
    alignSelf: "flex-start",
    padding: "6px 14px",
    background: "#991b1b",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  emptyCard: {
    textAlign: "center",
    padding: "60px 24px",
    background: "#ffffff",
    borderRadius: "20px",
    border: "1px dashed #cbd5e1",
    maxWidth: "520px",
    margin: "0 auto",
  },
  emptyIcon: {
    fontSize: "44px",
    display: "block",
    marginBottom: "12px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  primaryBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
    gap: "20px",
  },
  tripCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  tripCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  tripIcon: {
    fontSize: "20px",
    marginTop: "2px",
  },
  tripTitle: {
    fontSize: "16.5px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.3,
  },
  tripDestination: {
    fontSize: "14px",
    color: "#475569",
    margin: 0,
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  metaPill: {
    padding: "4px 10px",
    borderRadius: "100px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: 600,
  },
  dateRange: {
    fontSize: "12.5px",
    color: "#64748b",
    margin: 0,
  },
  cardActions: {
    marginTop: "auto",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  viewBtn: {
    width: "100%",
    padding: "9px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#0369a1",
    fontSize: "13.5px",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    transition: "background 0.15s ease",
  },
};
