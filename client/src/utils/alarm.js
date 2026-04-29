let audioContext = null;
let oscillator = null;
let gainNode = null;
let frequencyIntervalId = null;
let alarmRunning = false;
let incomingCueTimeoutIds = [];

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export async function unlockAlarmAudio() {
  const context = getAudioContext();

  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  return context.state === "running";
}

export async function startAlarm() {
  const context = getAudioContext();

  if (!context) {
    return false;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  if (alarmRunning) {
    return context.state === "running";
  }

  oscillator = context.createOscillator();
  gainNode = context.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gainNode.gain.setValueAtTime(0.0001, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.2);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();

  frequencyIntervalId = window.setInterval(() => {
    if (!oscillator || !audioContext) {
      return;
    }

    const nextFrequency = oscillator.frequency.value === 880 ? 660 : 880;
    oscillator.frequency.setValueAtTime(nextFrequency, audioContext.currentTime);
  }, 650);

  alarmRunning = true;
  return true;
}

export async function playIncomingAlertCue({ soundEnabled = true } = {}) {
  if (typeof window === "undefined") {
    return false;
  }

  if ("vibrate" in navigator) {
    navigator.vibrate([700, 180, 700, 180, 1000]);
  }

  if (!soundEnabled) {
    return true;
  }

  const context = getAudioContext();

  if (!context) {
    return false;
  }

  try {
    if (context.state === "suspended") {
      await context.resume();
    }
  } catch {
    return false;
  }

  if (context.state !== "running") {
    return false;
  }

  incomingCueTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  incomingCueTimeoutIds = [];

  [0, 280, 560].forEach((delay, index) => {
    const timeoutId = window.setTimeout(() => {
      const cueOscillator = context.createOscillator();
      const cueGain = context.createGain();
      const startAt = context.currentTime;

      cueOscillator.type = "square";
      cueOscillator.frequency.setValueAtTime(index === 1 ? 740 : 980, startAt);
      cueGain.gain.setValueAtTime(0.0001, startAt);
      cueGain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.03);
      cueGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);

      cueOscillator.connect(cueGain);
      cueGain.connect(context.destination);
      cueOscillator.start(startAt);
      cueOscillator.stop(startAt + 0.22);

      cueOscillator.onended = () => {
        cueOscillator.disconnect();
        cueGain.disconnect();
      };
    }, delay);

    incomingCueTimeoutIds.push(timeoutId);
  });

  return true;
}

export function stopAlarm() {
  if (typeof window !== "undefined" && frequencyIntervalId) {
    window.clearInterval(frequencyIntervalId);
  }

  frequencyIntervalId = null;

  if (!audioContext || !oscillator || !gainNode) {
    alarmRunning = false;
    oscillator = null;
    gainNode = null;
    return;
  }

  try {
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.15
    );
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Ignore cleanup races when the oscillator is already stopped.
  }

  window.setTimeout(() => {
    oscillator?.disconnect();
    gainNode?.disconnect();
    oscillator = null;
    gainNode = null;
    alarmRunning = false;
  }, 250);
}
