// Roll の状態を canvas に描画する
import { pitchClass } from './notes.js';

const COLORS = {
  white: ['#7cc4ff', '#3d8fe0'],
  black: ['#b08cff', '#6f4fd8'],
  guide: 'rgba(255, 255, 255, 0.05)',
};

export class RollView {
  /**
   * @param {HTMLElement} container 棒を流す領域（鍵盤の真上）
   * @param {import('./roll.js').Roll} roll
   */
  constructor(container, roll) {
    this.roll = roll;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'roll';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.keysByMidi = new Map();
    this.running = false;
    new ResizeObserver(() => this.#resize()).observe(container);
  }

  /** @param {ReturnType<import('./notes.js').buildLayout>} layout */
  setLayout(layout) {
    this.layout = layout;
    this.keysByMidi = new Map(layout.keys.map((k) => [k.midi, k]));
    this.#draw(now());
  }

  /** 描画ループを開始する（棒がなくなると自動で止まる） */
  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      const t = now();
      this.roll.prune(t, this.height);
      this.#draw(t);
      if (this.roll.isEmpty) {
        this.running = false;
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  #resize() {
    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: w, clientHeight: h } = this.canvas.parentElement;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.#draw(now());
  }

  #draw(time) {
    const { ctx, width, height, layout } = this;
    if (!layout || !width) return;
    ctx.clearRect(0, 0, width, height);
    const unit = width / layout.whiteCount;

    // オクターブの目安線（C の左端）
    ctx.fillStyle = COLORS.guide;
    for (const key of layout.keys) {
      if (pitchClass(key.midi) === 0) ctx.fillRect(Math.round(key.x * unit), 0, 1, height);
    }

    // 黒鍵の棒を白鍵の棒より手前に描く
    const bars = this.roll.geometry(time)
      .map((bar) => ({ bar, key: this.keysByMidi.get(bar.midi) }))
      .filter(({ key }) => key) // 表示範囲外の音は描かない
      .sort((a, b) => a.key.black - b.key.black);
    for (const { bar, key } of bars) {
      const inset = key.black ? 1 : unit * 0.12;
      const x = key.x * unit + inset;
      const w = key.width * unit - inset * 2;
      const top = height - Math.min(bar.top, height + 10);
      const bottom = height - bar.bottom;
      const h = Math.max(bottom - top, 2);

      const [light, dark] = key.black ? COLORS.black : COLORS.white;
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, dark);
      gradient.addColorStop(1, light);
      ctx.fillStyle = gradient;
      ctx.shadowColor = light;
      ctx.shadowBlur = bar.active ? 16 : 8;
      ctx.beginPath();
      ctx.roundRect(x, top, w, h, Math.min(4, w / 2));
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

export function now() {
  return performance.now() / 1000;
}
