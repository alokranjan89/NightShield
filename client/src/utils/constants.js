export const APP_NAME = "NightShield";

export const SOS_STATUS = {
  idle: "Safe",
  holding: "Hold to trigger",
  sending: "Sending",
  sent: "Sent",
  error: "Error",
};

export const DEFAULT_SOS_DELAY = 3000;

export const SETTINGS_OPTIONS = {
  delays: [3000, 5000],
};

export const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contacts", label: "Contacts" },
  { to: "/settings", label: "Settings" },
];

export const DEFAULT_CONTACTS = [
  {
    id: "c1",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    relation: "Brother",
    isPrimary: true,
  },
  {
    id: "c2",
    name: "Riya Mehta",
    phone: "+91 99887 77665",
    relation: "Friend",
    isPrimary: false,
  },
];

export const DEFAULT_SETTINGS = {
  sosDelay: DEFAULT_SOS_DELAY,
  soundEnabled: true,
  cameraEnabled: true,
  locationEnabled: true,
};

export const MOCK_RECENT_ALERTS = [
  {
    id: "a1",
    type: "Manual SOS",
    status: "Resolved",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "a2",
    type: "Location Share",
    status: "Delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export const EMERGENCY_NUMBER = "112";
