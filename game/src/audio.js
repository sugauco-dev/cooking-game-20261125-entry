// Sizzle & Serve — tiny WebAudio sound effects, synthesized, no audio files.
// Every sound is one short oscillator burst so the game ships zero assets.
export function newAudio() {
  return { ctx: null, muted: false };
}

function ensureCtx(audio) {
  if (!audio.ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new AC();
    } catch (err) {
      audio.ctx = null;
    }
  }
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
  return audio.ctx;
}

function blip(audio, freq, dur, type, gain, slideTo) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  amp.gain.setValueAtTime(gain || 0.12, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function noiseBurst(audio, dur, gain, lowpass) {
  if (audio.muted) return;
  const ctx = ensureCtx(audio);
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass || 1200;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain || 0.1, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start();
}

// Named game events, one function each, so the call sites read like the game.
export const sfx = {
  take(audio) { blip(audio, 520, 0.07, 'triangle', 0.10, 700); },
  grillStart(audio) { noiseBurst(audio, 0.5, 0.10, 900); },
  ready(audio) { blip(audio, 660, 0.09, 'sine', 0.12, 990); },
  plate(audio) { blip(audio, 440, 0.06, 'triangle', 0.10, 560); },
  serve(audio) {
    blip(audio, 523, 0.10, 'sine', 0.14);
    setTimeout(() => blip(audio, 659, 0.10, 'sine', 0.14), 90);
    setTimeout(() => blip(audio, 784, 0.16, 'sine', 0.16), 180);
  },
  burn(audio) { blip(audio, 220, 0.25, 'sawtooth', 0.08, 110); },
  miss(audio) { blip(audio, 330, 0.2, 'sine', 0.10, 180); },
  click(audio) { blip(audio, 700, 0.05, 'square', 0.06, 700); },
};
