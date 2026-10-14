import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBlack, noteName, parseNote, midiToFrequency, shiftWhite, buildLayout, BLACK_KEY_WIDTH,
} from '../src/notes.js';

test('黒鍵判定', () => {
  assert.equal(isBlack(60), false); // C4
  assert.equal(isBlack(61), true); // C#4
  assert.equal(isBlack(64), false); // E4
  assert.equal(isBlack(70), true); // A#4
});

test('音名の変換と解析', () => {
  assert.equal(noteName(60), 'C4');
  assert.equal(noteName(57), 'A3');
  assert.equal(noteName(21), 'A0');
  assert.equal(noteName(108), 'C8');
  assert.equal(parseNote('C4'), 60);
  assert.equal(parseNote('a3'), 57);
  assert.equal(parseNote('A#3'), 58);
  assert.equal(parseNote('Bb3'), 58);
  assert.equal(parseNote('H4'), null);
  for (let m = 21; m <= 108; m++) assert.equal(parseNote(noteName(m)), m);
});

test('周波数', () => {
  assert.equal(midiToFrequency(69), 440);
  assert.ok(Math.abs(midiToFrequency(60) - 261.6256) < 1e-3);
  assert.ok(Math.abs(midiToFrequency(81) - 880) < 1e-9);
});

test('白鍵単位のシフト', () => {
  assert.equal(shiftWhite(60, 1), 62); // C4 → D4
  assert.equal(shiftWhite(64, 1), 65); // E4 → F4
  assert.equal(shiftWhite(60, -2), 57); // C4 → A3
  assert.equal(shiftWhite(60, 7), 72); // 1 オクターブ
  assert.equal(shiftWhite(60, 0), 60);
});

test('鍵盤レイアウト: 1 オクターブ', () => {
  const layout = buildLayout(60, 72);
  assert.equal(layout.whiteCount, 8);
  assert.equal(layout.keys.length, 13);
  const d4 = layout.keys.find((k) => k.midi === 62);
  assert.deepEqual(d4, { midi: 62, black: false, x: 1, width: 1 });
  const cs4 = layout.keys.find((k) => k.midi === 61);
  assert.equal(cs4.black, true);
  assert.equal(cs4.x + cs4.width / 2, 1); // C と D の境界が中心
  assert.equal(cs4.width, BLACK_KEY_WIDTH);
});

test('鍵盤レイアウト: 端が黒鍵なら白鍵まで広げる', () => {
  const layout = buildLayout(61, 70);
  assert.equal(layout.start, 60);
  assert.equal(layout.end, 71);
  assert.equal(layout.whiteCount, 7);
});
