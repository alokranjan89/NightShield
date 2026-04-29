import { SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";

import AlertPopup from "./components/AlertPopup.jsx";
import Navbar from "./components/Navbar.jsx";
import { SOSProvider } from "./context/SOSContext.jsx";
import useSOSContext from "./hooks/useSOSContext.js";

import Contacts from "./pages/Contacts.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import About from "./pages/About.jsx";
import Settings from "./pages/Settings.jsx";
import SOSActive from "./pages/SOSActive.jsx";

import { socket, socketUrl } from "./services/socket";
import { playIncomingAlertCue, unlockAlarmAudio } from "./utils/alarm.js";

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

function AppShell() {
  const { incomingAlert, dismissIncomingAlert, setIncomingAlert, settings } =
    useSOSContext();
  const { getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isSOSActiveRoute = location.pathname === "/sos-active";

  useEffect(() => {
    const unlockAudio = () => {
      void unlockAlarmAudio();
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user.id;
    const connectSocket = async () => {
      const token = await getToken();

      if (!token) {
        return;
      }

      socket.auth = { token };

      if (!socket.connected) {
        socket.connect();
      }

      console.log("Socket connected:", userId, "via", socketUrl);
    };
    const handleAlert = (data) => {
      console.log("SOS_ALERT received:", data);
      setIncomingAlert(data);
      void playIncomingAlertCue({ soundEnabled: settings.soundEnabled });

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          const notification = new Notification("NightShield SOS Alert", {
            body: data.message || "Someone nearby sent an SOS.",
          });

          notification.onclick = () => {
            window.focus();
            navigate("/sos-active");
          };
        } else if (Notification.permission === "default") {
          void Notification.requestPermission();
        }
      }
    };
    const handleResolved = (data) => {
      console.log("SOS_RESOLVED received:", data);
      setIncomingAlert((currentAlert) => {
        if (!currentAlert || currentAlert.id !== data.id) {
          return currentAlert;
        }

        return null;
      });

      if (location.pathname === "/sos-active") {
        navigate("/", { replace: true });
      }
    };

    socket.on("SOS_ALERT", handleAlert);
    socket.on("SOS_RESOLVED", handleResolved);
    void connectSocket();

    return () => {
      socket.off("SOS_ALERT", handleAlert);
      socket.off("SOS_RESOLVED", handleResolved);
    };
  }, [getToken, location.pathname, navigate, setIncomingAlert, settings.soundEnabled, user]);

  return (
    <div className="app-shell flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {!isSOSActiveRoute && <Navbar />}

      {!isSOSActiveRoute && (
        <AlertPopup alert={incomingAlert} onClose={dismissIncomingAlert} />
      )}

      <main
        className={[
          "flex w-full flex-1 overflow-x-clip",
          isSOSActiveRoute
            ? "max-w-none px-0 py-0"
            : "mx-auto max-w-6xl px-3 pb-6 pt-3 sm:px-5 sm:pt-4 md:px-6 md:pb-8 md:pt-5",
        ].join(" ")}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sos-active" element={<SOSActive />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SOSProvider>
      <AppShell />
    </SOSProvider>
  );
}
