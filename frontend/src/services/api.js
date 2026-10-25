const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
import { supabase } from "./supabaseClient";

/**
 * Retrieves a fresh, verified access token from the Supabase client.
 * If expired or missing, attempts to refresh the session using Supabase's supported method.
 */
export async function getFreshAccessToken() {
  // 1. Check existing session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  let session = sessionData?.session;

  // 2. If no session or error, try refreshing
  if (sessionError || !session?.access_token) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData?.session?.access_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    session = refreshData.session;
  }

  // 3. Check token expiry (refresh if expiring within 60s)
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  if (expiresAt && expiresAt - Date.now() < 60000) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData?.session?.access_token) {
      session = refreshData.session;
    }
  }

  const token = session?.access_token;
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return token.trim();
}

/**
 * Helper to execute an authenticated fetch request against VoyagePlan backend.
 * Automatically injects the fresh Bearer token, and handles 401 token refresh retry once.
 */
async function authenticatedFetch(endpoint, options = {}) {
  let token = await getFreshAccessToken();

  const makeRequest = (authToken) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`,
    };
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(token);

  // If 401 Unauthorized, refresh session once and retry
  if (response.status === 401) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshData?.session?.access_token) {
      token = refreshData.session.access_token.trim();
      response = await makeRequest(token);
    } else {
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorDetail = data?.detail || `Request failed with status ${response.status}`;
    throw new Error(errorDetail);
  }

  return data;
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function generateItinerary(formData) {
  const response = await fetch(`${API_BASE_URL}/api/itineraries/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `The backend returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const detail = data?.detail;

    let message;

    if (Array.isArray(detail)) {
      message = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg) {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((part) => part !== "body").join(" → ")
              : "";

            return field ? `${field}: ${item.msg}` : item.msg;
          }
          return JSON.stringify(item);
        })
        .join("; ");
    } else if (typeof detail === "string") {
      message = detail;
    } else if (detail != null) {
      message = JSON.stringify(detail);
    } else {
      message = `Request failed (HTTP ${response.status}).`;
    }

    throw new Error(message);
  }

  return data;
}

/* ─── Trip Persistence API ───────────────────────────────── */

export async function saveTrip(tripPayload) {
  return authenticatedFetch("/api/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tripPayload),
  });
}

export async function fetchUserTrips() {
  const data = await authenticatedFetch("/api/trips");
  return data || [];
}

export async function fetchTripById(tripId) {
  return authenticatedFetch(`/api/trips/${tripId}`);
}
