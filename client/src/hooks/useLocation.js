import { useCallback, useState } from "react";

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const message = "Location services are not available in this browser.";
      setError(message);
      throw new Error(message);
    }

    setIsFetchingLocation(true);
    setError("");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString(),
      };

      setLocation(nextLocation);
      return nextLocation;
    } catch (requestError) {
      const message = requestError.message || "Unable to fetch location.";
      setError(message);
      throw requestError;
    } finally {
      setIsFetchingLocation(false);
    }
  }, []);

  return {
    location,
    error,
    isFetchingLocation,
    requestLocation,
  };
}
