import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { APP_NAME, NAV_ITEMS } from "../utils/constants.js";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const publicNavItems = NAV_ITEMS.filter(
    (item) => item.to === "/" || item.to === "/about"
  );
  const visibleNavItems = isSignedIn ? NAV_ITEMS : publicNavItems;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div
        className={[
          "mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2.5 sm:px-5 sm:py-3.5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:px-6",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 lg:min-w-0 lg:justify-start">
          <Link to="/" className="min-w-0 transition hover:opacity-90">
            <p className="text-base font-black tracking-[0.04em] text-white sm:text-lg">
              {APP_NAME}
            </p>
            <p className="mt-1 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300 sm:px-2.5 sm:py-1 sm:text-[10px]">
              Personal safety app
            </p>
          </Link>

          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 sm:h-10 sm:w-10"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="flex w-4 flex-col gap-1.5">
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
                <span className="h-0.5 rounded-full bg-current" />
              </span>
            </button>
            <NavLink
              to="/sos-active"
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(239,68,68,0.28)] sm:min-h-10 sm:px-4 sm:text-sm"
            >
              SOS
            </NavLink>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 sm:h-10 sm:w-10",
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

        <nav
          className={[
            "grid gap-2 overflow-hidden transition-[max-height,opacity] duration-200 lg:hidden",
            isMobileMenuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0",
            visibleNavItems.length > 2 ? "grid-cols-2" : "grid-cols-1",
          ].join(" ")}
        >
          {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
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

        <nav
          className={[
            "hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex lg:justify-self-center",
            !isSignedIn ? "lg:justify-self-start" : "",
          ].join(" ")}
        >
          {visibleNavItems.map((item) => (
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

        <div className="hidden shrink-0 items-center justify-end gap-2 sm:gap-3 lg:flex">
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
