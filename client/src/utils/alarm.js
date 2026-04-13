let audioContext = null;
let oscillator = null;
let gainNode = null;
let frequencyIntervalId = null;
let alarmRunning = false;

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
