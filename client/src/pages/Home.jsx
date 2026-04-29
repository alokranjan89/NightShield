import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import SOSButton from "../components/SOSButton.jsx";
import StatusIndicator from "../components/StatusIndicator.jsx";
import { SOS_STATUS } from "../utils/constants.js";
import useSOSContext from "../hooks/useSOSContext.js";

export default function Home() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const {
    settings,
    status,
    error,
    triggerSOS,
    isSending,
    location,
    beginHold,
    stopHold,
    retryLocation,
  } = useSOSContext();

  const helperText = error
    ? error
    : status === "Sending"
    ? "Sending your alert and checking your device."
    : status === SOS_STATUS.holding
    ? "Keep holding to send the alert."
    : status === "Sent"
    ? location
      ? "Your alert is live and your location was added."
      : "Your alert is live. Location will be added if it becomes available."
    : "Press and hold only if you need help right now.";

  async function handleComplete() {
    try {
      await triggerSOS();
      navigate("/sos-active");
    } catch {
      return;
    }
  }

  async function handleRetryLocation() {
    try {
      await retryLocation();
    } catch {
      return;
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-start py-3 sm:items-center sm:py-2 md:py-4">
      <div className="grid w-full gap-4 rounded-[1.5rem] border border-white/10 bg-slate-900/70 px-4 py-4 shadow-[0_24px_64px_rgba(2,6,23,0.38)] backdrop-blur sm:gap-5 sm:rounded-[2rem] sm:px-8 sm:py-10 sm:shadow-[0_30px_80px_rgba(2,6,23,0.45)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:px-10">
        <div className="text-center lg:text-left">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-slate-400 sm:text-sm sm:tracking-[0.4em]">
            Hold for {settings.sosDelay / 1000} seconds
          </p>
          <h1 className="mt-3 text-[1.55rem] font-black leading-[1.12] tracking-tight text-white sm:mt-4 sm:text-4xl lg:max-w-2xl lg:text-5xl">
            Help is one press away.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-slate-400 sm:mt-4 sm:text-base sm:leading-7 lg:mx-0 lg:max-w-lg">
            Press and hold the SOS button to send an alert.
          </p>
          <p className="mx-auto mt-1.5 max-w-xl text-[11px] leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6 lg:mx-0 lg:max-w-lg">
            {helperText}
          </p>
          <div className="mx-auto mt-4 max-w-md sm:mt-6 lg:mx-0">
            <StatusIndicator
              status={status}
              message={
                error || "Hold until the ring completes. Release early to cancel."
              }
            />
            {error && error.toLowerCase().includes("location") ? (
              <button
                type="button"
                onClick={handleRetryLocation}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15"
              >
                Retry location
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <SOSButton
            delay={settings.sosDelay}
            disabled={isSending}
            onComplete={handleComplete}
            onHoldStart={beginHold}
            onHoldCancel={stopHold}
          />
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            SOS button
          </p>
          {!isSignedIn ? (
            <div className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              Guest SOS is available
            </div>
          ) : null}
        </div>

        {!isSignedIn ? (
          <div className="lg:col-span-2">
            <div className="mt-1 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                You can send a guest SOS immediately. Sign in to save contacts,
                settings, history, and cloud evidence to your account.
              </p>
              <Link
                to="/login"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
