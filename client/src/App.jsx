import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
  const { incomingAlert, dismissIncomingAlert } = useSOSContext();
  const location = useLocation();
  const isSOSActiveRoute = location.pathname === "/sos-active";

  return (
    <div className="app-shell flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {!isSOSActiveRoute ? <Navbar /> : null}
      {!isSOSActiveRoute ? (
        <AlertPopup alert={incomingAlert} onClose={dismissIncomingAlert} />
      ) : null}
      <main
        className={[
          "flex w-full flex-1 overflow-x-clip",
          isSOSActiveRoute
            ? "max-w-none px-0 py-0"
            : "mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6 md:pb-8 md:pt-5",
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
