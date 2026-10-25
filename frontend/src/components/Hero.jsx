import React from "react";

export default function Hero({ onStartPlanning }) {
  function handleScroll(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header style={styles.heroSection}>
      <div style={styles.container}>
        {/* Left column: Copy & CTAs */}
        <div style={styles.contentCol}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            <span style={styles.badgeText}>Powered by Groq AI &amp; FastAPI</span>
          </div>

          <h1 style={styles.title}>
            Smart, Personalized Travel Itineraries{" "}
            <span style={styles.titleAccent}>Crafted in Seconds</span>
          </h1>

          <p style={styles.description}>
            Stop spending days browsing fragmented travel blogs. Tell us your destination,
            duration, budget, and passions—our AI generates an organized, realistic day-by-day
            guide with local activities, food, and expense estimates.
          </p>

          <div style={styles.ctaGroup}>
            <button
              type="button"
              onClick={onStartPlanning || (() => handleScroll("plan-trip"))}
              style={styles.primaryBtn}
            >
              <span>Start Planning Your Trip</span>
              <span style={styles.btnArrow} aria-hidden="true">
                ↓
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleScroll("features")}
              style={styles.secondaryBtn}
            >
              Explore Capabilities
            </button>
          </div>

          {/* Value props strip */}
          <div style={styles.statsStrip}>
            <div style={styles.statItem}>
              <span style={styles.statIcon}>⚡</span>
              <div>
                <strong style={styles.statTitle}>Instant Generation</strong>
                <p style={styles.statDesc}>Curated plans in &lt; 5 seconds</p>
              </div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statIcon}>🎯</span>
              <div>
                <strong style={styles.statTitle}>Budget Aligned</strong>
                <p style={styles.statDesc}>Realistic cost estimates</p>
              </div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={styles.statIcon}>✨</span>
              <div>
                <strong style={styles.statTitle}>Tailored Vibe</strong>
                <p style={styles.statDesc}>Matches your specific interests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Visual Showcase Card */}
        <div style={styles.visualCol}>
          <div style={styles.cardWrapper}>
            {/* Visual travel card */}
            <div style={styles.visualCard}>
              <div style={styles.cardImageContainer}>
                <img
                  src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80"
                  alt="Scenic coastal destination with palm trees and ocean view"
                  style={styles.cardImage}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to stylized SVG gradient pattern if offline
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = "flex";
                    }
                  }}
                />
                <div style={styles.fallbackVisual} aria-hidden="true">
                  <span>🏖️</span>
                  <p>Explore Beautiful Destinations</p>
                </div>
                <div style={styles.imageOverlayBadge}>
                  <span>📍 Popular Destination · Goa, India</span>
                </div>
              </div>

              {/* Sample preview preview items */}
              <div style={styles.cardBody}>
                <div style={styles.previewHeader}>
                  <div>
                    <h3 style={styles.previewTitle}>3-Day Coastal &amp; Heritage Tour</h3>
                    <span style={styles.previewSubtitle}>Custom Plan · 2 Travelers · ₹15,000 Budget</span>
                  </div>
                  <span style={styles.badgeSample}>Sample</span>
                </div>

                <div style={styles.timelineList}>
                  <div style={styles.timelineItem}>
                    <span style={styles.timeBullet}>Day 1</span>
                    <span style={styles.timeDesc}>Old Goa Latin Quarter &amp; Sunset Cruise</span>
                  </div>
                  <div style={styles.timelineItem}>
                    <span style={styles.timeBullet}>Day 2</span>
                    <span style={styles.timeDesc}>Fort Aguada &amp; Local Seafood Shack Tasting</span>
                  </div>
                  <div style={styles.timelineItem}>
                    <span style={styles.timeBullet}>Day 3</span>
                    <span style={styles.timeDesc}>Anjuna Flea Market &amp; Chapora Beach Chill</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <div style={styles.chipMini}>🏛️ Heritage</div>
                  <div style={styles.chipMini}>🍜 Food</div>
                  <div style={styles.chipMini}>🏖️ Beaches</div>
                  <span style={styles.cardFooterNote}>✨ AI Optimized Route</span>
                </div>
              </div>
            </div>

            {/* Floating accent badge */}
            <div style={styles.floatingBadge}>
              <span style={styles.floatingEmoji}>🤖</span>
              <div>
                <strong style={styles.floatingTitle}>100% Tailored</strong>
                <p style={styles.floatingDesc}>No cookie-cutter templates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  heroSection: {
    padding: "48px 24px 64px",
    background: "linear-gradient(180deg, #fcfbf9 0%, #f7f6f2 100%)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "48px",
    alignItems: "center",
  },
  contentCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  badge: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "100px",
    background: "rgba(2, 132, 199, 0.08)",
    border: "1px solid rgba(2, 132, 199, 0.2)",
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.2px",
  },
  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0284c7",
  },
  badgeText: {
    lineHeight: 1,
  },
  title: {
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
    fontWeight: 800,
    lineHeight: 1.18,
    color: "#0f172a",
    letterSpacing: "-0.8px",
  },
  titleAccent: {
    color: "#0284c7",
    display: "inline",
  },
  description: {
    fontSize: "clamp(1rem, 1.8vw, 1.125rem)",
    lineHeight: 1.65,
    color: "#475569",
    maxWidth: "580px",
  },
  ctaGroup: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px",
    marginTop: "8px",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 26px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  btnArrow: {
    fontSize: "16px",
    lineHeight: 1,
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "13px 22px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#334155",
    border: "1.5px solid #cbd5e1",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  statsStrip: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "20px",
    marginTop: "16px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(226, 232, 240, 0.8)",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statIcon: {
    fontSize: "20px",
  },
  statTitle: {
    display: "block",
    fontSize: "13px",
    color: "#0f172a",
    fontWeight: 700,
  },
  statDesc: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  statDivider: {
    width: "1px",
    height: "28px",
    background: "#e2e8f0",
  },
  visualCol: {
    display: "flex",
    justifyContent: "center",
  },
  cardWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
  },
  visualCard: {
    background: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 20px 40px -15px rgba(15, 23, 42, 0.05)",
  },
  cardImageContainer: {
    position: "relative",
    width: "100%",
    height: "220px",
    background: "#e2e8f0",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  fallbackVisual: {
    display: "none",
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
    color: "#ffffff",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600,
  },
  imageOverlayBadge: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(6px)",
    color: "#ffffff",
    padding: "5px 12px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
  },
  cardBody: {
    padding: "20px 22px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  previewHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  previewTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 4px",
  },
  previewSubtitle: {
    fontSize: "12px",
    color: "#64748b",
  },
  badgeSample: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#0284c7",
    background: "rgba(2, 132, 199, 0.1)",
    padding: "3px 8px",
    borderRadius: "6px",
    textTransform: "uppercase",
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },
  timelineItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
  },
  timeBullet: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#0369a1",
    background: "#e0f2fe",
    padding: "2px 8px",
    borderRadius: "100px",
    whiteSpace: "nowrap",
  },
  timeDesc: {
    color: "#334155",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    paddingTop: "6px",
  },
  chipMini: {
    fontSize: "11px",
    padding: "3px 8px",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "6px",
    fontWeight: 500,
  },
  cardFooterNote: {
    marginLeft: "auto",
    fontSize: "11px",
    color: "#0284c7",
    fontWeight: 600,
  },
  floatingBadge: {
    position: "absolute",
    bottom: "-16px",
    left: "-16px",
    background: "#ffffff",
    padding: "10px 14px",
    borderRadius: "14px",
    boxShadow: "0 8px 24px -4px rgba(15, 23, 42, 0.12)",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  floatingEmoji: {
    fontSize: "22px",
  },
  floatingTitle: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  floatingDesc: {
    fontSize: "11px",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.2,
  },
};
