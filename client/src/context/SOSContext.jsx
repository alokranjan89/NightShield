/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import useSOS from "../hooks/useSOS.js";
import {
  fetchSOSHistory,
  getInitialData,
  saveAlerts,
  saveContacts,
  saveSettings,
  syncContactsToServer,
} from "../services/api.js";

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

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateSOSHistory() {
      if (!isSignedIn || !mergedUser.id || mergedUser.id === "guest-user") {
        return;
      }

      try {
        const history = await fetchSOSHistory(mergedUser.id);

        if (!isCancelled && history.length > 0) {
          setAlerts(saveAlerts(history));
        }
      } catch (error) {
        console.error("Failed to fetch SOS history", error);
      }
    }

    void hydrateSOSHistory();

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, mergedUser.id]);

  const syncServerContacts = useCallback(
    async (nextContacts) => {
      try {
        await syncContactsToServer({
          userId: mergedUser.id,
          contacts: nextContacts,
        });
      } catch (error) {
        console.error("Failed to sync contacts to server", error);
      }
    },
    [mergedUser.id]
  );

  const value = useMemo(
    () => ({
      contacts,
      settings,
      alerts,
      user: mergedUser,
      isLoaded,
      isSignedIn,
      setIncomingAlert: sos.setIncomingAlert,
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
        void syncServerContacts(nextContacts);
      },
      deleteContact(contactId) {
        const nextContacts = contacts.filter((contact) => contact.id !== contactId);
        setContacts(saveContacts(nextContacts));
        void syncServerContacts(nextContacts);
      },
      markPrimary(contactId) {
        const nextContacts = contacts.map((contact) => ({
          ...contact,
          isPrimary: contact.id === contactId,
        }));
        setContacts(saveContacts(nextContacts));
        void syncServerContacts(nextContacts);
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
    [
      alerts,
      contacts,
      isLoaded,
      isSignedIn,
      mergedUser,
      settings,
      signOut,
      sos,
      syncServerContacts,
    ]
  );

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
}
