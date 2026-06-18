import { discardSilence, AutoCorrelate } from './audio/acf.js';
import { getNoteInfo } from './audio/notes.js';
import {
  getAllPresets,
  loadCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  isCustomPreset,
  findClosestString,
  presetMinFreq,
  BUILT_IN_PRESETS,
} from './presets.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const statusEl          = document.getElementById('status');
const frequencyEl       = document.getElementById('frequency-display');
const noteEl            = document.getElementById('note-display');
const centsEl           = document.getElementById('cents-display');
const barMarker         = document.getElementById('bar-marker');
const stringIndicatorEl = document.getElementById('string-indicator');
const activeStringLabel = document.getElementById('active-string-label');
const stringsGrid       = document.getElementById('strings-grid');
const activePresetTag   = document.getElementById('active-preset-tag');

const menuBtn       = document.getElementById('menu-btn');
const drawerOverlay = document.getElementById('drawer-overlay');
const presetDrawer  = document.getElementById('preset-drawer');
const presetList    = document.getElementById('preset-list');
const btnNewPreset  = document.getElementById('btn-new-preset');

const presetModal     = document.getElementById('preset-modal');
const modalOverlay    = document.getElementById('modal-overlay');
const modalTitle      = document.getElementById('modal-title');
const modalNameInput  = document.getElementById('modal-name');
const modalCopyFrom   = document.getElementById('modal-copy-from');
const modalStringList = document.getElementById('modal-strings-list');
const modalAddString  = document.getElementById('modal-add-string');
const modalCancel     = document.getElementById('modal-cancel');
const modalSave       = document.getElementById('modal-save');

// ── Audio state ───────────────────────────────────────────────────────────────

let audioContext, source, analyser;

// ── Preset state ──────────────────────────────────────────────────────────────

let activePreset    = null;
let editingPresetId = null;
const openGroups    = new Set(); // tracks which group names are expanded

// ── Note names for modal string editor (chromatic from C) ─────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ── Boot ──────────────────────────────────────────────────────────────────────

window.onload = () => {
  renderPresetList();
  wireDrawer();
  wireModal();
  init_microphone();
};

// ── Audio ─────────────────────────────────────────────────────────────────────

async function init_microphone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    statusEl.textContent = 'Recording';
    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    source.connect(analyser);
    window.setInterval(updatePitch, 100, analyser);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    statusEl.textContent = error.message;
  }
}

function updatePitch(analyser) {
  const array = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(array);

  const filteredData = discardSilence(array);
  if (filteredData.length === 0) return;

  const minFreq = activePreset ? presetMinFreq(activePreset) : 70;
  const frequency = AutoCorrelate(filteredData, audioContext.sampleRate, minFreq);
  if (frequency <= 0) return;

  frequencyEl.textContent = `${frequency.toFixed(2)} Hz`;

  if (activePreset) {
    updatePresetDisplay(frequency);
  } else {
    updateFreeDisplay(frequency);
  }
}

function updateFreeDisplay(frequency) {
  const noteInfo = getNoteInfo(frequency);
  if (!noteInfo) return;
  noteEl.textContent = `${noteInfo.note}${noteInfo.octave}`;
  centsEl.textContent = `${noteInfo.cents.toFixed(1)} ¢`;
  setBarPosition(noteInfo.cents);
}

function updatePresetDisplay(frequency) {
  const closest = findClosestString(frequency, activePreset);
  if (!closest) return;
  noteEl.textContent = closest.note;
  activeStringLabel.textContent = closest.label;
  centsEl.textContent = `${closest.cents.toFixed(1)} ¢`;
  setBarPosition(closest.cents);
  highlightActiveString(closest.label);
}

