// PC キーボード入力（keydown / keyup）

export class KeyboardInput {
  /**
   * @param {{ onPress: (midi: number, sourceId: string) => void,
   *           onRelease: (midi: number, sourceId: string) => void,
   *           onShortcut?: (code: string) => boolean }} handlers
   *   onShortcut は演奏キー以外の keydown で呼ばれ、処理したら true を返す
   */
  constructor(handlers) {
    this.handlers = handlers;
    this.keymap = new Map();
    this.held = new Map(); // code → 押した時点の MIDI 番号
    window.addEventListener('keydown', (e) => this.#onKeyDown(e));
    window.addEventListener('keyup', (e) => this.#onKeyUp(e));
    // フォーカスが外れると keyup が届かないので、押しっぱなしにならないよう全解除
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
  }

  /** @param {Map<string, number>} keymap */
  setKeymap(keymap) {
    this.keymap = keymap;
  }

  releaseAll() {
    for (const [code, midi] of this.held) this.handlers.onRelease(midi, `key:${code}`);
    this.held.clear();
  }

  #onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.target.closest?.('input, select, textarea, [contenteditable]')) return;
    if (e.repeat) {
      if (this.held.has(e.code)) e.preventDefault();
      return;
    }
    const midi = this.keymap.get(e.code);
    if (midi !== undefined) {
      e.preventDefault();
      this.held.set(e.code, midi);
      this.handlers.onPress(midi, `key:${e.code}`);
    } else if (this.handlers.onShortcut?.(e.code)) {
      e.preventDefault();
    }
  }

  #onKeyUp(e) {
    // 押している間に割当が変わっても、押した音を止める
    const midi = this.held.get(e.code);
    if (midi === undefined) return;
    this.held.delete(e.code);
    this.handlers.onRelease(midi, `key:${e.code}`);
  }
}
