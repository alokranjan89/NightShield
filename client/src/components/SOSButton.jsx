import { useRef } from "react";
import useHold from "../hooks/useHold.js";

export default function SOSButton({
  delay,
  disabled,
  onComplete,
  onHoldStart,
  onHoldCancel,
}) {
  const ignoreClickRef = useRef(false);
  const { progress, isHolding, start, cancel } = useHold({
    duration: delay,
    onComplete() {
      ignoreClickRef.current = true;
      onComplete?.();
    },
  });

  const circumference = 2 * Math.PI * 68;
  const offset = circumference - circumference * progress;

  function handleStart() {
    if (disabled) {
      return;
    }

    onHoldStart?.();
    start();
  }

  function handleCancel() {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      cancel();
      return;
    }

    onHoldCancel?.();
    cancel();
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="absolute h-36 w-36 -rotate-90 sm:h-44 sm:w-44 md:h-52 md:w-52"
        viewBox="0 0 160 160"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="80"
          r="68"
          className="fill-none stroke-white/10"
          strokeWidth="8"
        />
        <circle
          cx="80"
          cy="80"
          r="68"
          className="fill-none stroke-rose-400 transition-all duration-100"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <button
        type="button"
        disabled={disabled}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            handleStart();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            handleCancel();
          }
        }}
        onMouseDown={handleStart}
        onMouseUp={handleCancel}
        onMouseLeave={handleCancel}
        onTouchStart={handleStart}
        onTouchEnd={handleCancel}
        onTouchCancel={handleCancel}
        className={[
          "relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-rose-500 text-2xl font-black tracking-[0.22em] text-white shadow-[0_28px_60px_rgba(239,68,68,0.36)] transition sm:h-36 sm:w-36 sm:text-4xl md:h-44 md:w-44",
          isHolding ? "scale-[1.03]" : "sos-pulse",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        SOS
      </button>
    </div>
  );
}
