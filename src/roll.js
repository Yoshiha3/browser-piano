// ピアノロール風の棒エフェクトの状態（DOM 非依存）
// 距離は鍵盤の上端を 0 とし、上向きを正とする。時間は秒。

export class Roll {
  /** @param {{ speed?: number }} options speed: 棒が上昇する速さ（px/秒） */
  constructor({ speed = 150 } = {}) {
    this.speed = speed;
    this.bars = [];
  }

  noteOn(midi, time) {
    // 同じ音がまだ押されたままなら先に離す（取りこぼし対策）
    this.noteOff(midi, time);
    this.bars.push({ midi, start: time, end: null });
  }

  noteOff(midi, time) {
    for (const bar of this.bars) {
      if (bar.midi === midi && bar.end === null) bar.end = time;
    }
  }

  /** 押されている間は下端が鍵盤上端に固定され、離すと下端も上昇する */
  geometry(time) {
    return this.bars.map((bar) => ({
      midi: bar.midi,
      active: bar.end === null,
      bottom: bar.end === null ? 0 : (time - bar.end) * this.speed,
      top: (time - bar.start) * this.speed,
    }));
  }

  /** 下端が height を超えて画面外に出た棒を破棄する */
  prune(time, height) {
    this.bars = this.bars.filter((bar) => bar.end === null || (time - bar.end) * this.speed <= height);
  }

  get isEmpty() {
    return this.bars.length === 0;
  }
}
