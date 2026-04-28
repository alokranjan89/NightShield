/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import useSOS from "../hooks/useSOS.js";
import {
  fetchSOSHistory,
  getInitialData,
  isGuestUserId,
  saveAlerts,
  saveContacts,
  saveSettings,
  syncContactsToServer,
} from "../services/api.js";

export const SOSContext = createContext(null);

function getGuestUserId() {
  if (typeof window === "undefined") {
    return "guest-user";
  }

  const storageKey = "nightshield-guest-id";
  const existingId = window.localStorage.getItem(storageKey);

  if (existingId) {
    return existingId;
  }

  const nextId = `guest-${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

export function SOSProvider({ children }) {
  const initialData = useMemo(() => getInitialData(), []);
  const [contacts, setContacts] = useState(initialData.contacts);
  const [settings, setSettings] = useState(initialData.settings);
  const [alerts, setAlerts] = useState(initialData.alerts);
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const mergedUser = useMemo(
    () => ({
      id: user?.id || getGuestUserId(),
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
    getToken,
  });

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateSOSHistory() {
      if (!isSignedIn || isGuestUserId(mergedUser.id)) {
        return;
      }

      try {
        const history = await fetchSOSHistory(mergedUser.id, getToken);

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
  }, [getToken, isSignedIn, mergedUser.id]);

  const syncServerContacts = useCallback(
    async (nextContacts) => {
      try {
        await syncContactsToServer({
          userId: mergedUser.id,
          contacts: nextContacts,
          getToken,
        });
      } catch (error) {
        console.error("Failed to sync contacts to server", error);
      }
    },
    [getToken, mergedUser.id]
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
