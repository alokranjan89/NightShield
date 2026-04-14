import { Link } from "react-router-dom";
import { APP_NAME } from "../utils/constants.js";

const featureHighlights = [
  {
    title: "Fast SOS button",
    description:
      "You can press and hold once to send an alert without working through extra screens.",
  },
  {
    title: "Location and nearby alerts",
    description:
      "If location is available, the app sends it with the alert and can notify nearby signed-in users.",
  },
  {
    title: "Photo and video capture",
    description:
      "The SOS screen can use the camera to capture photos and video while an alert is active.",
  },
];

const roadmapItems = [
  "Direct alerts for trusted contacts",
  "Push notifications and stronger mobile support",
  "Admin monitoring and production hardening",
];

export default function About() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70">
        <div className="bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(244,63,94,0.12),rgba(15,23,42,0.2))] px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">About</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black text-white sm:text-4xl">
            {APP_NAME} is a personal safety app built around a simple SOS flow.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            It helps you send an alert, share your location, notify nearby users, and keep important details in one place.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Go to home
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">What it does</p>
          <div className="mt-5 grid gap-4">
            {featureHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Mission</p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Make it easier to ask for help quickly.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              The goal is simple: reduce delay, keep the interface clear, and make sure the right information is available when it matters.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Next Up</p>
            <div className="mt-4 space-y-3">
              {roadmapItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
