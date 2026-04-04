import { useEffect, useState } from "react";
import { resolveAlert, sendSOS } from "../services/api.js";
import { socket } from "../services/socket.js";
import { SOS_STATUS } from "../utils/constants.js";
import useLocation from "./useLocation.js";

export default function useSOS({
  setAlerts,
  contacts,
  settings,
  user,
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

  useEffect(() => {
    const handleIncomingAlert = (payload) => {
      setIncomingAlert(payload);
    };

    socket.on("sos:incoming", handleIncomingAlert);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("sos:incoming", handleIncomingAlert);
    };
  }, []);

  async function triggerSOS() {
    setError("");
    setIsSending(true);
    setIsSOSActive(true);
    setStatus(SOS_STATUS.sending);

    try {
      let nextLocation = null;
      let nextLocationError = "";

      if (settings.locationEnabled) {
        try {
          nextLocation = await requestLocation();
        } catch (locationRequestError) {
          nextLocationError =
            locationRequestError.message || "Location could not be fetched.";
        }
      }

      const payload = {
        user,
        contacts,
        location: nextLocation,
        locationError: nextLocationError,
        settings,
        createdAt: new Date().toISOString(),
      };

      const alert = await sendSOS(payload);
      setActiveAlert(alert);
      setAlerts((current) => [alert, ...current]);
      socket.emit("sos:triggered", alert);
      setStatus(SOS_STATUS.sent);
      if (nextLocationError) {
        setError("SOS sent without live location.");
      }
      return alert;
    } catch (requestError) {
      setError(requestError.message || "Unable to send SOS.");
      setStatus(SOS_STATUS.error);
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

  function resolveSOS(alertId) {
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
    activeAlert,
    triggerSOS,
    cancelSOS,
    resolveSOS,
    resetSOSState,
    dismissIncomingAlert,
  };
}
