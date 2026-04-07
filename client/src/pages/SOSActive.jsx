import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSOSContext from "../hooks/useSOSContext.js";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function Routing({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    const routing = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    }).addTo(map);

    return () => {
      map.removeControl(routing);
    };
  }, [from, map, to]);

  return null;
}

function normalizeLocation(location) {
  if (!location) {
    return null;
  }

  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return { lat, lng };
}

function getAlertLocation(alert) {
  if (!alert) {
    return null;
  }

  return (
    normalizeLocation(alert.location) ||
    normalizeLocation(alert.sos?.location) ||
    normalizeLocation(alert.payload?.location)
  );
}

function getAlertTitle(alert, isSender) {
  if (isSender) {
    return alert?.payload?.user?.name || "Your emergency alert";
  }

  return (
    alert?.sender ||
    alert?.payload?.user?.name ||
    "Nearby emergency alert"
  );
}

function getAlertSettings(alert) {
  return {
    soundEnabled:
      alert?.payload?.settings?.soundEnabled ??
      alert?.settings?.soundEnabled ??
      true,
    cameraEnabled:
      alert?.payload?.settings?.cameraEnabled ??
      alert?.settings?.cameraEnabled ??
      false,
  };
}

function getReceiverDetails(alert) {
  return {
    senderName:
      alert?.sender || alert?.payload?.user?.name || "Unknown sender",
    senderEmail:
      alert?.senderEmail || alert?.payload?.user?.email || "Not available",
    source:
      alert?.source || alert?.payload?.source || "manual",
    targetContactName:
      alert?.targetContact?.name || alert?.payload?.targetContact?.name || "Not specified",
    contactsNotified:
      alert?.contactsNotified ?? alert?.payload?.contacts?.length ?? 0,
    nearbyUsers:
      alert?.nearbyUsers ?? 0,
  };
}

export default function SOSActive() {
  const {
    activeAlert,
    incomingAlert,
    cancelSOS,
    resolveSOS,
    dismissIncomingAlert,
  } = useSOSContext();
  const navigate = useNavigate();
  const [myLocation, setMyLocation] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const isSender = Boolean(activeAlert);
  const alert = activeAlert || incomingAlert;
  const target = useMemo(() => getAlertLocation(alert), [alert]);
  const title = useMemo(() => getAlertTitle(alert, isSender), [alert, isSender]);
  const sessionSettings = useMemo(() => getAlertSettings(alert), [alert]);
  const receiverDetails = useMemo(() => getReceiverDetails(alert), [alert]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setMyLocation(null);
      }
    );
  }, []);

  useEffect(() => {
    if (
      !alert ||
      !isSender ||
      !sessionSettings.soundEnabled ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return undefined;
    }

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    const intervalId = window.setInterval(() => {
      const nextFrequency = oscillator.frequency.value === 880 ? 660 : 880;
      oscillator.frequency.setValueAtTime(nextFrequency, audioContext.currentTime);
    }, 650);

    return () => {
      window.clearInterval(intervalId);

      try {
        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + 0.15
        );
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch {
        return;
      } finally {
        window.setTimeout(() => {
          audioContext.close().catch(() => {});
        }, 250);
      }
    };
  }, [alert, isSender, sessionSettings.soundEnabled]);

  useEffect(() => {
    if (
      !alert ||
      !isSender ||
      !sessionSettings.cameraEnabled ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return undefined;
    }

    let isCancelled = false;

    async function startCamera() {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (error) {
        setCameraReady(false);
        setCameraError(error.message || "Camera permission was denied.");
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [alert, isSender, sessionSettings.cameraEnabled]);

  function handleExit() {
    if (isSender && activeAlert?.id) {
      resolveSOS(activeAlert.id);
    } else if (incomingAlert) {
      dismissIncomingAlert();
    } else {
      cancelSOS();
    }

    navigate("/");
  }

  if (!alert) {
    return <div className="p-5 text-white">No active SOS</div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <h1 className="py-3 text-center text-xl font-bold">
        {isSender ? "Emergency Session" : "Nearby Emergency Alert"}
      </h1>

      <div className="px-4 text-center text-sm text-slate-300">{title}</div>

      <div className="grid gap-4 px-4 pb-4 pt-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-[26rem] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
          {isSender ? (
            <div className="flex h-full min-h-[26rem] flex-col justify-center p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
                SOS Active
              </p>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
                Emergency session in progress
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Alarm</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {sessionSettings.soundEnabled ? "On" : "Off"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Camera</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {sessionSettings.cameraEnabled ? "On" : "Off"}
                  </p>
                </div>
              </div>
            </div>
          ) : target ? (
            <div className="h-[26rem] w-full md:h-[78vh]">
              <MapContainer center={target} zoom={13} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={target}>
                  <Popup>Person in danger</Popup>
                </Marker>

                {myLocation && (
                  <Marker position={myLocation}>
                    <Popup>You</Popup>
                  </Marker>
                )}

                {myLocation && <Routing from={myLocation} to={target} />}
              </MapContainer>
            </div>
          ) : (
            <div className="flex h-full min-h-[26rem] items-center justify-center p-6 text-center text-slate-300">
              Location unavailable.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-3xl p-5 ${
              isSender
                ? "border border-rose-500/20 bg-rose-500/10"
                : "border border-sky-500/20 bg-sky-500/10"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              {isSender ? "Sender" : "Alert"}
            </p>
            <p className="mt-3 text-sm text-white/90">
              {isSender
                ? `Alarm ${sessionSettings.soundEnabled ? "active" : "disabled"}`
                : `${receiverDetails.senderName} triggered an SOS nearby`}
            </p>
            <p className="mt-2 text-sm text-white/90">
              {isSender
                ? `Camera ${sessionSettings.cameraEnabled ? "active" : "disabled"}`
                : "Follow the route if it is safe"}
            </p>
          </div>

          {isSender ? (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="font-semibold">Camera</p>
              </div>

              <div className="aspect-video w-full bg-black">
                {sessionSettings.cameraEnabled ? (
                  cameraError ? (
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-amber-200">
                      {cameraError}
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-400">
                    Camera disabled.
                  </div>
                )}
              </div>

              {sessionSettings.cameraEnabled && cameraReady && !cameraError ? (
                <p className="px-5 py-3 text-xs text-emerald-300">
                  Camera active
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <p className="font-semibold">Sender Details</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Name</p>
                  <p className="mt-2 text-sm font-medium text-white">{receiverDetails.senderName}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</p>
                  <p className="mt-2 text-sm font-medium text-white break-all">{receiverDetails.senderEmail}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trigger</p>
                  <p className="mt-2 text-sm font-medium text-white capitalize">{receiverDetails.source.replace(/-/g, " ")}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Primary Contact</p>
                  <p className="mt-2 text-sm font-medium text-white">{receiverDetails.targetContactName}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!isSender && target ? (
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="w-full rounded-xl bg-rose-500 py-3"
              >
                Open in Google Maps
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleExit}
              className="w-full rounded-xl border py-3"
            >
              {isSender ? "End SOS Session" : "Dismiss Alert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
