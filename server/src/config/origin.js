export function buildAllowedOrigins() {
  return (process.env.CORS_ORIGIN || process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.length === 0) {
    return false;
  }

  return allowedOrigins.includes(origin);
}
