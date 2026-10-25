import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  cleanItineraryContent,
  renderWithBreaks,
} from "../utils/markdownUtils";

export default function ItineraryResult({ itinerary, formData }) {
  const [copied, setCopied] = useState(false);

  if (!itinerary) return null;

  const destination = itinerary.destination || formData.destination;
  const days = itinerary.days ?? formData.days;
  const travelers = itinerary.travelers ?? formData.travelers;
  const budget = itinerary.budget ?? formData.budget;

  const daysText = `${days} ${days === 1 ? "day" : "days"}`;
  const travelersText = `${travelers} ${travelers === 1 ? "traveler" : "travelers"}`;

  function handleCopy() {
    if (!itinerary.itinerary) return;
    navigator.clipboard.writeText(itinerary.itinerary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handlePrint() {
    window.print();
  }

  /* ── Custom ReactMarkdown element renderers ──────────────── */
  const mdComponents = {
    h1: ({ children }) => <h1 style={md.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={md.h2}>{children}</h2>,
    h3: ({ children }) => <h3 style={md.h3}>{children}</h3>,
    p: ({ children }) => <p style={md.p}>{renderWithBreaks(children, "p")}</p>,
    ul: ({ children }) => <ul style={md.ul}>{children}</ul>,
    ol: ({ children }) => <ol style={md.ol}>{children}</ol>,
    li: ({ children }) => (
      <li style={md.li}>{renderWithBreaks(children, "li")}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote style={md.blockquote}>{children}</blockquote>
    ),
    hr: () => <hr style={md.hr} />,
    strong: ({ children }) => <strong style={md.strong}>{children}</strong>,
    table: ({ children }) => (
      <div style={md.tableWrapper}>
        <table style={md.table}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    th: ({ children }) => (
      <th style={md.th}>{renderWithBreaks(children, "th")}</th>
    ),
    td: ({ children }) => (
      <td style={md.td}>{renderWithBreaks(children, "td")}</td>
    ),
    tr: ({ children }) => <tr style={md.tr}>{children}</tr>,
  };

  return (
    <section
      id="itinerary-result"
      style={styles.section}
      aria-labelledby="result-title"
    >
      <div style={styles.container}>
        {/* Card */}
        <div style={styles.card}>
          {/* Header Banner */}
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div style={styles.headerTag}>
                <span>✨ AI-Generated Plan</span>
              </div>

              <div style={styles.actionButtons}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={styles.actionBtn}
                  title="Copy full Markdown to clipboard"
                  aria-label="Copy itinerary to clipboard"
                >
                  <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={styles.actionBtn}
                  title="Print or Save as PDF"
                  aria-label="Print or save as PDF"
                >
                  <span>🖨️ Print / PDF</span>
                </button>
              </div>
            </div>

            <h2 id="result-title" style={styles.title}>
              Your {daysText} in{" "}
              <span style={styles.destinationAccent}>{destination}</span>
            </h2>

            {/* Metadata Pills */}
            <div style={styles.metaStrip}>
              <div style={styles.metaPill}>
                <span aria-hidden="true">🗓️</span>
                <span>{daysText}</span>
              </div>
              <div style={styles.metaPill}>
                <span aria-hidden="true">👥</span>
                <span>{travelersText}</span>
              </div>
              <div style={styles.metaPill}>
                <span aria-hidden="true">💰</span>
                <span>{budget}</span>
              </div>
            </div>
          </div>

          {/* Markdown Content Area */}
          <div style={styles.body}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents}
            >
              {cleanItineraryContent(itinerary.itinerary)}
            </ReactMarkdown>
          </div>

          {/* Note footer inside card */}
          <div style={styles.cardFooter}>
            <span style={styles.footerIcon} aria-hidden="true">
              💡
            </span>
            <p style={styles.footerNote}>
              <strong>Traveler Note:</strong> Pricing, local transportation, and
              attraction schedules are approximate estimations. We recommend
              verifying tickets, passes, and venue hours prior to departure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "0 24px 80px",
    background: "#fcfbf9",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow:
      "0 10px 40px -10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)",
  },
  header: {
    padding: "32px 36px 24px",
    background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)",
    borderBottom: "1px solid #e0f2fe",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "12px",
  },
  headerTag: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "100px",
    background: "rgba(2, 132, 199, 0.12)",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "8px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  title: {
    fontSize: "clamp(1.5rem, 3.2vw, 2.2rem)",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
    marginBottom: "16px",
    lineHeight: 1.25,
  },
  destinationAccent: {
    color: "#0284c7",
  },
  metaStrip: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "100px",
    background: "#ffffff",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    fontSize: "13px",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(2, 132, 199, 0.05)",
  },
  body: {
    padding: "clamp(24px, 4vw, 40px)",
    lineHeight: 1.8,
    color: "#334155",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  cardFooter: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    margin: "0 36px 36px",
    padding: "16px 20px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
  },
  footerIcon: {
    fontSize: "18px",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "2px",
  },
  footerNote: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.5,
  },
};

const md = {
  h1: {
    fontSize: "1.65rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "32px 0 14px",
    paddingBottom: "10px",
    borderBottom: "2px solid #e2e8f0",
    letterSpacing: "-0.4px",
  },
  h2: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#0369a1",
    margin: "28px 0 12px",
    paddingBottom: "6px",
    borderBottom: "1px solid #f1f5f9",
    letterSpacing: "-0.2px",
  },
  h3: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: "20px 0 8px",
  },
  p: {
    margin: "0 0 16px",
    color: "#334155",
    lineHeight: 1.8,
    fontSize: "15px",
  },
  ul: {
    margin: "0 0 16px 20px",
    color: "#334155",
  },
  ol: {
    margin: "0 0 16px 20px",
    color: "#334155",
  },
  li: {
    marginBottom: "6px",
    lineHeight: 1.7,
    fontSize: "15px",
  },
  blockquote: {
    margin: "20px 0",
    padding: "14px 20px",
    borderLeft: "4px solid #0284c7",
    background: "#f0f9ff",
    borderRadius: "0 10px 10px 0",
    color: "#0369a1",
    fontStyle: "normal",
    fontSize: "14.5px",
    lineHeight: 1.65,
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "32px 0",
  },
  strong: {
    fontWeight: 700,
    color: "#0f172a",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
    margin: "20px 0 28px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    minWidth: "440px",
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f8fafc",
    color: "#1e293b",
    fontWeight: 700,
    fontSize: "13px",
    borderBottom: "2px solid #e2e8f0",
    borderRight: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
    letterSpacing: "0.2px",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #f8fafc",
    verticalAlign: "top",
    color: "#334155",
    lineHeight: 1.6,
  },
  tr: {
    transition: "background 0.1s",
  },
};
