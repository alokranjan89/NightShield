/* eslint-disable react-refresh/only-export-components */
import { createContext, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import useSOS from "../hooks/useSOS.js";
import { getInitialData, saveContacts, saveSettings } from "../services/api.js";

export const SOSContext = createContext(null);

export function SOSProvider({ children }) {
  const initialData = useMemo(() => getInitialData(), []);
  const [contacts, setContacts] = useState(initialData.contacts);
  const [settings, setSettings] = useState(initialData.settings);
  const [alerts, setAlerts] = useState(initialData.alerts);
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const mergedUser = useMemo(
    () => ({
      id: user?.id || "guest-user",
      name:
        user?.fullName ||
        user?.primaryEmailAddress?.emailAddress ||
        "Guest User",
      email: user?.primaryEmailAddress?.emailAddress || "",
    }),
    [user]
  );

  const sos = useSOS({
    setAlerts,
    contacts,
    settings,
    user: mergedUser,
  });

  const value = useMemo(
    () => ({
      contacts,
      settings,
      alerts,
      user: mergedUser,
      isLoaded,
      isSignedIn,
      addContact(contact) {
        const nextContacts = [
          {
            id: crypto.randomUUID(),
            isPrimary: contacts.length === 0,
            ...contact,
          },
          ...contacts,
        ];
        setContacts(saveContacts(nextContacts));
      },
      deleteContact(contactId) {
        const nextContacts = contacts.filter((contact) => contact.id !== contactId);
        setContacts(saveContacts(nextContacts));
      },
      markPrimary(contactId) {
        const nextContacts = contacts.map((contact) => ({
          ...contact,
          isPrimary: contact.id === contactId,
        }));
        setContacts(saveContacts(nextContacts));
      },
      updateSettings(partialSettings) {
        const nextSettings = { ...settings, ...partialSettings };
        setSettings(saveSettings(nextSettings));
      },
      async logout() {
        await signOut({ redirectUrl: "/login" });
      },
      ...sos,
    }),
    [alerts, contacts, isLoaded, isSignedIn, mergedUser, settings, signOut, sos]
  );

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
}
