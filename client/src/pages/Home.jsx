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
    ? "Preparing your alert and checking live device status."
    : status === SOS_STATUS.holding
    ? "Keep holding until the ring completes to send the emergency alert."
    : status === "Sent"
    ? location
      ? "Live location is ready and your alert flow is active."
      : "Your alert flow is active. Location will be added when available."
    : "Press and hold only when you want to start an emergency alert.";

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
    <section className="mx-auto flex w-full max-w-5xl flex-1 items-center py-1 sm:py-2 md:py-4">
      <div className="grid w-full gap-5 rounded-[2rem] border border-white/10 bg-slate-900/70 px-4 py-5 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8 lg:px-10">
        <div className="text-center lg:text-left">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-slate-400 sm:text-sm sm:tracking-[0.4em]">
            Hold for {settings.sosDelay / 1000} seconds
          </p>
          <h1 className="mt-4 text-[1.8rem] font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:max-w-2xl lg:text-5xl">
            Fast emergency access with a single focused action.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7 lg:mx-0 lg:max-w-lg">
            Press and hold the SOS button to trigger the active emergency flow.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm lg:mx-0 lg:max-w-lg">
            {helperText}
          </p>
          <div className="mx-auto mt-6 max-w-md lg:mx-0">
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
          <p className="mt-3 text-sm text-slate-400">
            Emergency trigger
          </p>
          {!isSignedIn ? (
            <div className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300">
              Dashboard tools stay private until login
            </div>
          ) : null}
        </div>

        {!isSignedIn ? (
          <div className="lg:col-span-2">
            <div className="mt-1 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Emergency SOS works immediately, even without sign-in. Log in to
                manage contacts, settings, and the rest of your private dashboard.
              </p>
              <Link
                to="/login"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 sm:w-auto"
              >
                Login for full access
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
