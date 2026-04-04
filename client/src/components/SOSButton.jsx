import { useRef } from "react";
import useHold from "../hooks/useHold.js";

export default function SOSButton({ delay, disabled, onComplete }) {
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

  function handleClick() {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    if (!disabled) {
      onComplete?.();
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="absolute h-40 w-40 -rotate-90 sm:h-44 sm:w-44 md:h-52 md:w-52"
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
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            start();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            cancel();
          }
        }}
        onMouseDown={start}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={start}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        className={[
          "relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-rose-500 text-3xl font-black tracking-[0.22em] text-white shadow-[0_28px_60px_rgba(239,68,68,0.36)] transition sm:h-36 sm:w-36 sm:text-4xl md:h-44 md:w-44",
          isHolding ? "scale-[1.03]" : "sos-pulse",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        SOS
      </button>
    </div>
  );
}
