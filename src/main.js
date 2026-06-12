import { discardSilence, AutoCorrelate } from './audio/acf.js';
import { getNoteInfo } from './audio/notes.js';

let audioContext;
let source;
let analyser;

const statusElement = document.getElementById('status');
const frequencyElement = document.getElementById('frequency-display');
const noteElement = document.getElementById('note-display');
const centsElement = document.getElementById('cents-display');
const barMarker = document.getElementById('bar-marker');

window.onload = init_microphone;

async function init_microphone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    statusElement.textContent = 'Status: Recording...';

    audioContext = new AudioContext();
    source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    source.connect(analyser);

    window.setInterval(updatePitch, 100, analyser);

  } catch (error) {
    console.error('Error accessing microphone:', error);
    statusElement.textContent = `Error: ${error.message}`;
  }
}

function updatePitch(analyser) {
  const array = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(array);

  const filteredData = discardSilence(array);
  if (filteredData.length === 0) return;

  const frequency = AutoCorrelate(filteredData, audioContext.sampleRate);
  if (frequency <= 0) return;

  frequencyElement.textContent = `${frequency.toFixed(2)} Hz`;

  const noteInfo = getNoteInfo(frequency);
  if (!noteInfo) return;

  noteElement.textContent = `${noteInfo.note}${noteInfo.octave}`;
  centsElement.textContent = `${noteInfo.cents.toFixed(1)} ¢`;

  const position = (noteInfo.cents + 50) / 100 * 100;
  barMarker.style.left = `${position}%`;
  barMarker.className = Math.abs(noteInfo.cents) <= 5 ? 'in-tune' : 'out-of-tune';
}
