// 鍵盤の DOM 描画とポインタ（マウス・タッチ）入力
import { noteName, pitchClass } from './notes.js';

export class KeyboardUI {
  /**
   * @param {HTMLElement} container
   * @param {{ onPress: (midi: number, sourceId: string) => void,
   *           onRelease: (midi: number, sourceId: string) => void }} handlers
   */
  constructor(container, handlers) {
    this.container = container;
    this.handlers = handlers;
    this.keyEls = new Map();
    this.pointerNotes = new Map(); // pointerId → midi
    this.activePointers = new Set();
    this.#bindPointerEvents();
  }

  /** @param {ReturnType<import('./notes.js').buildLayout>} layout */
  render(layout) {
    this.releaseAllPointers();
    this.layout = layout;
    this.container.replaceChildren();
    this.keyEls.clear();
    for (const key of layout.keys) {
      const el = document.createElement('div');
      el.className = `key ${key.black ? 'black' : 'white'}`;
      el.dataset.midi = String(key.midi);
      el.style.left = `${(key.x / layout.whiteCount) * 100}%`;
      el.style.width = `${(key.width / layout.whiteCount) * 100}%`;
      el.setAttribute('aria-label', noteName(key.midi));

      const label = document.createElement('span');
      label.className = 'key-label';
      el.append(label);
      if (pitchClass(key.midi) === 0) {
        const name = document.createElement('span');
        name.className = 'note-name';
        name.textContent = noteName(key.midi);
        el.append(name);
      }
      this.container.append(el);
      this.keyEls.set(key.midi, el);
    }
  }

  setPressed(midi, pressed) {
    this.keyEls.get(midi)?.classList.toggle('pressed', pressed);
  }

  /** @param {Map<number, string>} labels midi → 表示するキー文字 */
  setKeyLabels(labels) {
    for (const [midi, el] of this.keyEls) {
      const text = labels.get(midi) ?? '';
      el.querySelector('.key-label').textContent = text.toUpperCase();
      el.classList.toggle('mapped', text !== '');
    }
  }

  releaseAllPointers() {
    for (const [pointerId, midi] of this.pointerNotes) {
      this.handlers.onRelease(midi, `pointer:${pointerId}`);
    }
    this.pointerNotes.clear();
    this.activePointers.clear();
  }

  #keyAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('.key');
    return el && this.container.contains(el) ? Number(el.dataset.midi) : null;
  }

  #moveTo(pointerId, midi) {
    const current = this.pointerNotes.get(pointerId);
    if (current === midi) return;
    const sourceId = `pointer:${pointerId}`;
    if (current !== undefined) this.handlers.onRelease(current, sourceId);
    if (midi === null) {
      this.pointerNotes.delete(pointerId);
    } else {
      this.pointerNotes.set(pointerId, midi);
      this.handlers.onPress(midi, sourceId);
    }
  }

  #bindPointerEvents() {
    const c = this.container;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      this.activePointers.add(e.pointerId);
      // 鍵盤外で指やボタンを離しても pointerup を受け取れるようにする
      try {
        c.setPointerCapture(e.pointerId);
      } catch {
        // キャプチャできない環境でも演奏は続ける
      }
      this.#moveTo(e.pointerId, this.#keyAt(e.clientX, e.clientY));
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      // グリッサンド: 指の下の鍵盤に切り替える
      this.#moveTo(e.pointerId, this.#keyAt(e.clientX, e.clientY));
    });
    const end = (e) => {
      this.activePointers.delete(e.pointerId);
      this.#moveTo(e.pointerId, null);
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('lostpointercapture', end);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}
