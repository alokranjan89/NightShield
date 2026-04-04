import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSOSContext from "../hooks/useSOSContext.js";

function Step({ label, active, done }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-white sm:text-base">{label}</p>
      <span
        className={[
          "text-xs font-semibold uppercase tracking-[0.24em]",
          done
            ? "text-emerald-300"
            : active
            ? "text-amber-200"
            : "text-slate-500",
        ].join(" ")}
      >
        {done ? "Done" : active ? "Live" : "Queued"}
      </span>
    </div>
  );
}

export default function SOSActive() {
  const navigate = useNavigate();
  const {
    status,
    error,
    isSending,
    isFetchingLocation,
    location,
    activeAlert,
    settings,
    cancelSOS,
    retryLocation,
    resolveSOS,
  } = useSOSContext();
  const latestAlert = activeAlert;
  const isComplete = status === "Sent" || latestAlert?.status === "Active";
  const isLocationDone = isComplete && !isFetchingLocation;
  const audioContextRef = useRef(null);
  const alarmTimerRef = useRef(null);
  const vibrationTimerRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const captureTimerRef = useRef(null);
  const [cameraState, setCameraState] = useState({
    supported:
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia),
    loading: false,
    ready: false,
    error: "",
  });
  const [capturedPhoto, setCapturedPhoto] = useState("");
  const [recordingState, setRecordingState] = useState({
    recording: false,
    finished: false,
    videoUrl: "",
    error: "",
  });

  useEffect(() => {
    return () => {
      if (captureTimerRef.current) {
        window.clearTimeout(captureTimerRef.current);
      }

      if (recordingState.videoUrl) {
        URL.revokeObjectURL(recordingState.videoUrl);
      }
    };
  }, [recordingState.videoUrl]);

  useEffect(() => {
    function stopEmergencyEffects() {
      if (alarmTimerRef.current) {
        window.clearInterval(alarmTimerRef.current);
        alarmTimerRef.current = null;
      }

      if (vibrationTimerRef.current) {
        window.clearInterval(vibrationTimerRef.current);
        vibrationTimerRef.current = null;
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(0);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }

    function playAlarmPulse() {
      if (!settings.soundEnabled) {
        return;
      }

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const context = audioContextRef.current;

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.connect(context.destination);

      const toneA = context.createOscillator();
      toneA.type = "sawtooth";
      toneA.frequency.setValueAtTime(960, context.currentTime);
      toneA.frequency.linearRampToValueAtTime(1260, context.currentTime + 0.28);
      toneA.connect(gainNode);

      const toneB = context.createOscillator();
      toneB.type = "square";
      toneB.frequency.setValueAtTime(720, context.currentTime + 0.32);
      toneB.frequency.linearRampToValueAtTime(920, context.currentTime + 0.62);
      toneB.connect(gainNode);

      gainNode.gain.exponentialRampToValueAtTime(0.45, context.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.5, context.currentTime + 0.38);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.72);

      toneA.start(context.currentTime);
      toneA.stop(context.currentTime + 0.32);
      toneB.start(context.currentTime + 0.32);
      toneB.stop(context.currentTime + 0.72);
    }

    if (!latestAlert && !isSending && !isComplete) {
      stopEmergencyEffects();
      return stopEmergencyEffects;
    }

    playAlarmPulse();
    alarmTimerRef.current = window.setInterval(playAlarmPulse, 1100);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 150, 300]);
      vibrationTimerRef.current = window.setInterval(() => {
        navigator.vibrate([300, 150, 300]);
      }, 2200);
    }

    return stopEmergencyEffects;
  }, [isComplete, isSending, latestAlert, settings.soundEnabled]);

  useEffect(() => {
    function stopCameraResources() {
      if (captureTimerRef.current) {
        window.clearTimeout(captureTimerRef.current);
        captureTimerRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    async function startCameraFlow() {
      if (cameraStreamRef.current) {
        return;
      }

      if (!settings.cameraEnabled) {
        setCameraState({
          supported: true,
          loading: false,
          ready: false,
          error: "Camera capture is turned off in settings.",
        });
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState({
          supported: false,
          loading: false,
          ready: false,
          error: "Camera access is not available in this browser.",
        });
        return;
      }

      setCameraState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        cameraStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setCameraState({
          supported: true,
          loading: false,
          ready: true,
          error: "",
        });

        captureTimerRef.current = window.setTimeout(() => {
          if (!videoRef.current) {
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const context = canvas.getContext("2d");

          if (!context) {
            return;
          }

          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.88));
        }, 1200);

        try {
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm",
          });

          recordedChunksRef.current = [];
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          });

          mediaRecorder.addEventListener("stop", () => {
            const blob = new Blob(recordedChunksRef.current, {
              type: "video/webm",
            });
            const nextUrl = URL.createObjectURL(blob);

            setRecordingState((current) => {
              if (current.videoUrl) {
                URL.revokeObjectURL(current.videoUrl);
              }

              return {
                recording: false,
                finished: true,
                videoUrl: nextUrl,
                error: "",
              };
            });
          });

          mediaRecorder.start();
          setRecordingState({
            recording: true,
            finished: false,
            videoUrl: "",
            error: "",
          });
        } catch (recordingError) {
          setRecordingState({
            recording: false,
            finished: false,
            videoUrl: "",
            error: recordingError.message || "Video recording could not start.",
          });
        }
      } catch (cameraError) {
        setCameraState({
          supported: true,
          loading: false,
          ready: false,
          error:
            cameraError.message ||
            "Unable to access the camera. Check browser permission settings.",
        });
      }
    }

    if (!latestAlert && !isSending && !isComplete) {
      stopCameraResources();
      return stopCameraResources;
    }

    startCameraFlow();

    return stopCameraResources;
  }, [isComplete, isSending, latestAlert, settings.cameraEnabled]);

  function handleStop() {
    if (latestAlert) {
      resolveSOS(latestAlert.id);
    } else {
      cancelSOS();
    }

    navigate("/");
  }

  function handleBack() {
    cancelSOS();
    navigate("/");
  }

  async function handleRetryLocation() {
    try {
      await retryLocation();
    } catch {
      return;
    }
  }

  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-[#0f172a] px-3 py-4 sm:px-4 sm:py-6">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-rose-400/20 bg-slate-950/92 p-4 text-center shadow-[0_30px_80px_rgba(127,29,29,0.35)] backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-200 sm:text-sm sm:tracking-[0.4em]">
          Emergency Mode
        </p>
        <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          ALERT SENT
        </h1>
        <div className="mt-6 space-y-3 text-left sm:mt-8">
          <Step
            label="Sharing location..."
            active={isFetchingLocation}
            done={isLocationDone}
          />
          <Step
            label="Recording..."
            active={recordingState.recording}
            done={recordingState.finished || isComplete}
          />
          <Step
            label="Notifying contacts..."
            active={isSending && !isComplete}
            done={isComplete}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Status
          </p>
          <p className="mt-2 text-sm font-medium text-white sm:text-base">
            {error || (isComplete ? "Alert is active." : "Emergency request is running.")}
          </p>
          {location ? (
            <p className="mt-2 break-words text-sm text-slate-400">
              Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          ) : null}
          {cameraState.error ? (
            <p className="mt-2 text-sm text-rose-300">{cameraState.error}</p>
          ) : null}
          {recordingState.error ? (
            <p className="mt-2 text-sm text-rose-300">{recordingState.error}</p>
          ) : null}
          {error && error.toLowerCase().includes("location") ? (
            <button
              type="button"
              onClick={handleRetryLocation}
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15"
            >
              Retry location
            </button>
          ) : null}
          <p className="mt-2 text-sm text-slate-500">
            {latestAlert?.status ? `Latest state: ${latestAlert.status}` : "Preparing response flow"}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Camera Feed
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full object-cover"
            />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Photo
              </p>
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Captured emergency snapshot"
                  className="mt-2 aspect-video w-full rounded-xl object-cover"
                />
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  {cameraState.loading
                    ? "Opening camera..."
                    : cameraState.ready
                    ? "Capturing a snapshot..."
                    : "Waiting for camera access."}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Video
              </p>
              {recordingState.videoUrl ? (
                <video
                  controls
                  src={recordingState.videoUrl}
                  className="mt-2 aspect-video w-full rounded-xl object-cover"
                />
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  {recordingState.recording
                    ? "Recording in progress..."
                    : cameraState.ready
                    ? "Preparing local recording..."
                    : "Waiting for camera access."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-rose-500 px-5 py-4 text-base font-semibold text-white sm:min-h-14"
          >
            STOP / CANCEL
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-5 py-4 text-base font-medium text-slate-200 sm:min-h-14"
          >
            Back
          </button>
        </div>
      </div>
    </section>
  );
}