function setBarPosition(cents) {
  const clamped = Math.max(-50, Math.min(50, cents));
  barMarker.style.left = `${clamped + 50}%`;
  barMarker.className = Math.abs(cents) <= 5 ? 'in-tune' : 'out-of-tune';
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function openDrawer() {
  presetDrawer.classList.add('open');
  drawerOverlay.classList.add('visible');
  menuBtn.classList.add('open');
}

function closeDrawer() {
  presetDrawer.classList.remove('open');
  drawerOverlay.classList.remove('visible');
  menuBtn.classList.remove('open');
}

function toggleDrawer() {
  presetDrawer.classList.contains('open') ? closeDrawer() : openDrawer();
}

function wireDrawer() {
  menuBtn.addEventListener('click', toggleDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  btnNewPreset.addEventListener('click', () => { closeDrawer(); openModal(null); });
}

// ── Preset list ───────────────────────────────────────────────────────────────

function renderPresetList() {
  presetList.innerHTML = '';

  // "No Preset" option
  const noneItem = document.createElement('div');
  noneItem.className = 'preset-item-none' + (activePreset === null ? ' active' : '');
  noneItem.textContent = 'No Preset';
  noneItem.addEventListener('click', () => { selectPreset(null); closeDrawer(); });
  presetList.appendChild(noneItem);

  // Built-in groups (collapsible)
  const groups = {};
  for (const preset of BUILT_IN_PRESETS) {
    (groups[preset.group] ||= []).push(preset);
  }
  for (const [groupName, presets] of Object.entries(groups)) {
    presetList.appendChild(makeCollapsibleGroup(groupName, presets, false));
  }

  // Custom presets (collapsible)
  const customs = loadCustomPresets();
  if (customs.length > 0) {
    presetList.appendChild(makeCollapsibleGroup('Custom', customs, true));
  }
}

function makeCollapsibleGroup(groupName, presets, isCustom) {
  const wrapper = document.createElement('div');
  const isOpen = openGroups.has(groupName);

  const header = document.createElement('div');
  header.className = 'preset-group-header' + (isOpen ? ' open' : '');

  const nameSpan = document.createElement('span');
  nameSpan.textContent = groupName;

  const arrow = document.createElement('span');
  arrow.className = 'group-arrow';
  arrow.textContent = '›';

  header.appendChild(nameSpan);
  header.appendChild(arrow);

  const items = document.createElement('div');
  items.className = 'preset-group-items' + (isOpen ? ' open' : '');

  for (const p of presets) {
    items.appendChild(makePresetItem(p, isCustom));
  }

  header.addEventListener('click', () => {
    const nowOpen = items.classList.toggle('open');
    header.classList.toggle('open', nowOpen);
    nowOpen ? openGroups.add(groupName) : openGroups.delete(groupName);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(items);
  return wrapper;
}

function makePresetItem(preset, isCustom) {
  const item = document.createElement('div');
  item.className = 'preset-item' + (activePreset?.id === preset.id ? ' active' : '');
  item.dataset.id = preset.id;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = preset.name;
  item.appendChild(nameSpan);

  if (isCustom) {
    const actions = document.createElement('div');
    actions.className = 'preset-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeDrawer();
      openModal(getAllPresets().find(p => p.id === preset.id));
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon btn-icon-danger';
    delBtn.title = 'Delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete "${preset.name}"?`)) return;
      deleteCustomPreset(preset.id);
      if (activePreset?.id === preset.id) selectPreset(null);
      renderPresetList();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    item.appendChild(actions);
  }

  item.addEventListener('click', () => { selectPreset(preset); closeDrawer(); });
  return item;
}

function selectPreset(preset) {
  activePreset = preset;
  // Auto-open the group so the active item is visible next time drawer opens
  if (preset?.group) openGroups.add(preset.group);
  else if (preset) openGroups.add('Custom');

  if (preset) {
    stringsGrid.classList.remove('hidden');
    stringIndicatorEl.classList.remove('hidden');
    renderStringsGrid(preset);
    noteEl.textContent = preset.strings[0].note;
    activeStringLabel.textContent = preset.strings[0].label;
    activePresetTag.textContent = preset.name;
    activePresetTag.classList.remove('hidden');
  } else {
    stringsGrid.classList.add('hidden');
    stringIndicatorEl.classList.add('hidden');
    activePresetTag.classList.add('hidden');
    noteEl.textContent = '-';
    frequencyEl.textContent = '- Hz';
    centsEl.textContent = '- ¢';
    barMarker.style.left = '50%';
    barMarker.className = '';
  }

  renderPresetList();
}

// ── Strings grid ──────────────────────────────────────────────────────────────

function renderStringsGrid(preset) {
  stringsGrid.innerHTML = '';
  for (const string of preset.strings) {
    const chip = document.createElement('div');
    chip.className = 'string-chip';
    chip.dataset.label = string.label;

    const noteSpan = document.createElement('span');
    noteSpan.className = 'chip-note';
    noteSpan.textContent = string.note;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'chip-label';
    labelSpan.textContent = string.label;

    chip.appendChild(noteSpan);
    chip.appendChild(labelSpan);
    stringsGrid.appendChild(chip);
  }
}

function highlightActiveString(label) {
  for (const chip of stringsGrid.querySelectorAll('.string-chip')) {
    chip.classList.toggle('active', chip.dataset.label === label);
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openModal(preset) {
  editingPresetId = preset?.id ?? null;
  modalTitle.textContent = preset ? 'Edit Preset' : 'New Preset';
  modalNameInput.value = preset?.name ?? '';

  modalCopyFrom.innerHTML = '<option value="">— None —</option>';
  for (const p of getAllPresets()) {
    if (p.id === editingPresetId) continue;
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.group ? p.group + ' — ' : ''}${p.name}`;
    modalCopyFrom.appendChild(opt);
  }
  modalCopyFrom.value = '';

  populateModalStrings(preset?.strings ?? [{ label: '1', note: 'E4' }]);
  presetModal.classList.remove('hidden');
  modalNameInput.focus();
}

function closeModal() {
  presetModal.classList.add('hidden');
  editingPresetId = null;
}

function populateModalStrings(strings) {
  modalStringList.innerHTML = '';
  for (const s of strings) {
    const match = s.note.match(/^([A-G]#?)(\d+)$/);
    addModalStringRow(s.label, match?.[1] ?? 'E', parseInt(match?.[2] ?? 4));
  }
}

function addModalStringRow(label = '', noteName = 'E', octave = 4) {
  const row = document.createElement('div');
  row.className = 'modal-string-row';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'string-label-input';
  labelInput.placeholder = 'Label';
  labelInput.maxLength = 3;
  labelInput.value = label;

  const noteSelect = document.createElement('select');
  noteSelect.className = 'string-note-select';
  for (const n of NOTE_NAMES) {
    const opt = document.createElement('option');
    opt.value = n;
    opt.textContent = n;
    if (n === noteName) opt.selected = true;
    noteSelect.appendChild(opt);
  }

  const octaveSelect = document.createElement('select');
  octaveSelect.className = 'string-octave-select';
  for (let o = 0; o <= 8; o++) {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    if (o === octave) opt.selected = true;
    octaveSelect.appendChild(opt);
  }

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove-string';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', () => {
    if (modalStringList.children.length > 1) row.remove();
  });

  row.appendChild(labelInput);
  row.appendChild(noteSelect);
  row.appendChild(octaveSelect);
  row.appendChild(removeBtn);
  modalStringList.appendChild(row);
}

function getModalStrings() {
  return Array.from(modalStringList.querySelectorAll('.modal-string-row')).map(row => ({
    label: row.querySelector('.string-label-input').value.trim() || '?',
    note: row.querySelector('.string-note-select').value + row.querySelector('.string-octave-select').value,
  }));
}

function saveModalPreset() {
  const name = modalNameInput.value.trim();
  if (!name) { modalNameInput.focus(); return; }

  const strings = getModalStrings();
  if (strings.length === 0) return;

  const id = editingPresetId ?? `custom-${Date.now()}`;
  const preset = { id, name, group: null, strings };
  saveCustomPreset(preset);

  const wasActive = activePreset?.id === id;
  if (wasActive || !editingPresetId) selectPreset(preset);
  else renderPresetList();

  closeModal();
}

function wireModal() {
  modalOverlay.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveModalPreset);
  modalNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveModalPreset(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });
  modalAddString.addEventListener('click', () => {
    if (modalStringList.children.length < 12) addModalStringRow();
  });
  modalCopyFrom.addEventListener('change', () => {
    const id = modalCopyFrom.value;
    if (!id) return;
    const preset = getAllPresets().find(p => p.id === id);
    if (preset) populateModalStrings(preset.strings);
    modalCopyFrom.value = '';
  });
}
