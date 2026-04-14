import { useState } from "react";
import ContactCard from "../components/ContactCard.jsx";
import useSOSContext from "../hooks/useSOSContext.js";

const emptyForm = {
  name: "",
  phone: "",
  relation: "",
};

export default function Contacts() {
  const { contacts, addContact, deleteContact, markPrimary, triggerSOS } = useSOSContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [actionMessage, setActionMessage] = useState("");
  const primaryContact = contacts.find((contact) => contact.isPrimary);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return;
    }

    addContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      relation: form.relation.trim() || "Trusted Contact",
    });
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function handleAlert(contact) {
    try {
      await triggerSOS({
        source: "contact-alert",
        targetContact: contact,
      });
      setActionMessage(`Alert sent with ${contact.name} selected as the main contact.`);
    } catch (requestError) {
      setActionMessage(
        requestError.message || `Could not send an alert for ${contact.name}.`
      );
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 pb-20 sm:pb-24">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Contacts</p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Your emergency contacts
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
              Add the people you want to reach quickly. You can mark one as primary and call or alert them from here.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:max-w-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm text-slate-400">Total contacts</p>
              <p className="mt-2 text-2xl font-black text-white">{contacts.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm text-slate-400">Primary ready</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {primaryContact ? primaryContact.name : "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
          {actionMessage}
        </div>
      ) : null}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-7">
          <div className="grid gap-4 md:grid-cols-3">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
            <input name="relation" value={form.relation} onChange={handleChange} placeholder="Relation" className="min-h-12 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="min-h-12 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-medium text-white">Save Contact</button>
            <button type="button" onClick={() => setIsFormOpen(false)} className="min-h-12 rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-200">Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={deleteContact}
              onPrimary={markPrimary}
              onAlert={handleAlert}
            />
          ))}
        </div>

        <aside className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur sm:p-7">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            Quick actions
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Primary contact
          </h2>
          {primaryContact ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-semibold text-white">{primaryContact.name}</p>
              <p className="mt-2 text-sm text-slate-400">{primaryContact.phone}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                {primaryContact.relation}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3">
                <a
                  href={`tel:${primaryContact.phone}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-white"
                >
                  Call Primary
                </a>
                <button
                  type="button"
                  onClick={() => handleAlert(primaryContact)}
                  className="min-h-12 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white"
                >
                  Alert Primary
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Pick one person as your primary contact so they stay easy to reach.
            </p>
          )}
        </aside>
      </div>

      {!isFormOpen ? (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-4 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-3xl text-white shadow-[0_18px_40px_rgba(239,68,68,0.35)] sm:bottom-6 sm:right-6"
          aria-label="Add contact"
        >
          +
        </button>
      ) : null}
    </section>
  );
}
