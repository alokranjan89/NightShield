import { Link } from "react-router-dom";

export default function AlertPopup({ alert, onClose }) {
  if (!alert) {
    return null;
  }

  const senderName = alert.sender || alert.payload?.user?.name || "Emergency alert received";
  const alertMessage =
    alert.message ||
    `${senderName} triggered an SOS nearby. Open the active screen to help if it is safe.`;

  return (
    <div className="fixed left-3 right-3 top-20 z-50 rounded-3xl border border-rose-400/30 bg-slate-950/95 p-4 shadow-[0_20px_50px_rgba(2,6,23,0.65)] backdrop-blur sm:left-auto sm:right-4 sm:w-[22rem]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
        Incoming SOS
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">
        {senderName}
      </h3>
      <p className="mt-2 text-sm text-slate-300">
        {alertMessage}
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          to="/sos-active"
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white"
        >
          Open
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
