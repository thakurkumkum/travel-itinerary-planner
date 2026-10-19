import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useEffect, useState } from "react";
import { checkBackendHealth, generateItinerary } from "./services/api";

/* ─── Interest chip emoji map ─────────────────────────── */
const INTEREST_ICONS = {
  "Historical places": "🏛️",
  "Local food": "🍜",
  Nature: "🌿",
  Adventure: "🧗",
  Photography: "📸",
  Shopping: "🛍️",
  Culture: "🎭",
  Beaches: "🏖️",
};

export const BR_TAG_REGEX = /(?:\\*<[\/\\]*\s*br\s*[\/\\]*.*?>|&lt;[\/\\]*\s*br\s*[\/\\]*.*?&gt;)/gi;

export function renderWithBreaks(node, keyPrefix = "br") {
  if (typeof node === "string") {
    const parts = node.split(BR_TAG_REGEX);
    if (parts.length === 1) return node;
    const elements = [];
    parts.forEach((part, index) => {
      if (index > 0) {
        elements.push(<br key={`${keyPrefix}-${index}`} />);
      }
      if (part) {
        elements.push(part);
      }
    });
    return elements;
  }
  if (React.isValidElement(node) && node.props && node.props.children) {
    return React.cloneElement(node, {
      children: Array.isArray(node.props.children)
        ? node.props.children.flatMap((c, i) => renderWithBreaks(c, `${keyPrefix}-${i}`))
        : renderWithBreaks(node.props.children, `${keyPrefix}-c`),
    });
  }
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => renderWithBreaks(item, `${keyPrefix}-${i}`));
  }
  return node;
}

export function cleanItineraryContent(text) {
  if (!text) return "";
  const cleaned = text.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");

  // Outside of table rows, convert any break tags into standard Markdown line breaks
  const lines = cleaned.split("\n");
  const processed = lines.map((line) => {
    // In table rows, keep tags for renderWithBreaks to convert into safe <br /> elements
    if (line.includes("|")) {
      return line;
    }
    // Outside tables, replace break tags with standard markdown line break
    return line.replace(BR_TAG_REGEX, "  \n");
  });

  return processed.join("\n");
}

