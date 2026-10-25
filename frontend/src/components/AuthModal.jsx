import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setConfirmationMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        const data = await signUp(email, password, {
          data: { full_name: fullName.trim() },
        });

        // Supabase behavior: If email confirmation is enabled, session is null
        if (data?.user && !data?.session) {
          setConfirmationMessage(
            "Account created! Please check your email to confirm your registration before signing in."
          );
        } else {
          onClose();
        }
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsSignUp((prev) => !prev);
    setError("");
    setConfirmationMessage("");
  }

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.icon}>{isSignUp ? "✨" : "🔑"}</span>
            <h3 style={styles.title}>
              {isSignUp ? "Create Your Account" : "Sign In to VoyagePlan"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {confirmationMessage ? (
          <div style={styles.successBox}>
            <p style={styles.successTitle}>📩 Check your email</p>
            <p style={styles.successText}>{confirmationMessage}</p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setConfirmationMessage("");
              }}
              style={styles.primaryBtn}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.errorBox} role="alert">
                <span style={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <div style={styles.field}>
                <label style={styles.label} htmlFor="auth-fullname">
                  Full Name
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  placeholder="e.g. Alex Traveler"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label} htmlFor="auth-email">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                style={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>

            <div style={styles.footer}>
              <span style={styles.switchText}>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account yet?"}
              </span>
              <button
                type="button"
                onClick={toggleMode}
                style={styles.switchBtn}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "440px",
    padding: "28px",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
    border: "1px solid #e2e8f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  icon: {
    fontSize: "20px",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1.5px solid #cbd5e1",
    fontSize: "14.5px",
    background: "#f8fafc",
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  primaryBtn: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    color: "#ffffff",
    border: "none",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
    transition: "transform 0.1s ease",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "12px",
    fontSize: "13px",
  },
  switchText: {
    color: "#64748b",
  },
  switchBtn: {
    background: "transparent",
    border: "none",
    color: "#0284c7",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    color: "#b91c1c",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  errorIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  successBox: {
    textAlign: "center",
    padding: "12px 4px",
  },
  successTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "8px",
  },
  successText: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: "20px",
  },
};
