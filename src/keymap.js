// PC キーボード → 鍵盤の対応付け（DOM 非依存の純関数）
// KeyboardEvent.code（物理キー位置）で判定するので、キー配列の違いに左右されない。
import { isBlack, shiftWhite } from './notes.js';

/** 中段: 白鍵に対応するキー（左から順に白鍵 0, 1, 2, …） */
export const WHITE_ROW = [
  { code: 'KeyA', label: 'a' },
  { code: 'KeyS', label: 's' },
  { code: 'KeyD', label: 'd' },
  { code: 'KeyF', label: 'f' },
  { code: 'KeyG', label: 'g' },
  { code: 'KeyH', label: 'h' },
  { code: 'KeyJ', label: 'j' },
  { code: 'KeyK', label: 'k' },
  { code: 'KeyL', label: 'l' },
  { code: 'Semicolon', label: ';' },
  { code: 'Quote', label: "'" },
];

/**
 * 上段: 黒鍵に対応するキー。after は「どの白鍵の右隣か」（W は A と S の間 → 0）。
 * その位置に黒鍵がなければ（E–F 間・B–C 間）割り当てない。
 */
export const BLACK_ROW = [
  { code: 'KeyQ', label: 'q', after: -1 },
  { code: 'KeyW', label: 'w', after: 0 },
  { code: 'KeyE', label: 'e', after: 1 },
  { code: 'KeyR', label: 'r', after: 2 },
  { code: 'KeyT', label: 't', after: 3 },
  { code: 'KeyY', label: 'y', after: 4 },
  { code: 'KeyU', label: 'u', after: 5 },
  { code: 'KeyI', label: 'i', after: 6 },
  { code: 'KeyO', label: 'o', after: 7 },
  { code: 'KeyP', label: 'p', after: 8 },
  { code: 'BracketLeft', label: '[', after: 9 },
  { code: 'BracketRight', label: ']', after: 10 },
];

export const DEFAULT_BASE = 60; // C4

/** 基準音を白鍵にそろえる（黒鍵なら半音下の白鍵） */
export function normalizeBase(midi) {
  return isBlack(midi) ? midi - 1 : midi;
}

/**
 * @param {number} baseMidi `a` キーに割り当てる白鍵
 * @returns {Map<string, number>} KeyboardEvent.code → MIDI 番号
 */
export function buildKeymap(baseMidi) {
  const base = normalizeBase(baseMidi);
  const map = new Map();
  WHITE_ROW.forEach(({ code }, i) => map.set(code, shiftWhite(base, i)));
  for (const { code, after } of BLACK_ROW) {
    const black = shiftWhite(base, after) + 1;
    if (isBlack(black)) map.set(code, black);
  }
  return map;
}

const LABELS = new Map([...WHITE_ROW, ...BLACK_ROW].map(({ code, label }) => [code, label]));

/** @returns {Map<number, string>} MIDI 番号 → 鍵盤に表示するキー文字 */
export function labelsByNote(keymap) {
  const labels = new Map();
  for (const [code, midi] of keymap) labels.set(midi, LABELS.get(code));
  return labels;
}
