// 設定の既定値・検証・保存（DOM 非依存。storage は localStorage 互換のオブジェクト）
import { normalizeBase, DEFAULT_BASE, MIN_BASE, MAX_BASE } from './keymap.js';
import { isBlack } from './notes.js';

export const STORAGE_KEY = 'browzer-piano:settings';

/** ピアノ 88 鍵の音域 */
export const LOWEST = 21; // A0
export const HIGHEST = 108; // C8
/** 表示範囲の最小幅（半音） */
export const MIN_SPAN = 12;

export const DEFAULT_SETTINGS = Object.freeze({
  rangeStart: 48, // C3
  rangeEnd: 84, // C6
  base: DEFAULT_BASE,
  volume: 0.7,
  showLabels: true,
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const isInt = (v) => Number.isInteger(v);

/** 不正・欠落した値を既定値や有効範囲に補正した設定を返す */
export function sanitizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;

  if (isInt(raw.rangeStart) && isInt(raw.rangeEnd)) {
    let start = clamp(Math.min(raw.rangeStart, raw.rangeEnd), LOWEST, HIGHEST - MIN_SPAN);
    let end = clamp(Math.max(raw.rangeStart, raw.rangeEnd), start + MIN_SPAN, HIGHEST);
    // 両端は白鍵にそろえる
    if (isBlack(start)) start -= 1;
    if (isBlack(end)) end += 1;
    s.rangeStart = start;
    s.rangeEnd = end;
  }
  if (isInt(raw.base)) s.base = clamp(normalizeBase(raw.base), MIN_BASE, MAX_BASE);
  if (typeof raw.volume === 'number' && Number.isFinite(raw.volume)) s.volume = clamp(raw.volume, 0, 1);
  if (typeof raw.showLabels === 'boolean') s.showLabels = raw.showLabels;
  return s;
}

/** 保存済みの設定を読む。読めなければ既定値 */
export function loadSettings(storage) {
  try {
    const json = storage?.getItem(STORAGE_KEY);
    return sanitizeSettings(json ? JSON.parse(json) : null);
  } catch {
    return sanitizeSettings(null);
  }
}

/** 設定を保存する。保存できない環境（プライベートモード等）では何もしない */
export function saveSettings(storage, settings) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
