import { useEffect, useRef, useState } from "react";

export default function useHold({ duration = 3000, onComplete }) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(0);
  const completedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function stopTracking() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function reset() {
    stopTracking();
    completedRef.current = false;
    setIsHolding(false);
    setProgress(0);
  }

  function updateProgress(timestamp) {
    if (!startRef.current) {
      startRef.current = timestamp;
    }

    const elapsed = timestamp - startRef.current;
    const nextProgress = Math.min(elapsed / duration, 1);
    setProgress(nextProgress);

    if (nextProgress >= 1) {
      stopTracking();
      completedRef.current = true;
      setIsHolding(false);
      onComplete?.();
      return;
    }

    frameRef.current = requestAnimationFrame(updateProgress);
  }

  function start() {
    if (isHolding) {
      return;
    }

    startRef.current = 0;
    completedRef.current = false;
    setProgress(0);
    setIsHolding(true);
    frameRef.current = requestAnimationFrame(updateProgress);
  }

  function cancel() {
    if (completedRef.current) {
      completedRef.current = false;
      setProgress(0);
      return;
    }

    reset();
  }

  return {
    progress,
    isHolding,
    start,
    cancel,
    reset,
  };
}
