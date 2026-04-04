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

export function getInitialData() {
  return {
    contacts: readStorage(STORAGE_KEYS.contacts, DEFAULT_CONTACTS),
    settings: readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    alerts: readStorage(STORAGE_KEYS.alerts, MOCK_RECENT_ALERTS),
  };
}

export async function sendSOS(data) {
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
