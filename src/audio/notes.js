const NOTES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

export function getNoteInfo(frequency) {
    if (frequency <= 0) return null;
    const semitones = Math.round(12 * Math.log2(frequency / 440));
    const cents = (12 * Math.log2(frequency / 440) - semitones) * 100;
    const note = NOTES[((semitones % 12) + 12) % 12];
    const octave = 4 + Math.floor((semitones + 9) / 12);
    return { note, octave, cents };
}
