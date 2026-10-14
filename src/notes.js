// 音名・周波数・鍵盤レイアウトの計算（DOM 非依存の純関数）

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/** 黒鍵の幅（白鍵 1 本の幅に対する比率） */
export const BLACK_KEY_WIDTH = 0.6;

export function pitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

export function isBlack(midi) {
  return BLACK_PITCH_CLASSES.has(pitchClass(midi));
}

/** MIDI 番号 → "C4" 形式（中央ド = C4 = 60） */
export function noteName(midi) {
  return `${NOTE_NAMES[pitchClass(midi)]}${Math.floor(midi / 12) - 1}`;
}

/** "C4" / "A#3" / "Bb2" 形式 → MIDI 番号。解釈できなければ null */
export function parseNote(name) {
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(name).trim());
  if (!m) return null;
  const base = NOTE_NAMES.indexOf(m[1].toUpperCase());
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + base + accidental;
}

/** 平均律（A4 = 440Hz） */
export function midiToFrequency(midi, a4 = 440) {
  return a4 * 2 ** ((midi - 69) / 12);
}

/** 白鍵単位で n 本ずらした白鍵の MIDI 番号（midi 自身は白鍵である前提） */
export function shiftWhite(midi, n) {
  let result = midi;
  const step = Math.sign(n);
  for (let i = 0; i < Math.abs(n); i++) {
    result += step;
    while (isBlack(result)) result += step;
  }
  return result;
}

/**
 * 鍵盤レイアウトを計算する。座標は白鍵 1 本の幅を 1 とした単位。
 * 範囲の両端が黒鍵なら隣の白鍵まで広げる。
 * @returns {{ start: number, end: number, whiteCount: number,
 *             keys: { midi: number, black: boolean, x: number, width: number }[] }}
 */
export function buildLayout(startMidi, endMidi) {
  let start = Math.min(startMidi, endMidi);
  let end = Math.max(startMidi, endMidi);
  if (isBlack(start)) start -= 1;
  if (isBlack(end)) end += 1;

  const keys = [];
  let whiteIndex = 0;
  for (let midi = start; midi <= end; midi++) {
    if (isBlack(midi)) {
      // 直前の白鍵と次の白鍵の境界を中心に置く
      keys.push({ midi, black: true, x: whiteIndex - BLACK_KEY_WIDTH / 2, width: BLACK_KEY_WIDTH });
    } else {
      keys.push({ midi, black: false, x: whiteIndex, width: 1 });
      whiteIndex++;
    }
  }
  return { start, end, whiteCount: whiteIndex, keys };
}
