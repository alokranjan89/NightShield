const styles = {
  Safe: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  "Hold to trigger": "border-amber-400/20 bg-amber-400/10 text-amber-200",
  Sending: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  Sent: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Error: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

export default function StatusIndicator({ status, message }) {
  return (
    <div
      className={[
        "rounded-2xl border px-3 py-2.5 text-xs font-medium sm:px-4 sm:py-3 sm:text-sm",
        styles[status] || styles.Safe,
      ].join(" ")}
    >
      <p className="tracking-[0.04em] opacity-80">{status}</p>
      {message ? <p className="mt-1 normal-case tracking-normal">{message}</p> : null}
    </div>
  );
}
