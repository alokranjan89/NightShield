import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400 sm:text-sm sm:tracking-[0.35em]">Access</p>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">Access your NIGHTSHIELD workspace</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">Sign in to manage your trusted contacts, review emergency activity, and keep your response settings up to date.</p>
        </div>
        <div className="flex items-center justify-center overflow-hidden p-3 sm:p-6 lg:p-8">
          <div className="w-full max-w-full overflow-hidden">
            <div className="mx-auto flex justify-center">
              <SignIn routing="hash" forceRedirectUrl="/dashboard" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
