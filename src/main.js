import { buildLayout, noteName } from './notes.js';
import { Synth } from './synth.js';
import { KeyboardUI } from './keyboard-ui.js';
import { PressTracker } from './press-tracker.js';
import { KeyboardInput } from './input.js';
import { Roll } from './roll.js';
import { RollView, now } from './roll-view.js';
import {
  buildKeymap, labelsByNote, shiftBase, SHIFT_SHORTCUTS,
} from './keymap.js';
import {
  loadSettings, saveSettings, sanitizeSettings, LOWEST, HIGHEST, MIN_SPAN,
} from './settings.js';

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = getStorage();
let settings = loadSettings(storage);

const keyboardEl = document.getElementById('keyboard');
const synth = new Synth();
const tracker = new PressTracker();
const roll = new Roll();
const rollView = new RollView(document.getElementById('stage'), roll);

function press(midi, sourceId) {
  if (!tracker.press(midi, sourceId)) return;
  synth.noteOn(midi);
  keyboard.setPressed(midi, true);
  roll.noteOn(midi, now());
  rollView.start();
}

function release(midi, sourceId) {
  if (!tracker.release(midi, sourceId)) return;
  synth.noteOff(midi);
  keyboard.setPressed(midi, false);
  roll.noteOff(midi, now());
}

const keyboard = new KeyboardUI(keyboardEl, { onPress: press, onRelease: release });

const input = new KeyboardInput({
  onPress: press,
  onRelease: release,
  onShortcut(code) {
    const steps = SHIFT_SHORTCUTS.get(code);
    if (steps === undefined) return false;
    updateSettings({ base: shiftBase(settings.base, steps) });
    return true;
  },
});

/** 設定を反映する。変わった項目だけ描画し直す */
function applySettings(next, prev = null) {
  const rangeChanged = !prev || prev.rangeStart !== next.rangeStart || prev.rangeEnd !== next.rangeEnd;
  if (rangeChanged) {
    const layout = buildLayout(next.rangeStart, next.rangeEnd);
    keyboard.render(layout);
    rollView.setLayout(layout);
    // キーボードで押したままの音の表示を戻す
    for (const midi of tracker.sourcesByNote.keys()) keyboard.setPressed(midi, true);
  }
  if (rangeChanged || prev.base !== next.base) {
    const keymap = buildKeymap(next.base);
    input.setKeymap(keymap);
    keyboard.setKeyLabels(labelsByNote(keymap));
    document.getElementById('base-display').textContent = `A = ${noteName(next.base)}`;
  }
  synth.setVolume(next.volume);
  keyboardEl.classList.toggle('hide-labels', !next.showLabels);
  syncControls(next);
}

function updateSettings(patch) {
  const prev = settings;
  settings = sanitizeSettings({ ...settings, ...patch });
  applySettings(settings, prev);
  saveSettings(storage, settings);
}

// ---- 設定パネル ----
const rangeStartEl = document.getElementById('range-start');
const rangeEndEl = document.getElementById('range-end');
const volumeEl = document.getElementById('volume');
const showLabelsEl = document.getElementById('show-labels');

function fillNoteOptions(select, notes) {
  select.replaceChildren(...notes.map((midi) => new Option(noteName(midi), String(midi))));
}

const octaveCs = [];
for (let midi = 24; midi <= HIGHEST; midi += 12) octaveCs.push(midi); // C1 … C8
fillNoteOptions(rangeStartEl, [LOWEST, ...octaveCs.filter((m) => m <= HIGHEST - MIN_SPAN)]);
fillNoteOptions(rangeEndEl, octaveCs.filter((m) => m >= LOWEST + MIN_SPAN));

function selectNote(select, midi) {
  if (![...select.options].some((o) => Number(o.value) === midi)) {
    // 選択肢にない値（手動で保存された値など）も表示できるようにする
    const option = new Option(noteName(midi), String(midi));
    const after = [...select.options].find((o) => Number(o.value) > midi);
    select.add(option, after ?? null);
  }
  select.value = String(midi);
}

function syncControls(s) {
  selectNote(rangeStartEl, s.rangeStart);
  selectNote(rangeEndEl, s.rangeEnd);
  volumeEl.value = String(s.volume);
  showLabelsEl.checked = s.showLabels;
}

rangeStartEl.addEventListener('change', () => {
  const start = Number(rangeStartEl.value);
  // 下端を上端に近づけすぎたら上端を押し上げる
  updateSettings({ rangeStart: start, rangeEnd: Math.max(settings.rangeEnd, start + MIN_SPAN) });
});
rangeEndEl.addEventListener('change', () => {
  const end = Number(rangeEndEl.value);
  updateSettings({ rangeEnd: end, rangeStart: Math.min(settings.rangeStart, end - MIN_SPAN) });
});
volumeEl.addEventListener('input', () => updateSettings({ volume: Number(volumeEl.value) }));
showLabelsEl.addEventListener('change', () => updateSettings({ showLabels: showLabelsEl.checked }));
// フォーム部品にフォーカスが残ると PC キーボードで演奏できないので、変更後に外す
for (const el of [rangeStartEl, rangeEndEl, volumeEl, showLabelsEl]) {
  el.addEventListener('change', () => el.blur());
}

for (const button of document.querySelectorAll('[data-shift]')) {
  button.addEventListener('click', () => {
    updateSettings({ base: shiftBase(settings.base, Number(button.dataset.shift)) });
  });
}

applySettings(settings);

// デバッグ・動作確認用
window.piano = { synth, tracker, keyboard, input, roll, get settings() { return settings; } };
