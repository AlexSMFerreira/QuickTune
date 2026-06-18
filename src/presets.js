import { noteToFrequency } from './audio/notes.js';

export const BUILT_IN_PRESETS = [
  {
    id: 'guitar-standard',
    name: 'Standard',
    group: 'Guitar',
    strings: [
      { label: '6', note: 'E2' },
      { label: '5', note: 'A2' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'G3' },
      { label: '2', note: 'B3' },
      { label: '1', note: 'E4' },
    ],
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D',
    group: 'Guitar',
    strings: [
      { label: '6', note: 'D2' },
      { label: '5', note: 'A2' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'G3' },
      { label: '2', note: 'B3' },
      { label: '1', note: 'E4' },
    ],
  },
  {
    id: 'guitar-open-g',
    name: 'Open G',
    group: 'Guitar',
    strings: [
      { label: '6', note: 'D2' },
      { label: '5', note: 'G2' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'G3' },
      { label: '2', note: 'B3' },
      { label: '1', note: 'D4' },
    ],
  },
  {
    id: 'guitar-open-d',
    name: 'Open D',
    group: 'Guitar',
    strings: [
      { label: '6', note: 'D2' },
      { label: '5', note: 'A2' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'F#3' },
      { label: '2', note: 'A3' },
      { label: '1', note: 'D4' },
    ],
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD',
    group: 'Guitar',
    strings: [
      { label: '6', note: 'D2' },
      { label: '5', note: 'A2' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'G3' },
      { label: '2', note: 'A3' },
      { label: '1', note: 'D4' },
    ],
  },
  {
    id: 'bass-standard',
    name: 'Standard',
    group: 'Bass',
    strings: [
      { label: '4', note: 'E1' },
      { label: '3', note: 'A1' },
      { label: '2', note: 'D2' },
      { label: '1', note: 'G2' },
    ],
  },
  {
    id: 'bass-5string',
    name: '5-String',
    group: 'Bass',
    strings: [
      { label: '5', note: 'B0' },
      { label: '4', note: 'E1' },
      { label: '3', note: 'A1' },
      { label: '2', note: 'D2' },
      { label: '1', note: 'G2' },
    ],
  },
  {
    id: 'bass-drop-d',
    name: 'Drop D',
    group: 'Bass',
    strings: [
      { label: '4', note: 'D1' },
      { label: '3', note: 'A1' },
      { label: '2', note: 'D2' },
      { label: '1', note: 'G2' },
    ],
  },
  {
    id: 'ukulele-standard',
    name: 'Standard',
    group: 'Ukulele',
    strings: [
      { label: 'G', note: 'G4' },
      { label: 'C', note: 'C4' },
      { label: 'E', note: 'E4' },
      { label: 'A', note: 'A4' },
    ],
  },
  {
    id: 'ukulele-baritone',
    name: 'Baritone',
    group: 'Ukulele',
    strings: [
      { label: 'D', note: 'D3' },
      { label: 'G', note: 'G3' },
      { label: 'B', note: 'B3' },
      { label: 'E', note: 'E4' },
    ],
  },
  {
    id: 'violin',
    name: 'Standard',
    group: 'Violin',
    strings: [
      { label: 'G', note: 'G3' },
      { label: 'D', note: 'D4' },
      { label: 'A', note: 'A4' },
      { label: 'E', note: 'E5' },
    ],
  },
  {
    id: 'viola',
    name: 'Standard',
    group: 'Viola',
    strings: [
      { label: 'C', note: 'C3' },
      { label: 'G', note: 'G3' },
      { label: 'D', note: 'D4' },
      { label: 'A', note: 'A4' },
    ],
  },
  {
    id: 'cello',
    name: 'Standard',
    group: 'Cello',
    strings: [
      { label: 'C', note: 'C2' },
      { label: 'G', note: 'G2' },
      { label: 'D', note: 'D3' },
      { label: 'A', note: 'A3' },
    ],
  },
  {
    id: 'mandolin',
    name: 'Standard',
    group: 'Mandolin',
    strings: [
      { label: 'G', note: 'G3' },
      { label: 'D', note: 'D4' },
      { label: 'A', note: 'A4' },
      { label: 'E', note: 'E5' },
    ],
  },
  {
    id: 'banjo-5string',
    name: '5-String Open G',
    group: 'Banjo',
    strings: [
      { label: '5', note: 'G4' },
      { label: '4', note: 'D3' },
      { label: '3', note: 'G3' },
      { label: '2', note: 'B3' },
      { label: '1', note: 'D4' },
    ],
  },
];

const STORAGE_KEY = 'quicktune-presets';

export function loadCustomPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getAllPresets() {
  return [...BUILT_IN_PRESETS, ...loadCustomPresets()];
}

export function saveCustomPreset(preset) {
  const customs = loadCustomPresets();
  const idx = customs.findIndex(p => p.id === preset.id);
  if (idx >= 0) customs[idx] = preset;
  else customs.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function deleteCustomPreset(id) {
  const customs = loadCustomPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

export function isCustomPreset(id) {
  return !BUILT_IN_PRESETS.some(p => p.id === id);
}

export function findClosestString(frequency, preset) {
  let closest = null;
  let minDist = Infinity;
  for (const string of preset.strings) {
    const target = noteToFrequency(string.note);
    const cents = 1200 * Math.log2(frequency / target);
    const dist = Math.abs(cents);
    if (dist < minDist) {
      minDist = dist;
      closest = { ...string, cents, target };
    }
  }
  return closest;
}

export function presetMinFreq(preset) {
  const freqs = preset.strings.map(s => noteToFrequency(s.note));
  return Math.min(...freqs) * 0.75;
}
