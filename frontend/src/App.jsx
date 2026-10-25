import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TripForm from "./components/TripForm";
import ItineraryResult from "./components/ItineraryResult";
import Features from "./components/Features";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import MyTrips from "./components/MyTrips";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { checkBackendHealth, generateItinerary } from "./services/api";
import {
  BR_TAG_REGEX,
  renderWithBreaks,
  cleanItineraryContent,
  normalizeEscapedMarkdown,
  processActivities,
} from "./utils/markdownUtils";

// Re-export helpers for backwards compatibility with tests and callers
export {
  BR_TAG_REGEX,
  renderWithBreaks,
  cleanItineraryContent,
  normalizeEscapedMarkdown,
  processActivities,
};

const AVAILABLE_INTERESTS = [
  "Historical places",
  "Local food",
  "Nature",
  "Adventure",
  "Photography",
  "Shopping",
  "Culture",
  "Beaches",
];

function MainContent() {
  const [status, setStatus] = useState("Checking backend…");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeView, setActiveView] = useState("planner"); // 'planner' | 'mytrips'

  const [formData, setFormData] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    interests: [],
    budget: "moderate",
    pace: "balanced",
  });

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

    if (!formData.destination.trim()) {
      setError("Please enter a destination.");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      setError("Please select both your start and end dates.");
      return;
    }

    const startDate = new Date(`${formData.start_date}T00:00:00`);
    const endDate = new Date(`${formData.end_date}T00:00:00`);
    const tripDays =
      Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    if (tripDays < 1) {
      setError("End date must be on or after the start date.");
      return;
    }

    if (tripDays > 30) {
      setError("Your trip can be at most 30 days.");
      return;
    }

    if (formData.interests.length === 0) {
      setError("Please select at least one interest to tailor your itinerary.");
      return;
    }

    const payload = {
      destination: formData.destination.trim(),
      days: tripDays,
      start_date: formData.start_date,
      end_date: formData.end_date,
      interests: formData.interests,
      budget: formData.budget,
      pace: formData.pace,
      travelers: 1,
    };

    setLoading(true);

    try {
      const result = await generateItinerary(payload);

      setItinerary({
        ...result,
        days: result.days || [],
      });

      setTimeout(() => {
        document
          .getElementById("itinerary-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(
        err.message || "Unable to generate itinerary. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectSavedTrip(savedTrip) {
    if (!savedTrip) return;

    let tripContent = savedTrip.content || savedTrip.itinerary || savedTrip;

    // If tripContent is a JSON string, parse it
    if (typeof tripContent === "string") {
      try {
        const parsed = JSON.parse(tripContent);
        if (parsed && typeof parsed === "object") {
          tripContent = parsed;
        }
      } catch {
        tripContent = {
          destination: savedTrip.destination,
          itinerary: tripContent,
          days: [],
        };
      }
    }

    // Unwrap if nested in 'content' or 'raw'
    if (tripContent?.content && typeof tripContent.content === "object" && !tripContent.days) {
      tripContent = { ...tripContent, ...tripContent.content };
    }
    if (tripContent?.raw && typeof tripContent.raw === "object" && !tripContent.days) {
      tripContent = { ...tripContent, ...tripContent.raw };
    }

    // Ensure trip metadata is available in itinerary object
    const normalizedContent = {
      ...tripContent,
      destination: savedTrip.destination || tripContent.destination,
      start_date: savedTrip.start_date || tripContent.start_date,
      end_date: savedTrip.end_date || tripContent.end_date,
      budget: savedTrip.preferences?.budget || tripContent.budget,
      pace: savedTrip.preferences?.pace || tripContent.pace,
      day_count: tripContent.days?.length || tripContent.day_count || savedTrip.days,
    };

    // Populate form data
    setFormData((prev) => ({
      ...prev,
      destination: savedTrip.destination || prev.destination,
      start_date: savedTrip.start_date || prev.start_date,
      end_date: savedTrip.end_date || prev.end_date,
      budget: savedTrip.preferences?.budget || prev.budget,
      pace: savedTrip.preferences?.pace || prev.pace,
      interests: savedTrip.preferences?.interests || prev.interests,
    }));

    setItinerary(normalizedContent);
    setActiveView("planner");

    setTimeout(() => {
      document
        .getElementById("itinerary-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  return (
    <>
      <style>{globalCSS}</style>

      <div style={layoutStyles.appContainer}>
        {/* Navigation Bar */}
        <Navbar
          isConnected={isConnected}
          status={status}
          onOpenAuth={() => setAuthModalOpen(true)}
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
        />

        <main id="main-content">
          {activeView === "mytrips" ? (
            /* My Trips View */
            <MyTrips
              onSelectTrip={handleSelectSavedTrip}
              onBackToPlanner={() => setActiveView("planner")}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          ) : (
            /* Default Planner View */
            <>
              {/* Hero Section */}
              <Hero
                onStartPlanning={() => {
                  document
                    .getElementById("plan-trip")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />

              {/* Trip Planning Form */}
              <TripForm
                formData={formData}
                availableInterests={AVAILABLE_INTERESTS}
                onChange={handleChange}
                onInterestChange={handleInterestChange}
                onSubmit={handleSubmit}
                loading={loading}
                isConnected={isConnected}
                error={error}
              />

              {/* Generated Itinerary Section */}
              <ItineraryResult
                itinerary={itinerary}
                formData={formData}
                onOpenAuth={() => setAuthModalOpen(true)}
              />

              {/* Core Features & How it works */}
              <Features />
            </>
          )}
        </main>

        {/* Footer */}
        <Footer />

        {/* Auth Modal (Sign In / Sign Up) */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

const layoutStyles = {
  appContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fcfbf9",
    color: "#0f172a",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
};

const globalCSS = `
  /* CSS Reset & Defaults */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background: #fcfbf9;
    color: #0f172a;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* Accessible visible keyboard focus states */
  input:focus-visible,
  button:focus-visible {
    outline: 2px solid #0284c7 !important;
    outline-offset: 2px !important;
  }

  /* Hover transitions for interactive elements */
  button:hover:not(:disabled) {
    opacity: 0.95;
  }

  input:hover:not(:disabled) {
    border-color: #94a3b8 !important;
  }

  /* Keyframe animations */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Responsive helper styles for mobile menu & nav */
  @media (max-width: 768px) {
    nav [style*="desktopLinks"] {
      display: none !important;
    }
    nav [style*="mobileToggle"] {
      display: flex !important;
    }
  }

  /* Print specific stylesheet */
  @media print {
    nav, footer, #plan-trip, #features, #how-it-works, header, .actionButtons {
      display: none !important;
    }
    body, main, #itinerary-result, section {
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
  }
`;
