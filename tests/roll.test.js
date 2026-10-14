import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Roll } from '../src/roll.js';

test('押している間は鍵盤上端から上に伸びる', () => {
  const roll = new Roll({ speed: 100 });
  roll.noteOn(60, 1);
  assert.deepEqual(roll.geometry(1), [{ midi: 60, active: true, bottom: 0, top: 0 }]);
  assert.deepEqual(roll.geometry(1.5), [{ midi: 60, active: true, bottom: 0, top: 50 }]);
});

test('離すと押した長さを保ったまま上昇する', () => {
  const roll = new Roll({ speed: 100 });
  roll.noteOn(60, 0);
  roll.noteOff(60, 0.5);
  const [bar] = roll.geometry(2);
  assert.equal(bar.active, false);
  assert.equal(bar.bottom, 150);
  assert.equal(bar.top, 200);
  assert.equal(bar.top - bar.bottom, 50);
});

test('画面外に出た棒は破棄される', () => {
  const roll = new Roll({ speed: 100 });
  roll.noteOn(60, 0);
  roll.noteOff(60, 1);
  roll.noteOn(62, 0); // 押しっぱなしの棒は残す
  roll.prune(3, 300);
  assert.equal(roll.bars.length, 2);
  roll.prune(4.01, 300);
  assert.deepEqual(roll.bars.map((b) => b.midi), [62]);
  roll.noteOff(62, 5);
  roll.prune(9, 300);
  assert.equal(roll.isEmpty, true);
});

test('同じ音の連打は別々の棒になる', () => {
  const roll = new Roll({ speed: 100 });
  roll.noteOn(60, 0);
  roll.noteOff(60, 0.1);
  roll.noteOn(60, 0.2);
  const bars = roll.geometry(0.3);
  assert.equal(bars.length, 2);
  assert.equal(bars.filter((b) => b.active).length, 1);
});

test('離さずに再度押すと前の棒は閉じる', () => {
  const roll = new Roll({ speed: 100 });
  roll.noteOn(60, 0);
  roll.noteOn(60, 1);
  const bars = roll.geometry(1);
  assert.equal(bars.filter((b) => b.active).length, 1);
});
