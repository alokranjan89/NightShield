import { useCallback, useEffect, useState } from "react";
import {
  buildSOSPayload,
  resolveAlert,
  resolveSOSSession,
  saveUserLocation,
  sendSOS,
} from "../services/api.js";
import { unlockAlarmAudio } from "../utils/alarm.js";
import { SOS_STATUS } from "../utils/constants.js";
import useLocation from "./useLocation.js";

export default function useSOS({
  setAlerts,
  contacts,
  settings,
  user,
  getToken,
}) {
  const {
    location,
    error: locationError,
    isFetchingLocation,
    requestLocation,
  } = useLocation();
  const [status, setStatus] = useState(SOS_STATUS.idle);
  const [error, setError] = useState("");
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  const syncUserLocation = useCallback(async () => {
    if (!user?.id || user.id === "guest-user" || !settings.locationEnabled) {
      return false;
    }

    try {
      const nextLocation = await requestLocation();
      await saveUserLocation({
        userId: user.id,
        location: nextLocation,
        getToken,
      });
      return true;
    } catch {
      return false;
    }
  }, [getToken, requestLocation, settings.locationEnabled, user?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function runSync() {
      if (isCancelled) {
        return;
      }

      await syncUserLocation();
    }

    void runSync();

    const intervalId = window.setInterval(() => {
      void runSync();
    }, 30000);

    const handleWindowFocus = () => {
      void runSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runSync();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncUserLocation]);

  function beginHold() {
    if (isSending || isSOSActive) {
      return;
    }

    void unlockAlarmAudio();
    setError("");
    setStatus(SOS_STATUS.holding);
  }

  function stopHold() {
    if (status === SOS_STATUS.holding) {
      setStatus(SOS_STATUS.idle);
    }
  }

  async function retryLocation() {
    setError("");
    const nextLocation = await requestLocation();
    await saveUserLocation({
      userId: user.id,
      location: nextLocation,
      getToken,
    });
    if (!isSOSActive && status === SOS_STATUS.error) {
      setStatus(SOS_STATUS.idle);
    }
    return nextLocation;
  }

  async function triggerSOS(options = {}) {
    setError("");
    setIsSending(true);
    setIsSOSActive(true);
    setStatus(SOS_STATUS.sending);

    try {
      if (settings.soundEnabled) {
        await unlockAlarmAudio();
      }

      let nextLocation = null;
      let nextLocationError = "";

      if (settings.locationEnabled) {
        try {
          nextLocation = await requestLocation();
          await saveUserLocation({
            userId: user.id,
            location: nextLocation,
            getToken,
          });
        } catch (locationRequestError) {
          nextLocationError =
            locationRequestError.message || "Location could not be fetched.";
        }
      }

      const payload = buildSOSPayload({
        user,
        contacts,
        location: nextLocation,
        locationError: nextLocationError,
        settings,
        source: options.source || "manual",
        targetContact: options.targetContact || null,
      });

      const alert = await sendSOS(payload, getToken);
      setActiveAlert(alert);
      setAlerts((current) => [alert, ...current]);
      setStatus(SOS_STATUS.sent);

      if (nextLocationError) {
        setError("SOS sent without live location.");
      }

      return alert;
    } catch (requestError) {
      setError(requestError.message || "Unable to send SOS.");
      setStatus(SOS_STATUS.error);
      setIsSOSActive(false);
      setActiveAlert(null);
      throw requestError;
    } finally {
      setIsSending(false);
    }
  }

  function cancelSOS() {
    setIsSOSActive(false);
    setActiveAlert(null);
    setStatus(SOS_STATUS.idle);
    setError("");
  }

  async function resolveSOS(alertId) {
    try {
      await resolveSOSSession(alertId, getToken);
    } catch {
      // Keep local cleanup even if the resolve request fails.
    }

    setAlerts((current) => resolveAlert(current, alertId));
    setIsSOSActive(false);
    setActiveAlert(null);
    setStatus(SOS_STATUS.idle);
    setError("");
  }

  function dismissIncomingAlert() {
    setIncomingAlert(null);
  }

  function resetSOSState() {
    setActiveAlert(null);
    setIsSOSActive(false);
    setStatus(SOS_STATUS.idle);
    setError("");
  }

  const friendlyLocationError = locationError
    ? "Location access is off right now. You can still send an alert and update permissions later."
    : "";

  return {
    status,
    error: error || friendlyLocationError,
    isSOSActive,
    isSending,
    location,
    isFetchingLocation,
    incomingAlert,
    setIncomingAlert,
    activeAlert,
    beginHold,
    stopHold,
    retryLocation,
    triggerSOS,
    cancelSOS,
    resolveSOS,
    resetSOSState,
    dismissIncomingAlert,
  };
}
