import { EMERGENCY_NUMBER } from "../utils/constants.js";

function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "");
}

export default function ContactCard({
  contact,
  onDelete,
  onPrimary,
  onAlert,
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{contact.phone}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
            {contact.relation}
          </p>
        </div>
        {contact.isPrimary ? (
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-200">
            Primary
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <a
          href={`tel:${normalizePhone(contact.phone || EMERGENCY_NUMBER)}`}
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-white"
        >
          Call
        </a>
        <button
          type="button"
          onClick={() => onAlert(contact)}
          className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white"
        >
          Alert
        </button>
        <button
          type="button"
          onClick={() => onPrimary(contact.id)}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
        >
          Primary
        </button>
        <button
          type="button"
          onClick={() => onDelete(contact.id)}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
