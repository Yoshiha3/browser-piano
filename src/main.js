import { buildLayout, parseNote, noteName } from './notes.js';
import { Synth } from './synth.js';
import { KeyboardUI } from './keyboard-ui.js';
import { PressTracker } from './press-tracker.js';
import { KeyboardInput } from './input.js';
import {
  buildKeymap, labelsByNote, shiftBase, DEFAULT_BASE, SHIFT_SHORTCUTS,
} from './keymap.js';

const synth = new Synth();
const tracker = new PressTracker();

function press(midi, sourceId) {
  if (!tracker.press(midi, sourceId)) return;
  synth.noteOn(midi);
  keyboard.setPressed(midi, true);
}

function release(midi, sourceId) {
  if (!tracker.release(midi, sourceId)) return;
  synth.noteOff(midi);
  keyboard.setPressed(midi, false);
}

const keyboard = new KeyboardUI(document.getElementById('keyboard'), {
  onPress: press,
  onRelease: release,
});
keyboard.render(buildLayout(parseNote('C3'), parseNote('C6')));

let base = DEFAULT_BASE;

function setBase(midi) {
  base = midi;
  const keymap = buildKeymap(base);
  input.setKeymap(keymap);
  keyboard.setKeyLabels(labelsByNote(keymap));
  document.getElementById('base-display').textContent = `A = ${noteName(base)}`;
}

const input = new KeyboardInput({
  onPress: press,
  onRelease: release,
  onShortcut(code) {
    const steps = SHIFT_SHORTCUTS.get(code);
    if (steps === undefined) return false;
    setBase(shiftBase(base, steps));
    return true;
  },
});

for (const button of document.querySelectorAll('[data-shift]')) {
  button.addEventListener('click', () => setBase(shiftBase(base, Number(button.dataset.shift))));
}

setBase(DEFAULT_BASE);

// デバッグ・動作確認用
window.piano = { synth, tracker, keyboard, input };
