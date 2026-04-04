import { useMemo } from "react";
import StatusIndicator from "../components/StatusIndicator.jsx";
import useSOSContext from "../hooks/useSOSContext.js";

function formatTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Dashboard() {
  const { alerts, status, isSOSActive, user } = useSOSContext();
  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);
  const resolvedAlerts = alerts.filter((alert) => alert.status === "Resolved").length;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Track alert history, monitor activity, and review the current response state in one place.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Current State
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white">
                {isSOSActive ? "Live emergency session" : "System on standby"}
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
              {alerts.length} alerts
            </span>
          </div>
          <div className="mt-5">
            <StatusIndicator
              status={status}
              message={
                isSOSActive
                  ? "A live SOS session is running right now."
                  : "No active emergency flow at the moment."
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Total alerts</p>
          <p className="mt-3 text-4xl font-black text-white">{alerts.length}</p>
          <p className="mt-2 text-sm text-slate-500">All recorded safety events</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Active status</p>
          <p className="mt-3 text-4xl font-black text-white">
            {isSOSActive ? "Live" : "Standby"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {isSOSActive ? "Immediate action in progress" : "Ready for the next trigger"}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Resolved alerts</p>
          <p className="mt-3 text-4xl font-black text-white">{resolvedAlerts}</p>
          <p className="mt-2 text-sm text-slate-500">Events marked as completed</p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Recent SOS alerts</h2>
            <p className="mt-2 text-sm text-slate-400">
              Review the latest alert entries and their current status.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-base font-semibold text-white">{alert.type}</p>
                <p className="text-sm text-slate-400">{formatTime(alert.createdAt)}</p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
                {alert.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
