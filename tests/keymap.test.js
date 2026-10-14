import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildKeymap, labelsByNote, normalizeBase, shiftBase, MIN_BASE, MAX_BASE } from '../src/keymap.js';
import { parseNote, noteName } from '../src/notes.js';

const names = (keymap, codes) => codes.map((c) => (keymap.has(c) ? noteName(keymap.get(c)) : null));

test('基準 C4: awsedftgyhujk がドからオクターブ上のドに対応する', () => {
  const km = buildKeymap(parseNote('C4'));
  const codes = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK'];
  assert.deepEqual(names(km, codes), [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5',
  ]);
});

test('基準 C4: 黒鍵のない位置のキーは割り当てない', () => {
  const km = buildKeymap(parseNote('C4'));
  assert.equal(km.has('KeyQ'), false); // B3–C4 間
  assert.equal(km.has('KeyR'), false); // E4–F4 間
  assert.equal(km.has('KeyI'), false); // B4–C5 間
  assert.equal(noteName(km.get('KeyO')), 'C#5');
});

test('基準 A3: a がラに対応し、位置関係が保たれる', () => {
  const km = buildKeymap(parseNote('A3'));
  assert.deepEqual(
    names(km, ['KeyQ', 'KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyR', 'KeyF', 'KeyT', 'KeyG']),
    ['G#3', 'A3', 'A#3', 'B3', null, 'C4', 'C#4', 'D4', 'D#4', 'E4'],
  );
});

test('全ての割当が鍵盤順（白鍵行・黒鍵行とも昇順）', () => {
  for (let base = 21; base <= 96; base++) {
    const km = buildKeymap(base);
    const order = ['KeyQ', 'KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyR', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH',
      'KeyU', 'KeyJ', 'KeyI', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon', 'BracketLeft', 'Quote', 'BracketRight'];
    const notes = order.filter((c) => km.has(c)).map((c) => km.get(c));
    for (let i = 1; i < notes.length; i++) assert.equal(notes[i] - notes[i - 1], 1, `base=${base}`);
  }
});

test('黒鍵の基準音は白鍵にそろえる', () => {
  assert.equal(normalizeBase(61), 60);
  assert.equal(normalizeBase(62), 62);
});

test('鍵盤ごとのキーラベル', () => {
  const labels = labelsByNote(buildKeymap(60));
  assert.equal(labels.get(60), 'a');
  assert.equal(labels.get(61), 'w');
  assert.equal(labels.get(72), 'k');
  assert.equal(labels.has(59), false);
});

test('基準音のシフト', () => {
  assert.equal(noteName(shiftBase(parseNote('C4'), -2)), 'A3'); // a をラに
  assert.equal(noteName(shiftBase(parseNote('C4'), 7)), 'C5');
  assert.equal(noteName(shiftBase(parseNote('E4'), 1)), 'F4');
  assert.equal(noteName(shiftBase(parseNote('C#4'), 1)), 'D4'); // 黒鍵は白鍵にそろえてから
});

test('基準音のシフトはピアノの音域内に収める', () => {
  assert.equal(shiftBase(parseNote('C1'), -7), MIN_BASE);
  assert.equal(shiftBase(parseNote('C7'), 1), MAX_BASE);
  assert.equal(shiftBase(MIN_BASE, -1), MIN_BASE);
});
