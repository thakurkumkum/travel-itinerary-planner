import React from "react";

export default function Footer() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <footer style={styles.footer} role="contentinfo">
      <div style={styles.container}>
        <div style={styles.topRow}>
          {/* Brand info */}
          <div style={styles.brandBlock}>
            <div style={styles.brandRow}>
              <span style={styles.brandIcon} aria-hidden="true">
                🧭
              </span>
              <span style={styles.brandName}>VoyagePlan</span>
            </div>
            <p style={styles.brandTagline}>
              Intelligent, personalized itinerary curation powered by FastAPI and Groq AI.
            </p>
          </div>

          {/* Quick links */}
          <div style={styles.linksGroup}>
            <span style={styles.groupHeading}>Navigation</span>
            <button
              type="button"
              onClick={() => scrollToSection("plan-trip")}
              style={styles.linkBtn}
            >
              Plan a Trip
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              style={styles.linkBtn}
            >
              Core Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              style={styles.linkBtn}
            >
              How It Works
            </button>
          </div>

          {/* Tech stack pills */}
          <div style={styles.techGroup}>
            <span style={styles.groupHeading}>Technology Stack</span>
            <div style={styles.techPills}>
              <span style={styles.techPill}>React 18</span>
              <span style={styles.techPill}>Vite</span>
              <span style={styles.techPill}>FastAPI</span>
              <span style={styles.techPill}>Groq AI</span>
              <span style={styles.techPill}>Supabase</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div style={styles.bottomRow}>
          <p style={styles.copyright}>
            © {new Date().getFullYear()} Personalized Travel Itinerary Planner. All rights reserved.
          </p>
          <button type="button" onClick={scrollToTop} style={styles.backToTop}>
            <span>Back to top</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#0f172a",
    color: "#94a3b8",
    padding: "60px 24px 36px",
    borderTop: "1px solid #1e293b",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "40px",
    paddingBottom: "48px",
    borderBottom: "1px solid #1e293b",
  },
  brandBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandIcon: {
    fontSize: "22px",
  },
  brandName: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "-0.3px",
  },
  brandTagline: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#94a3b8",
    margin: 0,
    maxWidth: "320px",
  },
  linksGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "10px",
  },
  groupHeading: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "4px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "color 0.15s",
    textAlign: "left",
  },
  techGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  techPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  techPill: {
    padding: "4px 10px",
    borderRadius: "6px",
    background: "#1e293b",
    color: "#cbd5e1",
    fontSize: "12px",
    fontWeight: 500,
    border: "1px solid #334155",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
    paddingTop: "28px",
  },
  copyright: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  backToTop: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "none",
    color: "#38bdf8",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
};
