import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PressTracker } from '../src/press-tracker.js';

test('単一入力元の押下と解放', () => {
  const t = new PressTracker();
  assert.equal(t.press(60, 'key:a'), true);
  assert.equal(t.isPressed(60), true);
  assert.equal(t.release(60, 'key:a'), true);
  assert.equal(t.isPressed(60), false);
});

test('複数入力元で同じ音を押すと最後の解放で止まる', () => {
  const t = new PressTracker();
  assert.equal(t.press(60, 'key:a'), true);
  assert.equal(t.press(60, 'pointer:1'), false);
  assert.equal(t.release(60, 'key:a'), false);
  assert.equal(t.isPressed(60), true);
  assert.equal(t.release(60, 'pointer:1'), true);
});

test('押していない入力元の解放は無視する', () => {
  const t = new PressTracker();
  t.press(60, 'key:a');
  assert.equal(t.release(60, 'key:s'), false);
  assert.equal(t.release(62, 'key:a'), false);
  assert.equal(t.isPressed(60), true);
});

test('全解除', () => {
  const t = new PressTracker();
  t.press(60, 'a');
  t.press(64, 'b');
  assert.deepEqual(t.releaseAll().sort(), [60, 64]);
  assert.equal(t.isPressed(60), false);
});
