import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { APP_NAME } from "../utils/constants.js";

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden border-b border-white/10 p-6 sm:p-8 lg:block lg:border-b-0 lg:border-r">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">Access</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Sign in to {APP_NAME}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Save your contacts, check past alerts, and keep your settings in one place.</p>
        </div>
        <div className="flex items-center justify-center overflow-hidden p-3 sm:p-6 lg:p-8">
          <div className="w-full max-w-full overflow-hidden">
            <div className="mb-5 text-center lg:hidden">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                Access
              </p>
              <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Sign in
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Open your dashboard, contacts, and SOS settings.
              </p>
            </div>
            <div className="mx-auto flex justify-center">
              <SignIn
                routing="hash"
                forceRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full max-w-full",
                    card: "w-full max-w-full rounded-[1.5rem] border border-slate-200/10 shadow-none",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
