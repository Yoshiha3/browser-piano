// Web Audio API によるピアノ風の音合成（音声ファイル不使用）
import { midiToFrequency } from './notes.js';

// 倍音ごとの相対振幅（基音 = 1）
const PARTIAL_AMPS = [1, 0.55, 0.32, 0.22, 0.14, 0.09, 0.06, 0.04];
// 弦の不協和性係数（高次倍音ほどわずかに高くなる）
const INHARMONICITY = 0.0004;
const RELEASE_SEC = 0.25;
const MAX_PARTIAL_HZ = 12000;

/** 音域に応じた減衰時間（低音ほど長く響く） */
function decaySeconds(midi) {
  return Math.min(10, Math.max(1.2, 6 * 2 ** (-(midi - 48) / 24)));
}

export class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.voices = new Map();
    this.volume = 0.7;
  }

  /** ユーザー操作のタイミングで呼び、AudioContext を生成・再開する */
  ensureStarted() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.noiseBuffer = this.#createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.master) this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
  }

  get activeCount() {
    return this.voices.size;
  }

  noteOn(midi, velocity = 0.8) {
    this.ensureStarted();
    this.#stopVoice(midi, 0.03);

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = midiToFrequency(midi);
    const decay = decaySeconds(midi);
    const stopAt = now + decay * 1.5;

    // 音色の明るさ: 打鍵直後は明るく、時間とともにこもる
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    const bright = Math.min(16000, freq * (6 + 10 * velocity));
    filter.frequency.setValueAtTime(bright, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 300), now + decay * 0.6);

    // ノート全体の音量（リリース制御用）
    const out = ctx.createGain();
    out.gain.value = 0.22 * velocity;
    filter.connect(out).connect(this.master);

    const sources = [];
    PARTIAL_AMPS.forEach((amp, i) => {
      const n = i + 1;
      const f = n * freq * Math.sqrt(1 + INHARMONICITY * n * n);
      if (f > MAX_PARTIAL_HZ) return;
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      const g = ctx.createGain();
      // 高次倍音ほど早く減衰する
      const partialDecay = decay / (1 + i * 0.6);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.004);
      g.gain.setTargetAtTime(0, now + 0.004, partialDecay / 4);
      osc.connect(g).connect(filter);
      osc.start(now);
      osc.stop(stopAt);
      sources.push(osc);
    });

    // ハンマーの打鍵ノイズ
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(8000, freq * 3);
    bp.Q.value = 1.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.25 * velocity, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    noise.connect(bp).connect(ng).connect(out);
    noise.start(now);
    noise.stop(now + 0.05);

    const voice = { out, sources };
    this.voices.set(midi, voice);
    sources[0].onended = () => {
      if (this.voices.get(midi) === voice) this.voices.delete(midi);
    };
  }

  noteOff(midi) {
    this.#stopVoice(midi, RELEASE_SEC);
  }

  allNotesOff() {
    for (const midi of [...this.voices.keys()]) this.noteOff(midi);
  }

  #stopVoice(midi, release) {
    const voice = this.voices.get(midi);
    if (!voice) return;
    this.voices.delete(midi);
    const now = this.ctx.currentTime;
    voice.out.gain.cancelScheduledValues(now);
    voice.out.gain.setValueAtTime(voice.out.gain.value, now);
    voice.out.gain.setTargetAtTime(0, now, release / 4);
    for (const src of voice.sources) {
      try {
        src.stop(now + release);
      } catch {
        // 既に停止済み
      }
    }
  }

  #createNoiseBuffer() {
    const length = Math.floor(this.ctx.sampleRate * 0.05);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
