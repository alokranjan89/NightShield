import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
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
import Settings from "./pages/Settings.jsx";
import SOSActive from "./pages/SOSActive.jsx";

import { socket, socketUrl } from "./services/socket";

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
  const { incomingAlert, dismissIncomingAlert, setIncomingAlert } =
    useSOSContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isSOSActiveRoute = location.pathname === "/sos-active";

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const registerSocket = () => {
      socket.emit("register", userId);
      console.log("Socket registered:", userId, "via", socketUrl);
    };
    const handleAlert = (data) => {
      console.log("SOS_ALERT received:", data);
      setIncomingAlert(data);
      navigate("/sos-active");
    };

    socket.on("connect", registerSocket);
    socket.on("SOS_ALERT", handleAlert);

    if (!socket.connected) {
      socket.connect();
    } else {
      registerSocket();
    }

    return () => {
      socket.off("connect", registerSocket);
      socket.off("SOS_ALERT", handleAlert);
    };
  }, [navigate, setIncomingAlert, user]);

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
