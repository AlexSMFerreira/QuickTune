export const NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

export function getNoteInfo(frequency) {
    if (frequency <= 0) return null;
    const semitones = Math.round(12 * Math.log2(frequency / 440));
    const cents = (12 * Math.log2(frequency / 440) - semitones) * 100;
    const note = NOTES[((semitones % 12) + 12) % 12];
    const octave = 4 + Math.floor((semitones + 9) / 12);
    return { note, octave, cents };
}

export function noteToFrequency(noteStr) {
    const match = noteStr.match(/^([A-G]#?)(\d+)$/);
    if (!match) return null;
    const noteIndex = NOTES.indexOf(match[1]);
    const octave = parseInt(match[2]);
    // octave number increments at C in this system (A4=440, C5=523...)
    const semitones = noteIndex <= 2
        ? noteIndex + (octave - 4) * 12
        : noteIndex + (octave - 5) * 12;
    return 440 * Math.pow(2, semitones / 12);
}
