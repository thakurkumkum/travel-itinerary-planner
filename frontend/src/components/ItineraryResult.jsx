import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../context/AuthContext";
import { saveTrip } from "../services/api";
import {
  cleanItineraryContent,
  renderWithBreaks,
  normalizeEscapedMarkdown,
  processActivities,
  extractTrailingContent,
} from "../utils/markdownUtils";

export default function ItineraryResult({ itinerary, formData, onOpenAuth }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error
  const [saveError, setSaveError] = useState("");

  if (!itinerary) return null;

  const destination = itinerary.destination || formData?.destination || "Your Trip";
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const budget = itinerary.budget || formData?.budget || "moderate";
  const pace = itinerary.pace || formData?.pace || "balanced";

  const startDate = itinerary.start_date || formData?.start_date;
  const endDate = itinerary.end_date || formData?.end_date;

  const totalDays =
    days.length > 0
      ? days.length
      : typeof itinerary.day_count === "number" && itinerary.day_count > 0
      ? itinerary.day_count
      : 1;

  const daysText = `${totalDays} ${totalDays === 1 ? "day" : "days"}`;

  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const trailingContent = extractTrailingContent(itinerary.itinerary);

  const itineraryText = [
    `Travel Itinerary: ${destination}`,
    `Dates: ${formatDate(startDate)} - ${formatDate(endDate)}`,
    `Duration: ${daysText}`,
    `Budget: ${budget}`,
    `Pace: ${pace}`,
    "",
    ...days.flatMap((day) => {
      const dayActivities = processActivities(day.activities);
      return [
        `Day ${day.day_number}: ${normalizeEscapedMarkdown(day.title)}`,
        `Date: ${formatDate(day.date)}`,
        ...(day.notes ? [cleanItineraryContent(day.notes)] : []),
        "Activities:",
        ...dayActivities.map((act) =>
          act.type === "table" ? act.content : `- ${act.content}`
        ),
        "",
      ];
    }),
    ...(trailingContent ? [cleanItineraryContent(trailingContent), ""] : []),
  ].join("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(itineraryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy your itinerary:", itineraryText);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleSave() {
    if (!user) {
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }

    if (saveStatus === "saving" || saveStatus === "saved") {
      return;
    }

    setSaveStatus("saving");
    setSaveError("");

    try {
      const payload = {
        title: `${daysText} in ${destination}`,
        destination: destination,
        start_date: startDate || null,
        end_date: endDate || null,
        preferences: {
          budget: budget,
          pace: pace,
          interests: formData?.interests || [],
        },
        content: {
          ...itinerary,
          destination,
          days,
        },
      };

      await saveTrip(payload);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err.message || "Failed to save trip. Please try again.");
    }
  }

  /* ── Custom ReactMarkdown component renderers ──────────────── */
  const inlineMdComponents = {
    p: ({ children }) => <>{renderWithBreaks(children, "p")}</>,
    strong: ({ children }) => <strong style={md.strong}>{children}</strong>,
    h1: ({ children }) => <h3 style={md.h3}>{children}</h3>,
    h2: ({ children }) => <h3 style={md.h3}>{children}</h3>,
    h3: ({ children }) => <h4 style={md.h4}>{children}</h4>,
    h4: ({ children }) => <h5 style={md.h4}>{children}</h5>,
    ul: ({ children }) => <ul style={{ paddingLeft: "20px", margin: "6px 0" }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ paddingLeft: "20px", margin: "6px 0" }}>{children}</ol>,
    li: ({ children }) => (
      <li style={{ marginBottom: "4px" }}>{renderWithBreaks(children, "sub-li")}</li>
    ),
    table: ({ children }) => (
      <div style={md.tableWrapper}>
        <table style={md.table}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    th: ({ children }) => <th style={md.th}>{renderWithBreaks(children, "th")}</th>,
    td: ({ children }) => <td style={md.td}>{renderWithBreaks(children, "td")}</td>,
    tr: ({ children }) => <tr style={md.tr}>{children}</tr>,
    blockquote: ({ children }) => (
      <blockquote style={md.blockquote}>{children}</blockquote>
    ),
    hr: () => <hr style={md.hr} />,
  };

  const blockMdComponents = {
    ...inlineMdComponents,
    p: ({ children }) => <p style={md.p}>{renderWithBreaks(children, "p")}</p>,
    h1: ({ children }) => <h1 style={md.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={md.h2}>{children}</h2>,
    h3: ({ children }) => <h3 style={md.h3}>{children}</h3>,
    ul: ({ children }) => <ul style={md.ul}>{children}</ul>,
    ol: ({ children }) => <ol style={md.ol}>{children}</ol>,
    li: ({ children }) => <li style={md.li}>{renderWithBreaks(children, "li")}</li>,
  };

  return (
    <section
      id="itinerary-result"
      style={styles.section}
      aria-labelledby="result-title"
    >
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <div style={styles.headerTag}>
                <span>✨ AI-Generated Plan</span>
              </div>

              <div style={styles.actionButtons}>
                {/* Save Trip Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || saveStatus === "saved"}
                  style={{
                    ...styles.actionBtn,
                    ...(saveStatus === "saved" ? styles.savedBtn : {}),
                    ...(saveStatus === "saving" ? styles.savingBtn : {}),
                  }}
                  title={user ? "Save this itinerary to your account" : "Sign in to save"}
                  aria-label="Save itinerary"
                >
                  {saveStatus === "saving" && <span>⏳ Saving...</span>}
                  {saveStatus === "saved" && <span>✓ Saved!</span>}
                  {saveStatus !== "saving" && saveStatus !== "saved" && (
                    <span>💾 {user ? "Save Trip" : "Sign in to Save"}</span>
                  )}
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  style={styles.actionBtn}
                  title="Copy itinerary"
                  aria-label="Copy itinerary to clipboard"
                >
                  <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
                </button>

                {/* Print/PDF Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  style={styles.actionBtn}
                  title="Print or save as PDF"
                  aria-label="Print or save as PDF"
                >
                  <span>🖨️ Print / PDF</span>
                </button>
              </div>
            </div>

            {saveError && (
              <div style={styles.saveErrorNotice}>
                <span>⚠️ {saveError}</span>
              </div>
            )}

            <h2 id="result-title" style={styles.title}>
              Your {daysText} in{" "}
              <span style={styles.destinationAccent}>{destination}</span>
            </h2>

            <div style={styles.metaStrip}>
              <div style={styles.metaPill}>
                <span aria-hidden="true">🗓️</span>
                <span>
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              </div>

              <div style={styles.metaPill}>
                <span aria-hidden="true">💰</span>
                <span>{budget}</span>
              </div>

              <div style={styles.metaPill}>
                <span aria-hidden="true">🚶</span>
                <span>{pace} pace</span>
              </div>
            </div>
          </div>

          <div style={styles.body}>
            {itinerary.notice && (
              <p style={styles.notice}>{itinerary.notice}</p>
            )}

            {days.length === 0 ? (
              (itinerary.itinerary || itinerary.raw) ? (
                <div style={styles.markdownBody}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={blockMdComponents}
                  >
                    {cleanItineraryContent(itinerary.itinerary || itinerary.raw)}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>
                  No daily itinerary was returned. Please try generating it again.
                </p>
              )
            ) : (
              <>
                {days.map((day) => {
                  const processedActivities = processActivities(day.activities);

                  return (
                    <article
                      key={`${day.day_number}-${day.date}`}
                      style={styles.dayCard}
                    >
                      <h3 style={styles.dayTitle}>
                        Day {day.day_number}:{" "}
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <>{children}</>,
                            strong: ({ children }) => (
                              <strong style={md.strong}>{children}</strong>
                            ),
                          }}
                        >
                          {normalizeEscapedMarkdown(day.title)}
                        </ReactMarkdown>
                      </h3>

                      <p style={styles.dayDate}>{formatDate(day.date)}</p>

                      {day.notes && (
                        <div style={styles.dayNotes}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={inlineMdComponents}
                          >
                            {cleanItineraryContent(day.notes)}
                          </ReactMarkdown>
                        </div>
                      )}

                      {processedActivities.length > 0 && (
                        <>
                          <h4 style={styles.activitiesHeading}>Activities</h4>
                          <ul style={styles.activitiesList}>
                            {processedActivities.map((item, index) => {
                              if (item.type === "table") {
                                return (
                                  <li
                                    key={`${day.day_number}-activity-${index}`}
                                    style={{
                                      listStyleType: "none",
                                      marginLeft: "-22px",
                                    }}
                                  >
                                    <div style={md.tableWrapper}>
                                      <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={inlineMdComponents}
                                      >
                                        {item.content}
                                      </ReactMarkdown>
                                    </div>
                                  </li>
                                );
                              }

                              return (
                                <li
                                  key={`${day.day_number}-activity-${index}`}
                                  style={styles.activityItem}
                                >
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={inlineMdComponents}
                                  >
                                    {item.content}
                                  </ReactMarkdown>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </article>
                  );
                })}

                {trailingContent && (
                  <article style={styles.overviewCard}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={blockMdComponents}
                    >
                      {cleanItineraryContent(trailingContent)}
                    </ReactMarkdown>
                  </article>
                )}
              </>
            )}
          </div>

          <div style={styles.cardFooter}>
            <span style={styles.footerIcon} aria-hidden="true">
              💡
            </span>
            <p style={styles.footerNote}>
              <strong>Traveler Note:</strong> Prices, transportation, and
              attraction schedules may vary. Verify details before travelling.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const md = {
  h1: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "24px 0 10px",
    paddingBottom: "8px",
    borderBottom: "2px solid #e2e8f0",
  },
  h2: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "20px 0 8px",
    paddingBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
  },
  h3: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#334155",
    margin: "16px 0 6px",
  },
  h4: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#334155",
    margin: "12px 0 4px",
  },
  p: {
    margin: "0 0 10px",
    color: "#374151",
    lineHeight: 1.7,
  },
  ul: {
    margin: "0 0 12px 20px",
    color: "#374151",
    paddingLeft: "18px",
  },
  ol: {
    margin: "0 0 12px 20px",
    color: "#374151",
    paddingLeft: "18px",
  },
  li: {
    marginBottom: "6px",
    lineHeight: 1.6,
  },
  blockquote: {
    margin: "14px 0",
    padding: "10px 16px",
    borderLeft: "4px solid #0ea5e9",
    background: "#f0f9ff",
    borderRadius: "0 8px 8px 0",
    color: "#0369a1",
    fontStyle: "italic",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e2e8f0",
    margin: "20px 0",
  },
  strong: {
    fontWeight: 700,
    color: "#0f172a",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
    margin: "14px 0 18px",
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
    padding: "10px 14px",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 700,
    fontSize: "13px",
    borderBottom: "2px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
  },
  td: {
    padding: "9px 14px",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    verticalAlign: "top",
    color: "#374151",
    lineHeight: 1.5,
  },
  tr: {
    transition: "background 0.1s",
  },
};

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
    padding: "7px 14px",
    borderRadius: "8px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  savedBtn: {
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
    color: "#059669",
    cursor: "default",
  },
  savingBtn: {
    opacity: 0.75,
    cursor: "wait",
  },
  saveErrorNotice: {
    padding: "8px 12px",
    marginBottom: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#b91c1c",
    fontSize: "12.5px",
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
  },
  body: {
    padding: "clamp(24px, 4vw, 40px)",
    lineHeight: 1.8,
    color: "#334155",
    overflowWrap: "break-word",
  },
  notice: {
    padding: "12px 16px",
    marginBottom: "20px",
    borderRadius: "10px",
    background: "#f0f9ff",
    color: "#075985",
  },
  dayCard: {
    padding: "22px",
    marginBottom: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#ffffff",
  },
  overviewCard: {
    padding: "24px",
    marginBottom: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    background: "#f8fafc",
  },
  dayTitle: {
    fontSize: "20px",
    color: "#0369a1",
    marginBottom: "4px",
  },
  dayDate: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "12px",
  },
  dayNotes: {
    marginBottom: "14px",
    lineHeight: 1.7,
  },
  activitiesHeading: {
    fontSize: "15px",
    color: "#0f172a",
    marginBottom: "8px",
  },
  activitiesList: {
    paddingLeft: "22px",
    marginBottom: "14px",
  },
  activityItem: {
    marginBottom: "6px",
    lineHeight: 1.6,
    color: "#334155",
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
  markdownBody: {
    lineHeight: 1.8,
    color: "#334155",
  },
};
