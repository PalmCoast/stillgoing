type Tone = {
  freq: number;
  dur: number;
  type: OscillatorType;
  delay: number;
  gain: number;
};

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

function tone({ freq, dur, type, delay, gain }: Tone) {
  const audio = context();
  if (!audio || muted) return;
  if (audio.state === 'suspended') {
    void audio.resume();
  }
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function play(notes: Tone[], pattern?: number | number[]) {
  notes.forEach(tone);
  if (muted || !pattern) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is a bonus, not the raid.
  }
}

export const sfx = {
  setMuted(next: boolean) {
    muted = next;
  },
  unlock() {
    const audio = context();
    if (audio?.state === 'suspended') {
      void audio.resume();
    }
  },
  tap() {
    play([{ freq: 540, dur: 0.07, type: 'sine', delay: 0, gain: 0.04 }]);
  },
  alert() {
    play(
      [
        { freq: 740, dur: 0.09, type: 'square', delay: 0, gain: 0.05 },
        { freq: 988, dur: 0.14, type: 'square', delay: 0.1, gain: 0.05 },
      ],
      [28, 40, 28],
    );
  },
  hit() {
    play(
      [
        { freq: 196, dur: 0.08, type: 'triangle', delay: 0, gain: 0.07 },
        { freq: 440, dur: 0.1, type: 'sine', delay: 0.03, gain: 0.05 },
      ],
      16,
    );
  },
  stretch() {
    play(
      [
        { freq: 330, dur: 0.1, type: 'square', delay: 0, gain: 0.04 },
        { freq: 330, dur: 0.1, type: 'square', delay: 0.16, gain: 0.04 },
        { freq: 494, dur: 0.18, type: 'square', delay: 0.32, gain: 0.05 },
      ],
      [20, 40, 20],
    );
  },
  miss() {
    play([{ freq: 128, dur: 0.18, type: 'sawtooth', delay: 0, gain: 0.035 }], [36, 30, 36]);
  },
  wipe() {
    play(
      [
        { freq: 392, dur: 0.12, type: 'triangle', delay: 0, gain: 0.05 },
        { freq: 311, dur: 0.14, type: 'triangle', delay: 0.12, gain: 0.05 },
        { freq: 220, dur: 0.22, type: 'triangle', delay: 0.24, gain: 0.05 },
      ],
      [50, 40, 70],
    );
  },
  clear() {
    play(
      [
        { freq: 523, dur: 0.12, type: 'triangle', delay: 0, gain: 0.06 },
        { freq: 659, dur: 0.12, type: 'triangle', delay: 0.1, gain: 0.06 },
        { freq: 784, dur: 0.12, type: 'triangle', delay: 0.2, gain: 0.06 },
        { freq: 1046, dur: 0.24, type: 'triangle', delay: 0.3, gain: 0.06 },
      ],
      [18, 24, 18, 24, 36],
    );
  },
};
