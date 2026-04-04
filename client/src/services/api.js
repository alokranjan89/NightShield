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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const USE_MOCK_API =
  API_BASE_URL === "" || import.meta.env.VITE_USE_MOCK_API === "true";

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

async function requestJson(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(body?.message || `Request failed with status ${response.status}.`);
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
      cameraEnabled: settings.cameraEnabled,
      locationEnabled: settings.locationEnabled,
    },
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
      isPrimary: contact.isPrimary,
    })),
    targetContact: targetContact
      ? {
          id: targetContact.id,
          name: targetContact.name,
          phone: targetContact.phone,
          relation: targetContact.relation,
          isPrimary: targetContact.isPrimary,
        }
      : null,
  };
}

export async function sendSOS(data) {
  if (!USE_MOCK_API) {
    return requestJson("/api/sos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  await new Promise((resolve) => window.setTimeout(resolve, 1200));

  const currentAlerts = readStorage(STORAGE_KEYS.alerts, MOCK_RECENT_ALERTS);
  const nextAlert = {
    id: `alert-${Date.now()}`,
    type: "Emergency SOS",
    status: "Active",
    createdAt: new Date().toISOString(),
    payload: data,
  };

  writeStorage(STORAGE_KEYS.alerts, [nextAlert, ...currentAlerts]);
  return nextAlert;
}

export function saveContacts(contacts) {
  return writeStorage(STORAGE_KEYS.contacts, contacts);
}

export function saveSettings(settings) {
  return writeStorage(STORAGE_KEYS.settings, settings);
}

export function resolveAlert(alerts, alertId) {
  const nextAlerts = alerts.map((alert) =>
    alert.id === alertId ? { ...alert, status: "Resolved" } : alert
  );

  return writeStorage(STORAGE_KEYS.alerts, nextAlerts);
}
