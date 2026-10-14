// 複数の入力元（PCキー・各タッチ指・マウス）からの押下を音ごとに数える。
// 同じ音を複数の入力元で押しても、最初の押下で発音し最後の解放で止める。
export class PressTracker {
  constructor() {
    this.sourcesByNote = new Map();
  }

  /** @returns {boolean} この押下で音が鳴り始めるなら true */
  press(midi, sourceId) {
    let sources = this.sourcesByNote.get(midi);
    if (!sources) {
      sources = new Set();
      this.sourcesByNote.set(midi, sources);
    }
    const wasSilent = sources.size === 0;
    sources.add(sourceId);
    return wasSilent;
  }

  /** @returns {boolean} この解放で音が止まるなら true */
  release(midi, sourceId) {
    const sources = this.sourcesByNote.get(midi);
    if (!sources || !sources.delete(sourceId)) return false;
    if (sources.size > 0) return false;
    this.sourcesByNote.delete(midi);
    return true;
  }

  isPressed(midi) {
    return this.sourcesByNote.has(midi);
  }

  /** 全押下を解除し、止めるべき音の一覧を返す */
  releaseAll() {
    const notes = [...this.sourcesByNote.keys()];
    this.sourcesByNote.clear();
    return notes;
  }
}
