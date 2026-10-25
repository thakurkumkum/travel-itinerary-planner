import React from "react";

export default function Features() {
  const featuresList = [
    {
      icon: "⚡",
      title: "AI-Powered Day-by-Day Schedules",
      description:
        "Generates practical morning, afternoon, and evening timelines tailored to your exact trip duration, avoiding rushed transfers or unrealistic travel logistics.",
      tag: "Intelligent Sequencing",
    },
    {
      icon: "📊",
      title: "Budget-Aware Estimation",
      description:
        "Breaks down estimated expenses across lodging, local dining, transit, and sightseeing, keeping totals aligned with your stated spending target.",
      tag: "Cost Transparency",
    },
    {
      icon: "🎯",
      title: "Interest-Driven Personalization",
      description:
        "Select your exact passions—heritage, local street food, photography, beaches, or adventure—to shape authentic, non-generic travel suggestions.",
      tag: "Tailored to You",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Enter Trip Parameters",
      desc: "Specify your target destination, duration in days, travel party size, and total budget.",
    },
    {
      step: "02",
      title: "Choose Your Passions",
      desc: "Select the cultural and leisure interests that matter most to your travel style.",
    },
    {
      step: "03",
      title: "Receive Full Itinerary",
      desc: "Instant AI generation crafts organized activities, local food tips, and structured expense breakdowns.",
    },
  ];

  return (
    <>
      {/* ── Features Section ──────────────────────────────── */}
      <section id="features" style={styles.section} aria-labelledby="features-heading">
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.tag}>
              <span>💡 Core Capabilities</span>
            </div>
            <h2 id="features-heading" style={styles.title}>
              Designed for Smarter, Effortless Travel
            </h2>
            <p style={styles.subtitle}>
              Our AI planner focuses on realism, logical routing, and authentic local experiences
              so you spend less time planning and more time exploring.
            </p>
          </div>

          <div style={styles.grid}>
            {featuresList.map((item) => (
              <div key={item.title} style={styles.card}>
                <div style={styles.iconWrapper}>{item.icon}</div>
                <span style={styles.cardTag}>{item.tag}</span>
                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardDesc}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────── */}
      <section id="how-it-works" style={styles.howSection} aria-labelledby="how-heading">
        <div style={styles.container}>
          <div style={styles.header}>
            <div style={styles.tag}>
              <span>⚙️ How It Works</span>
            </div>
            <h2 id="how-heading" style={styles.title}>
              Three Simple Steps to Your Custom Plan
            </h2>
            <p style={styles.subtitle}>
              No complex questionnaires or account setups required. Get your tailored itinerary
              in under a minute.
            </p>
          </div>

          <div style={styles.stepsGrid}>
            {steps.map((s, idx) => (
              <div key={s.step} style={styles.stepCard}>
                <div style={styles.stepNumberBadge}>{s.step}</div>
                <h3 style={styles.stepTitle}>{s.title}</h3>
                <p style={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const styles = {
  section: {
    padding: "80px 24px",
    background: "#fcfbf9",
    borderTop: "1px solid rgba(226, 232, 240, 0.7)",
  },
  howSection: {
    padding: "80px 24px",
    background: "#ffffff",
    borderTop: "1px solid rgba(226, 232, 240, 0.7)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "48px",
  },
  tag: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "100px",
    background: "rgba(2, 132, 199, 0.08)",
    color: "#0284c7",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "12px",
    letterSpacing: "0.4px",
  },
  title: {
    fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
    marginBottom: "12px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "28px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px 28px",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  iconWrapper: {
    fontSize: "32px",
    lineHeight: 1,
    marginBottom: "4px",
  },
  cardTag: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.35,
  },
  cardDesc: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: 1.65,
    margin: 0,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "32px",
  },
  stepCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    padding: "24px 20px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  stepNumberBadge: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#0284c7",
    background: "#e0f2fe",
    padding: "6px 14px",
    borderRadius: "10px",
  },
  stepTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  stepDesc: {
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
};
