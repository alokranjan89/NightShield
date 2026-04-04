import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link, NavLink } from "react-router-dom";
import { APP_NAME, NAV_ITEMS } from "../utils/constants.js";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-3.5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:px-6">
        <div className="flex items-center justify-between gap-3 lg:min-w-0 lg:justify-start">
          <Link to="/" className="min-w-0 transition hover:opacity-90">
            <p className="text-sm font-black tracking-[0.12em] text-white">
              {APP_NAME}
            </p>
            <p className="mt-1 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.14em] text-emerald-300">
              Emergency Ready
            </p>
          </Link>

        </div>

        <SignedIn>
          <nav className="grid grid-cols-2 gap-2 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-2xl px-3 py-2.5 text-center text-sm font-medium transition",
                    isActive
                      ? "border border-sky-300/20 bg-slate-100/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SignedIn>

        <SignedIn>
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex lg:justify-self-center">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-2 text-sm font-medium transition lg:px-4",
                    isActive
                      ? "border border-sky-300/20 bg-slate-100/10 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SignedIn>

        <SignedOut>
          <div className="hidden lg:block" />
        </SignedOut>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <NavLink
            to="/sos-active"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-rose-500 px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(239,68,68,0.28)] sm:px-4"
          >
            SOS
          </NavLink>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-10 w-10",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <NavLink
              to="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-medium text-slate-200"
            >
              Login
            </NavLink>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
