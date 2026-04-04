import { useNavigate } from "react-router-dom";
import useSOSContext from "../hooks/useSOSContext.js";
import { SETTINGS_OPTIONS } from "../utils/constants.js";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, triggerSOS } = useSOSContext();

  async function handleTestSOS() {
    try {
      await triggerSOS();
    } catch {
      navigate("/sos-active");
      return;
    }
    navigate("/sos-active");
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Settings</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Emergency behavior
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              Control the delay window and choose which device features stay available during SOS.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestSOS}
            className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(239,68,68,0.25)]"
          >
            Test SOS
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-7">
          <p className="text-base font-semibold text-white">SOS Delay</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Set how long someone must hold the SOS trigger before the emergency flow starts.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-xs">
            {SETTINGS_OPTIONS.delays.map((delay) => (
              <button
                key={delay}
                type="button"
                onClick={() => updateSettings({ sosDelay: delay })}
                className={[
                  "rounded-2xl px-5 py-4 text-sm font-medium transition",
                  settings.sosDelay === delay
                    ? "border border-sky-300/20 bg-slate-100/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "border border-white/10 bg-slate-950/60 text-slate-200",
                ].join(" ")}
              >
                {delay / 1000}s
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-7">
          <div className="mb-5">
            <p className="text-base font-semibold text-white">Device Access</p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
              Choose which browser features NIGHTSHIELD can use during an active emergency session.
            </p>
          </div>
          <div className="space-y-4">
          {[
            ["soundEnabled", "Sound"],
            ["cameraEnabled", "Camera"],
            ["locationEnabled", "Location"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4"
            >
              <div>
                <span className="block font-medium text-white">{label}</span>
                <span className="mt-1 block text-sm text-slate-400">
                  {label === "Sound" && "Play audible feedback when an alert is triggered."}
                  {label === "Camera" && "Allow quick visual capture during emergency use."}
                  {label === "Location" && "Attach live coordinates when location permission is available."}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(event) => updateSettings({ [key]: event.target.checked })}
                className="h-5 w-5 shrink-0 accent-rose-500"
              />
            </label>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