function App() {
  const [status, setStatus] = useState("Checking backend…");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState(null);

  const [formData, setFormData] = useState({
    destination: "",
    days: 3,
    budget: "₹10000",
    interests: [],
    travelers: 1,
  });

  const availableInterests = [
    "Historical places",
    "Local food",
    "Nature",
    "Adventure",
    "Photography",
    "Shopping",
    "Culture",
    "Beaches",
  ];

  /* ── Backend health check on mount ─────────────────── */
  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setStatus(`Backend connected: ${data.status}`);
        setIsConnected(true);
      })
      .catch(() => {
        setStatus("Backend connection failed. Check FastAPI.");
        setIsConnected(false);
      });
  }, []);

  /* ── Form handlers ──────────────────────────────────── */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleInterestChange(interest) {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setItinerary(null);

    if (formData.interests.length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        days: Number(formData.days),
        travelers: Number(formData.travelers),
      };
      const result = await generateItinerary(payload);
      setItinerary({
        ...result,
        travelers: payload.travelers,
        budget: formData.budget,
      });
      // Smooth-scroll to results after render
      setTimeout(() => {
        document
          .getElementById("itinerary-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(err.message || "Unable to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Markdown custom renderers ──────────────────────── */
  const mdComponents = {
    // Headings
    h1: ({ children }) => <h1 style={md.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={md.h2}>{children}</h2>,
    h3: ({ children }) => <h3 style={md.h3}>{children}</h3>,
    // Paragraph
    p: ({ children }) => <p style={md.p}>{renderWithBreaks(children, "p")}</p>,
    // Lists
    ul: ({ children }) => <ul style={md.ul}>{children}</ul>,
    ol: ({ children }) => <ol style={md.ol}>{children}</ol>,
    li: ({ children }) => <li style={md.li}>{renderWithBreaks(children, "li")}</li>,
    // Blockquote
    blockquote: ({ children }) => (
      <blockquote style={md.blockquote}>{children}</blockquote>
    ),
    // Horizontal rule
    hr: () => <hr style={md.hr} />,
    // Strong / em
    strong: ({ children }) => <strong style={md.strong}>{children}</strong>,
    // Table (scrollable on mobile)
    table: ({ children }) => (
      <div style={md.tableWrapper}>
        <table style={md.table}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    th: ({ children }) => <th style={md.th}>{renderWithBreaks(children, "th")}</th>,
    td: ({ children }) => <td style={md.td}>{renderWithBreaks(children, "td")}</td>,
    tr: ({ children }) => <tr style={md.tr}>{children}</tr>,
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <>
      {/* ── Global resets injected via a style tag ───── */}
      <style>{globalCSS}</style>

      <main style={s.page}>
        {/* ── Header ─────────────────────────────────── */}
        <header style={s.header}>
          <span style={s.eyebrow}>✈️ YOUR NEXT ADVENTURE STARTS HERE</span>
          <h1 style={s.title}>Personalized Travel Planner</h1>
          <p style={s.subtitle}>
            Tell us what you love, and let AI craft your perfect trip.
          </p>

          {/* API status badge */}
          <div
            style={{
              ...s.statusBadge,
              background: isConnected ? "#dcfce7" : "#fef3c7",
              color: isConnected ? "#166534" : "#92400e",
              borderColor: isConnected ? "#bbf7d0" : "#fde68a",
            }}
          >
            <span style={s.statusDot(isConnected)} />
            <strong>API:</strong>&nbsp;{status}
          </div>
        </header>

        {/* ── Trip Form Card ──────────────────────────── */}
        <section style={s.card} aria-labelledby="form-title">
          <h2 id="form-title" style={s.cardTitle}>
            🗺️ Plan Your Trip
          </h2>
          <p style={s.muted}>
            Enter your preferences below to generate a personalised itinerary.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Destination */}
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="destination">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. Jaipur, Manali, Goa"
                minLength={2}
                maxLength={100}
                required
                style={s.input}
              />
            </div>

            {/* Days + Travelers grid */}
            <div style={s.grid2}>
              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="days">
                  Number of Days
                </label>
                <input
                  id="days"
                  name="days"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.days}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label} htmlFor="travelers">
                  Travelers
                </label>
                <input
                  id="travelers"
                  name="travelers"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.travelers}
                  onChange={handleChange}
                  required
                  style={s.input}
                />
              </div>
            </div>

            {/* Budget */}
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="budget">
                Total Trip Budget
              </label>
              <input
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. ₹10000"
                maxLength={50}
                required
                style={s.input}
              />
            </div>

            {/* Interests */}
            <fieldset style={s.fieldset}>
              <legend style={s.label}>What are you interested in?</legend>
              <div style={s.chipsGrid}>
                {availableInterests.map((interest) => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestChange(interest)}
                      style={{
                        ...s.chip,
                        ...(selected ? s.chipSelected : {}),
                      }}
                      aria-pressed={selected}
                    >
                      <span>{INTEREST_ICONS[interest]}</span>
                      {interest}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Error message */}
            {error && (
              <div role="alert" style={s.errorBox}>
                <span style={s.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !isConnected}
              style={{
                ...s.submitBtn,
                opacity: loading || !isConnected ? 0.65 : 1,
                cursor: loading || !isConnected ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span style={s.spinner} aria-hidden="true" />
                  Generating Itinerary…
                </>
              ) : (
                "✨ Generate My Itinerary"
              )}
            </button>
          </form>
        </section>

        {/* ── Itinerary Result Card ───────────────────── */}
        {itinerary && (
          <section
            id="itinerary-result"
            style={s.resultCard}
            aria-labelledby="result-title"
          >
            {/* Result header */}
            <div style={s.resultHeader}>
              <h2 id="result-title" style={s.resultTitle}>
                🌍 Your {itinerary.days ?? formData.days}-Day Trip to{" "}
                <span style={s.highlight}>{itinerary.destination}</span>
              </h2>
              <div style={s.resultMeta}>
                <span style={s.metaTag}>
                  🗓️ {itinerary.days ?? formData.days} {(itinerary.days ?? formData.days) === 1 ? "day" : "days"}
                </span>
                <span style={s.metaTag}>
                  👥 {itinerary.travelers ?? formData.travelers} {(itinerary.travelers ?? formData.travelers) === 1 ? "traveler" : "travelers"}
                </span>
                <span style={s.metaTag}>
                  💰 {itinerary.budget ?? formData.budget}
                </span>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "0 0 24px" }} />

            {/* Markdown body */}
            <div style={s.mdBody}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={mdComponents}
              >
                {cleanItineraryContent(itinerary.itinerary)}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* ── Footer ─────────────────────────────────── */}
        <footer style={s.footer}>
          <span>🌐 Personalized Travel Itinerary Planner</span>
          <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
          <span>AI-Powered Trip Planning</span>
        </footer>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Global CSS string — injected via <style> tag.
   Only resets + spinner animation; no external deps needed.
══════════════════════════════════════════════════════════════ */
const globalCSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f0f4f8; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Smooth focus ring for accessibility */
  input:focus, button:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  /* Number input arrow clean-up */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { opacity: 1; }
`;

/* ═══════════════════════════════════════════════════════════
   Layout & component styles (JS objects)
══════════════════════════════════════════════════════════════ */
const s = {
  /* Page shell */
  page: {
    minHeight: "100vh",
    padding: "40px 16px 60px",
    fontFamily:
      "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#1e293b",
    lineHeight: 1.6,
  },

  /* ── Header ───────────────────────────── */
  header: {
    maxWidth: "720px",
    margin: "0 auto 32px",
    textAlign: "center",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: "10px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2.5px",
    color: "#0284c7",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "#0f172a",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#475569",
    marginBottom: "18px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "100px",
    fontSize: "13px",
    border: "1px solid",
    fontWeight: 500,
  },
  statusDot: (connected) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: connected ? "#16a34a" : "#d97706",
    flexShrink: 0,
  }),

  /* ── Shared card shell ─────────────────── */
  card: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "clamp(20px, 4vw, 36px)",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -4px rgba(0,0,0,0.08)",
    border: "1px solid rgba(226,232,240,0.8)",
  },
  cardTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "6px",
  },
  muted: {
    color: "#64748b",
    fontSize: "0.9rem",
    marginBottom: "24px",
  },

  /* ── Form internals ────────────────────── */
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: 600,
    fontSize: "13px",
    color: "#374151",
    letterSpacing: "0.2px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "15px",
    color: "#1e293b",
    background: "#f8fafc",
    transition: "border-color 0.15s",
    outline: "none",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  fieldset: {
    border: "none",
    marginBottom: "20px",
  },

  /* Interest chips */
  chipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
    marginTop: "8px",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left",
  },
  chipSelected: {
    border: "1.5px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 600,
  },

  /* Error box */
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    color: "#b91c1c",
    fontSize: "14px",
    marginBottom: "16px",
    lineHeight: 1.5,
  },
  errorIcon: { flexShrink: 0, fontSize: "16px" },

  /* Submit button */
  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "13px 20px",
    marginTop: "8px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.2px",
    boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
    transition: "opacity 0.2s, transform 0.1s",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2.5px solid rgba(255,255,255,0.4)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
    flexShrink: 0,
  },

  /* ── Result card ────────────────────────── */
  resultCard: {
    maxWidth: "720px",
    margin: "28px auto 0",
    background: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -4px rgba(0,0,0,0.08)",
    border: "1px solid rgba(226,232,240,0.8)",
  },
  resultHeader: {
    padding: "28px 32px 20px",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    borderBottom: "1px solid #bae6fd",
  },
  resultTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "12px",
  },
  highlight: {
    color: "#0284c7",
  },
  resultMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  metaTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 12px",
    background: "rgba(255,255,255,0.8)",
    border: "1px solid #bae6fd",
    borderRadius: "100px",
    fontSize: "13px",
    color: "#0369a1",
    fontWeight: 500,
  },

  /* Markdown container */
  mdBody: {
    padding: "24px 32px 32px",
    lineHeight: 1.8,
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  /* ── Footer ─────────────────────────────── */
  footer: {
    marginTop: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
};

/* ═══════════════════════════════════════════════════════════
   Markdown element styles
══════════════════════════════════════════════════════════════ */
const md = {
  h1: {
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "28px 0 10px",
    paddingBottom: "8px",
    borderBottom: "2px solid #e2e8f0",
  },
  h2: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "24px 0 8px",
    paddingBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
  },
  h3: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#334155",
    margin: "18px 0 6px",
  },
  p: {
    margin: "0 0 14px",
    color: "#374151",
    lineHeight: 1.8,
  },
  ul: {
    margin: "0 0 14px 20px",
    color: "#374151",
  },
  ol: {
    margin: "0 0 14px 20px",
    color: "#374151",
  },
  li: {
    marginBottom: "5px",
    lineHeight: 1.7,
  },
  blockquote: {
    margin: "16px 0",
    padding: "12px 18px",
    borderLeft: "4px solid #0ea5e9",
    background: "#f0f9ff",
    borderRadius: "0 8px 8px 0",
    color: "#0369a1",
    fontStyle: "italic",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "24px 0",
  },
  strong: {
    fontWeight: 700,
    color: "#0f172a",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
    margin: "16px 0 24px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
    minWidth: "380px",
  },
  th: {
    textAlign: "left",
    padding: "11px 14px",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 700,
    fontSize: "13px",
    borderBottom: "2px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    verticalAlign: "top",
    color: "#374151",
    lineHeight: 1.6,
  },
  tr: {
    transition: "background 0.1s",
  },
};

export default App;
