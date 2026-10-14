import { buildLayout, parseNote } from './notes.js';
import { Synth } from './synth.js';
import { KeyboardUI } from './keyboard-ui.js';
import { PressTracker } from './press-tracker.js';

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

// デバッグ・動作確認用
window.piano = { synth, tracker, keyboard };
