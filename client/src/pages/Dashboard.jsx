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
  const totalEvidenceItems = alerts.reduce(
    (count, alert) => count + (alert.evidence?.length || 0),
    0
  );
  const evidenceBackedAlerts = alerts.filter((alert) => (alert.evidence?.length || 0) > 0).length;
  const latestEvidence = useMemo(
    () =>
      alerts
        .flatMap((alert) =>
          (alert.evidence || []).map((item) => ({
            ...item,
            alertId: alert.id,
            alertCreatedAt: alert.createdAt,
          }))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [alerts]
  );

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Welcome back, {user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Check your recent alerts, current status, and any saved evidence.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Status
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white">
                {isSOSActive ? "SOS is active" : "Everything looks normal"}
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
                  ? "There is an active SOS session right now."
                  : "There is no active SOS session."
              }
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Total alerts</p>
          <p className="mt-3 text-4xl font-black text-white">{alerts.length}</p>
          <p className="mt-2 text-sm text-slate-500">All saved alerts</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Active status</p>
          <p className="mt-3 text-4xl font-black text-white">
            {isSOSActive ? "Live" : "Standby"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {isSOSActive ? "An alert is running now" : "No alert is active"}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Resolved alerts</p>
          <p className="mt-3 text-4xl font-black text-white">{resolvedAlerts}</p>
          <p className="mt-2 text-sm text-slate-500">Alerts you already closed</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <p className="text-sm text-slate-400">Evidence stored</p>
          <p className="mt-3 text-4xl font-black text-white">{totalEvidenceItems}</p>
          <p className="mt-2 text-sm text-slate-500">
            {evidenceBackedAlerts} alerts include uploaded files
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Recent SOS alerts</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your latest alerts and any files saved with them.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{alert.type}</p>
                    <p className="text-sm text-slate-400">{formatTime(alert.createdAt)}</p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-200">
                    {alert.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Source</p>
                    <p className="mt-2 text-sm font-medium text-white capitalize">
                      {(alert.source || "manual").replace(/-/g, " ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Nearby Users</p>
                    <p className="mt-2 text-sm font-medium text-white">{alert.nearbyUsers || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Evidence</p>
                    <p className="mt-2 text-sm font-medium text-white">{alert.evidence?.length || 0} item(s)</p>
                  </div>
                </div>
                {alert.evidence?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {alert.evidence.slice(0, 3).map((item) => (
                      <a
                        key={`${alert.id}-${item.publicId || item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                      >
                        {item.mediaType === "video" ? "Video evidence" : "Photo evidence"}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Latest Evidence</h2>
            <p className="mt-2 text-sm text-slate-400">
              The most recent photos and videos attached to your alerts.
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {latestEvidence.length > 0 ? (
              latestEvidence.map((item, index) => (
                <a
                  key={`${item.publicId || item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.mediaType === "video" ? "Video evidence" : "Photo evidence"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{formatTime(item.createdAt || item.alertCreatedAt)}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                    {item.format || item.mediaType}
                  </span>
                </a>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-400">
                No evidence yet. If camera is on during SOS, saved files will show up here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
