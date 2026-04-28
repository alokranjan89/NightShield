import { getAuth } from "@clerk/express";

export function requireAuthenticatedUser(req, res, next) {
  const auth = getAuth(req);

  if (!auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.auth = auth;
  return next();
}

export function optionalAuthenticatedUser(req, res, next) {
  const auth = getAuth(req);

  if (auth?.userId) {
    req.auth = auth;
  }

  return next();
}

export function requireMatchingBodyUserId(req, res, next) {
  const authUserId = req.auth?.userId;
  const bodyUserId = req.body?.userId;

  if (!authUserId || !bodyUserId || authUserId !== bodyUserId) {
    return res.status(403).json({ message: "Forbidden: user mismatch" });
  }

  return next();
}

export function allowGuestOrMatchingBodyUserId(req, res, next) {
  const authUserId = req.auth?.userId;
  const bodyUserId = req.body?.userId;

  if (!bodyUserId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (authUserId) {
    if (authUserId !== bodyUserId) {
      return res.status(403).json({ message: "Forbidden: user mismatch" });
    }

    return next();
  }

  if (bodyUserId === "guest-user" || String(bodyUserId).startsWith("guest-")) {
    return next();
  }

  return res.status(401).json({ message: "Sign in or use a guest session." });
}

export function requireMatchingParamUserId(req, res, next) {
  const authUserId = req.auth?.userId;
  const paramUserId = req.params?.userId;

  if (!authUserId || !paramUserId || authUserId !== paramUserId) {
    return res.status(403).json({ message: "Forbidden: user mismatch" });
  }

  return next();
}
