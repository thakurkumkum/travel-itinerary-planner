import React from "react";

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

export default function TripForm({
  formData,
  availableInterests,
  onChange,
  onInterestChange,
  onSubmit,
  loading,
  isConnected,
  error,
}) {
  return (
    <section
      id="plan-trip"
      style={styles.section}
      aria-labelledby="form-heading"
    >
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTag}>
            <span>✈️ Plan Your Adventure</span>
          </div>

          <h2 id="form-heading" style={styles.title}>
            Where Would You Like to Go?
          </h2>

          <p style={styles.subtitle}>
            Fill in your destination, travel dates, budget, and interests. Our
            AI will create a personalized travel itinerary for you.
          </p>
        </div>

        <div style={styles.card}>
          <form onSubmit={onSubmit}>
            {/* Destination and travel dates */}
            <div style={styles.formGrid}>
              {/* Destination */}
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="destination">
                  <span style={styles.labelText}>Destination</span>
                  <span style={styles.labelHint}>City, region, or state</span>
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    📍
                  </span>

                  <input
                    id="destination"
                    name="destination"
                    type="text"
                    value={formData.destination}
                    onChange={onChange}
                    placeholder="e.g. Jaipur, Manali, Goa, Kyoto"
                    minLength={2}
                    maxLength={120}
                    required
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              {/* Start date */}
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="start_date">
                  <span style={styles.labelText}>Start Date</span>
                  <span style={styles.labelHint}>Trip begins</span>
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    🗓️
                  </span>

                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={onChange}
                    max={formData.end_date || undefined}
                    required
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              {/* End date */}
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="end_date">
                  <span style={styles.labelText}>End Date</span>
                  <span style={styles.labelHint}>Up to 30 days total</span>
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    📅
                  </span>

                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={onChange}
                    min={formData.start_date || undefined}
                    required
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              {/* Budget category */}
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="budget">
                  <span style={styles.labelText}>Budget Category</span>
                  <span style={styles.labelHint}>
                    Choose your travel budget
                  </span>
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    💰
                  </span>

                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={onChange}
                    required
                    style={styles.inputWithIcon}
                  >
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              {/* Travel pace */}
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="pace">
                  <span style={styles.labelText}>Travel Pace</span>
                  <span style={styles.labelHint}>
                    How busy should your trip be?
                  </span>
                </label>

                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    🚶
                  </span>

                  <select
                    id="pace"
                    name="pace"
                    value={formData.pace}
                    onChange={onChange}
                    required
                    style={styles.inputWithIcon}
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="balanced">Balanced</option>
                    <option value="packed">Packed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interests */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.fieldsetLegend}>
                <span style={styles.labelText}>
                  What are you interested in?
                </span>
                <span style={styles.labelHint}>
                  Select at least one interest
                </span>
              </legend>

              <div style={styles.chipsGrid}>
                {availableInterests.map((interest) => {
                  const selected = formData.interests.includes(interest);

                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => onInterestChange(interest)}
                      style={{
                        ...styles.chip,
                        ...(selected ? styles.chipSelected : {}),
                      }}
                      aria-pressed={selected}
                    >
                      <span style={styles.chipIcon} aria-hidden="true">
                        {INTEREST_ICONS[interest] || "✨"}
                      </span>

                      <span style={styles.chipText}>{interest}</span>

                      {selected && (
                        <span style={styles.chipCheck} aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Error message */}
            {error && (
              <div role="alert" style={styles.errorBox}>
                <span style={styles.errorIcon} aria-hidden="true">
                  ⚠️
                </span>

                <div style={styles.errorContent}>
                  <strong style={styles.errorTitle}>Unable to proceed</strong>

                  <p style={styles.errorDesc}>{error}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div style={styles.actionRow}>
              <button
                type="submit"
                disabled={loading || !isConnected}
                style={{
                  ...styles.submitBtn,
                  opacity: loading || !isConnected ? 0.65 : 1,
                  cursor: loading || !isConnected ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner} aria-hidden="true" />
                    <span>Generating Your Itinerary…</span>
                  </>
                ) : (
                  <span>✨ Generate Personalized Itinerary</span>
                )}
              </button>

              {!isConnected && (
                <p style={styles.connectionWarning}>
                  ⚠️ FastAPI backend appears offline. Please ensure{" "}
                  <code>uvicorn app.main:app</code> is running.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "64px 24px 80px",
    background: "#ffffff",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "36px",
  },
  headerTag: {
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
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    maxWidth: "640px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  card: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "clamp(24px, 4vw, 44px)",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow:
      "0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 20px 40px -10px rgba(15, 23, 42, 0.06)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
    marginBottom: "28px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "8px",
  },
  labelText: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1e293b",
    letterSpacing: "-0.2px",
  },
  labelHint: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    fontSize: "16px",
    pointerEvents: "none",
    opacity: 0.85,
  },
  inputWithIcon: {
    width: "100%",
    padding: "13px 14px 13px 42px",
    borderRadius: "12px",
    border: "1.5px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: 500,
    outline: "none",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
  },
  fieldset: {
    border: "none",
    padding: 0,
    margin: "0 0 28px",
  },
  fieldsetLegend: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "14px",
    padding: 0,
  },
  chipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "10px",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "left",
    userSelect: "none",
  },
  chipSelected: {
    border: "1.5px solid #0284c7",
    background: "rgba(2, 132, 199, 0.08)",
    color: "#0369a1",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)",
  },
  chipIcon: {
    fontSize: "16px",
    lineHeight: 1,
  },
  chipText: {
    flex: 1,
  },
  chipCheck: {
    fontSize: "12px",
    fontWeight: 800,
    color: "#0284c7",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px 18px",
    borderRadius: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    marginBottom: "24px",
  },
  errorIcon: {
    fontSize: "20px",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "2px",
  },
  errorContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  errorTitle: {
    fontSize: "14px",
    fontWeight: 700,
  },
  errorDesc: {
    fontSize: "13px",
    color: "#b91c1c",
    margin: 0,
    lineHeight: 1.4,
  },
  actionRow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
  },
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "15px 24px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "0.2px",
    boxShadow: "0 4px 16px rgba(2, 132, 199, 0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  spinner: {
    display: "inline-block",
    width: "18px",
    height: "18px",
    border: "2.5px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
    flexShrink: 0,
  },
  connectionWarning: {
    fontSize: "12.5px",
    color: "#b45309",
    textAlign: "center",
    margin: "4px 0 0",
  },
};
