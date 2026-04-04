export default function Loader({ label = "Loading" }) {
  return (
    <div className="inline-flex items-center gap-3 text-sm text-slate-300">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
      <span>{label}</span>
    </div>
  );
}
