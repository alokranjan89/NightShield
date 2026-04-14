import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import useSOSContext from "../hooks/useSOSContext.js";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import { startAlarm, stopAlarm } from "../utils/alarm.js";
import { uploadSOSEvidence } from "../services/api.js";

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
    return alert?.payload?.user?.name || "Your SOS";
  }

  return (
    alert?.sender ||
    alert?.payload?.user?.name ||
    "Nearby SOS"
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
  const { getToken } = useAuth();
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
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingFileName, setRecordingFileName] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [photoCaptures, setPhotoCaptures] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const snapshotIntervalRef = useRef(null);

  const isSender = Boolean(activeAlert);
  const alert = activeAlert || incomingAlert;
  const target = useMemo(() => getAlertLocation(alert), [alert]);
  const title = useMemo(() => getAlertTitle(alert, isSender), [alert, isSender]);
  const sessionSettings = useMemo(() => getAlertSettings(alert), [alert]);
  const receiverDetails = useMemo(() => getReceiverDetails(alert), [alert]);
  const evidenceSessionId = activeAlert?.id || alert?.id || "session";

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [recordingUrl]);

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
      stopAlarm();
      return undefined;
    }

    void startAlarm();

    return () => {
      stopAlarm();
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

    async function uploadEvidence(file, metadata) {
      if (!activeAlert?.payload?.user?.id) {
        throw new Error("Missing sender identity for evidence upload.");
      }

      return uploadSOSEvidence({
        file,
        userId: activeAlert.payload.user.id,
        sosId: evidenceSessionId,
        getToken,
        ...metadata,
      });
    }

    async function startRecording(stream) {
      if (typeof MediaRecorder === "undefined") {
        return;
      }

      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const supportedMimeType = mimeTypes.find((mimeType) =>
        MediaRecorder.isTypeSupported(mimeType)
      );

      try {
        recordingChunksRef.current = [];
        const recorder = supportedMimeType
          ? new MediaRecorder(stream, { mimeType: supportedMimeType })
          : new MediaRecorder(stream);

        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
        };
        recorder.onstart = () => {
          setIsRecording(true);
        };
        recorder.onstop = () => {
          const nextBlob = new Blob(recordingChunksRef.current, {
            type: recorder.mimeType || "video/webm",
          });

          if (nextBlob.size === 0) {
            setIsRecording(false);
            return;
          }

          setRecordingUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }

            return URL.createObjectURL(nextBlob);
          });
          const nextFileName = `nightshield-sos-${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.webm`;
          setRecordingFileName(nextFileName);
          setIsUploadingVideo(true);
          const videoFile = new File([nextBlob], nextFileName, {
            type: nextBlob.type || "video/webm",
          });

          void uploadEvidence(videoFile, {
            mediaType: "video",
            captureAt: new Date().toISOString(),
          })
            .then((result) => {
              setUploadedVideo(result);
            })
            .catch((error) => {
              setCameraError(error.message || "Video upload failed.");
            })
            .finally(() => {
              setIsUploadingVideo(false);
            });
          setIsRecording(false);
        };

        recorder.start(1000);
      } catch (error) {
        setCameraError(error.message || "Unable to start SOS recording.");
        setIsRecording(false);
      }
    }

    async function captureSnapshot() {
      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;

      if (!videoElement || !canvasElement || videoElement.readyState < 2) {
        return;
      }

      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;

      if (!width || !height) {
        return;
      }

      canvasElement.width = width;
      canvasElement.height = height;
      const context = canvasElement.getContext("2d");

      if (!context) {
        return;
      }

      context.drawImage(videoElement, 0, 0, width, height);

      const dataUrl = canvasElement.toDataURL("image/jpeg", 0.82);
      const captureId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const capturedAt = new Date().toISOString();

      setPhotoCaptures((current) => [
        {
          id: captureId,
          capturedAt,
          previewUrl: dataUrl,
          status: "uploading",
          cloudUrl: "",
          error: "",
        },
        ...current,
      ].slice(0, 6));

      const blob = await new Promise((resolve) => {
        canvasElement.toBlob(
          (nextBlob) => resolve(nextBlob),
          "image/jpeg",
          0.82
        );
      });

      if (!blob) {
        setPhotoCaptures((current) =>
          current.map((capture) =>
            capture.id === captureId
              ? { ...capture, status: "error", error: "Photo capture failed." }
              : capture
          )
        );
        return;
      }

      const photoFile = new File([blob], `nightshield-photo-${captureId}.jpg`, {
        type: "image/jpeg",
      });

      try {
        const result = await uploadEvidence(photoFile, {
          mediaType: "photo",
          captureAt: capturedAt,
        });

        setPhotoCaptures((current) =>
          current.map((capture) =>
            capture.id === captureId
              ? {
                  ...capture,
                  status: "uploaded",
                  cloudUrl: result.url,
                  cloudId: result.publicId,
                }
              : capture
          )
        );
      } catch (error) {
        setPhotoCaptures((current) =>
          current.map((capture) =>
            capture.id === captureId
              ? {
                  ...capture,
                  status: "error",
                  error: error.message || "Photo upload failed.",
                }
              : capture
          )
        );
      }
    }

    async function startCamera() {
      try {
        setCameraError("");
        setPhotoCaptures([]);
        setUploadedVideo(null);
        setRecordingUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return "";
        });
        setRecordingFileName("");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
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

        await startRecording(stream);
        void captureSnapshot();
        snapshotIntervalRef.current = window.setInterval(() => {
          void captureSnapshot();
        }, 5000);
      } catch (error) {
        setCameraReady(false);
        setCameraError(error.message || "Camera permission was denied.");
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      if (snapshotIntervalRef.current) {
        window.clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      recorderRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, [
    activeAlert?.payload?.user?.id,
    alert,
    evidenceSessionId,
    getToken,
    isSender,
    sessionSettings.cameraEnabled,
  ]);

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
    return <div className="p-5 text-white">No active SOS right now.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <h1 className="py-3 text-center text-xl font-bold">
        {isSender ? "SOS in progress" : "Nearby SOS"}
      </h1>

      <div className="px-4 text-center text-sm text-slate-300">{title}</div>

      <div className="grid gap-4 px-4 pb-4 pt-3 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-h-[26rem] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
          {isSender ? (
            <div className="relative flex h-full min-h-[26rem] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_30%)] p-6 sm:p-8">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.75))]" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
                    SOS Active
                  </p>
                  <h2 className="mt-4 max-w-xl text-3xl font-black text-white sm:text-4xl">
                    Your SOS is running
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                    The alarm, camera, and uploads stay on until you end this session.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Alarm</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {sessionSettings.soundEnabled ? "Armed" : "Disabled"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Camera</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {sessionSettings.cameraEnabled ? "On" : "Off"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Snapshots</p>
                    <p className="mt-2 text-base font-semibold text-white">{photoCaptures.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Cloud Video</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {uploadedVideo?.url ? "Saved" : isUploadingVideo ? "Uploading" : "Waiting"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : target ? (
            <div className="h-[26rem] w-full md:h-[78vh]">
              <MapContainer center={target} zoom={13} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <Marker position={target}>
                  <Popup>Alert location</Popup>
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

        <div className="space-y-4 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-1">
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
                : `${receiverDetails.senderName} sent an SOS nearby`}
            </p>
            <p className="mt-2 text-sm text-white/90">
              {isSender
                ? "Nearby users can see your location if it was shared."
                : "Follow the route only if it is safe to do so."}
            </p>
          </div>

          {isSender ? (
            <>
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
                <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(244,63,94,0.14),rgba(56,189,248,0.06))] px-5 py-4">
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
                  <div className="grid gap-3 px-5 py-4 text-xs sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                      <p className="uppercase tracking-[0.24em] text-emerald-200/80">Camera</p>
                      <p className="mt-2 font-medium text-emerald-100">Live</p>
                    </div>
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3">
                      <p className="uppercase tracking-[0.24em] text-rose-100/80">Recording</p>
                      <p className="mt-2 font-medium text-white">
                        {isRecording ? "Recording" : "Stopped"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3">
                      <p className="uppercase tracking-[0.24em] text-sky-100/80">Uploads</p>
                      <p className="mt-2 font-medium text-white">
                        {photoCaptures.filter((capture) => capture.status === "uploaded").length} photos
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Cloud Evidence</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Every 5s
                  </p>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                {recordingUrl || uploadedVideo ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">Video</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {isUploadingVideo
                            ? "Uploading video..."
                            : uploadedVideo?.url
                            ? "Video saved."
                            : "The local video will be ready when the session ends."}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                        {isUploadingVideo ? "Uploading" : uploadedVideo?.url ? "Secured" : "Local"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {recordingUrl ? (
                        <a
                          href={recordingUrl}
                          download={recordingFileName || "nightshield-sos-recording.webm"}
                          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
                        >
                          Download video
                        </a>
                      ) : null}
                      {uploadedVideo?.url ? (
                        <a
                          href={uploadedVideo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white"
                        >
                          Open saved video
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {photoCaptures.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {photoCaptures.map((capture, index) => (
                      <div
                        key={capture.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                      >
                        <img
                          src={capture.previewUrl}
                          alt={`SOS capture ${index + 1}`}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                        <div className="space-y-2 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-white">Capture {index + 1}</p>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                              {capture.status}
                            </span>
                          </div>
                          {capture.cloudUrl ? (
                            <a
                              href={capture.cloudUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white"
                            >
                              Open saved photo
                            </a>
                          ) : null}
                          {capture.error ? (
                            <p className="text-xs text-amber-200">{capture.error}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">
                    Photos taken during SOS will show up here.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <p className="font-semibold">Sender details</p>
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
