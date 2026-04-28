import {
  DEFAULT_CONTACTS,
  DEFAULT_SETTINGS,
  MOCK_RECENT_ALERTS,
} from "../utils/constants.js";

const STORAGE_KEYS = {
  contacts: "nightshield-contacts",
  settings: "nightshield-settings",
  alerts: "nightshield-alerts",
};

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const API_BASE_URL =
  configuredApiBaseUrl || (import.meta.env.DEV ? "http://localhost:5000" : "");
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export function isGuestUserId(userId) {
  return !userId || userId === "guest-user" || String(userId).startsWith("guest-");
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return value;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function normalizeAlertResponse(response, payload) {
  return {
    id: response?.id || response?.sos?._id || `alert-${Date.now()}`,
    type: response?.type || "Emergency SOS",
    status: response?.status || "Active",
    createdAt:
      response?.createdAt || response?.sos?.createdAt || new Date().toISOString(),
    message: response?.message || "SOS created and alerts sent",
    payload: response?.payload || payload,
    sos: response?.sos || null,
    contactsNotified: response?.contactsNotified || 0,
    nearbyUsers: response?.nearbyUsers || 0,
    evidence: response?.evidence || response?.sos?.evidence || [],
    location:
      response?.location ||
      response?.sos?.location ||
      payload?.location ||
      null,
  };
}

async function requestJson(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured.");
  }

  const authToken = options.getToken ? await options.getToken() : "";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed with status ${response.status}.`
    );
  }

  return body;
}

export function getInitialData() {
  return {
    contacts: readStorage(STORAGE_KEYS.contacts, DEFAULT_CONTACTS),
    settings: readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    alerts: readStorage(STORAGE_KEYS.alerts, MOCK_RECENT_ALERTS),
  };
}

export function buildSOSPayload({
  user,
  contacts,
  location,
  locationError,
  settings,
  source = "manual",
  targetContact = null,
}) {
  return {
    userId: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    source,
    createdAt: new Date().toISOString(),
    location,
    locationError,
    settings: {
      sosDelay: settings.sosDelay,
      soundEnabled: settings.soundEnabled,
      cameraEnabled: !isGuestUserId(user.id) && settings.cameraEnabled,
      locationEnabled: settings.locationEnabled,
    },
    contacts: contacts.map((contact) => ({
      id: contact.id,
      contactUserId: contact.contactUserId || "",
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
      isPrimary: contact.isPrimary,
    })),
    targetContact: targetContact
      ? {
          id: targetContact.id,
          contactUserId: targetContact.contactUserId || "",
          name: targetContact.name,
          phone: targetContact.phone,
          relation: targetContact.relation,
          isPrimary: targetContact.isPrimary,
        }
      : null,
  };
}

export async function sendSOS(data, getToken) {
  if (!USE_MOCK_API) {
    const response = await requestJson("/api/sos", {
      method: "POST",
      body: JSON.stringify(data),
      getToken,
    });

    return normalizeAlertResponse(response, data);
  }

  await new Promise((resolve) => window.setTimeout(resolve, 1200));

  const currentAlerts = readStorage(STORAGE_KEYS.alerts, MOCK_RECENT_ALERTS);
  const nextAlert = normalizeAlertResponse(
    {
      id: `alert-${Date.now()}`,
      type: "Emergency SOS",
      status: "Active",
      createdAt: new Date().toISOString(),
      payload: data,
      location: data.location,
    },
    data
  );

  writeStorage(STORAGE_KEYS.alerts, [nextAlert, ...currentAlerts]);
  return nextAlert;
}

export async function resolveSOSSession(alertId, getToken) {
  if (!API_BASE_URL || !alertId) {
    return null;
  }

  return requestJson(`/api/sos/${alertId}/resolve`, {
    method: "PATCH",
    getToken,
  });
}

export async function fetchSOSHistory(userId, getToken) {
  if (!API_BASE_URL || isGuestUserId(userId)) {
    return [];
  }

  const response = await requestJson(`/api/sos/history/${userId}`, {
    getToken,
  });
  return Array.isArray(response)
    ? response.map((item) => normalizeAlertResponse(item, item.payload || null))
    : [];
}

export async function uploadSOSEvidence({
  file,
  userId,
  sosId,
  mediaType,
  captureAt,
  getToken,
}) {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured.");
  }

  const authToken = getToken ? await getToken() : "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  formData.append("sosId", sosId || "session");
  formData.append("mediaType", mediaType);
  formData.append("captureAt", captureAt || new Date().toISOString());

  const response = await fetch(`${API_BASE_URL}/api/sos/evidence`, {
    method: "POST",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    body: formData,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(
      body?.message || body?.error || `Upload failed with status ${response.status}.`
    );
  }

  return body;
}

export async function saveUserLocation({ userId, location, getToken }) {
  if (!API_BASE_URL || isGuestUserId(userId) || !location) {
    return null;
  }

  return requestJson("/api/users/location", {
    method: "POST",
    body: JSON.stringify({
      userId,
      lat: location.lat ?? location.latitude,
      lng: location.lng ?? location.longitude,
    }),
    getToken,
  });
}

export async function syncContactsToServer({ userId, contacts, getToken }) {
  if (!API_BASE_URL || isGuestUserId(userId)) {
    return null;
  }

  return requestJson(`/api/contacts/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ userId, contacts }),
    getToken,
  });
}

export function saveContacts(contacts) {
  return writeStorage(STORAGE_KEYS.contacts, contacts);
}

export function saveSettings(settings) {
  return writeStorage(STORAGE_KEYS.settings, settings);
}

export function saveAlerts(alerts) {
  return writeStorage(STORAGE_KEYS.alerts, alerts);
}

export function resolveAlert(alerts, alertId) {
  const nextAlerts = alerts.map((alert) =>
    alert.id === alertId ? { ...alert, status: "Resolved" } : alert
  );

  return saveAlerts(nextAlerts);
}
