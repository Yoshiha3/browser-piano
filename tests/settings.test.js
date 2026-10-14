import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSettings, loadSettings, saveSettings, DEFAULT_SETTINGS, STORAGE_KEY, LOWEST, HIGHEST,
} from '../src/settings.js';

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(k) { return this.data.has(k) ? this.data.get(k) : null; }
  setItem(k, v) { this.data.set(k, String(v)); }
}

test('未設定なら既定値', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(new MemoryStorage()), DEFAULT_SETTINGS);
  assert.deepEqual(loadSettings(null), DEFAULT_SETTINGS);
});

test('保存した設定を読み戻せる', () => {
  const storage = new MemoryStorage();
  const settings = { rangeStart: 36, rangeEnd: 96, base: 57, volume: 0.4, showLabels: false };
  assert.equal(saveSettings(storage, settings), true);
  assert.deepEqual(loadSettings(storage), settings);
});

test('不正な値は補正する', () => {
  const s = sanitizeSettings({ rangeStart: 0, rangeEnd: 200, base: 61, volume: 3, showLabels: 'yes' });
  assert.equal(s.rangeStart, LOWEST);
  assert.equal(s.rangeEnd, HIGHEST);
  assert.equal(s.base, 60); // 黒鍵は白鍵にそろえる
  assert.equal(s.volume, 1);
  assert.equal(s.showLabels, true);
});

test('表示範囲は 1 オクターブ以上・逆順も補正・端は白鍵', () => {
  const narrow = sanitizeSettings({ rangeStart: 60, rangeEnd: 62 });
  assert.equal(narrow.rangeEnd - narrow.rangeStart, 12);
  const reversed = sanitizeSettings({ rangeStart: 84, rangeEnd: 48 });
  assert.deepEqual([reversed.rangeStart, reversed.rangeEnd], [48, 84]);
  const black = sanitizeSettings({ rangeStart: 49, rangeEnd: 82 });
  assert.deepEqual([black.rangeStart, black.rangeEnd], [48, 83]);
});

test('壊れた JSON や読み書きできない storage でも落ちない', () => {
  const broken = new MemoryStorage();
  broken.setItem(STORAGE_KEY, '{oops');
  assert.deepEqual(loadSettings(broken), DEFAULT_SETTINGS);
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(loadSettings(throwing), DEFAULT_SETTINGS);
  assert.equal(saveSettings(throwing, DEFAULT_SETTINGS), false);
});
