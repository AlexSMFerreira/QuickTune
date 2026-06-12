# QuickTune

A lightweight chromatic tuner that runs entirely in the browser.

![QuickTune screenshot](screenshot.png)

## How it works

Pitch detection is done with autocorrelation. The algorithm compares the audio signal against a time-shifted copy of itself and finds the lag where they match best. That lag is the period of the waveform, and `frequency = sample_rate / lag`.

A few extra steps make it reliable: the correlation is normalized to avoid always picking the smallest lag, a trough-before-peak check filters out false harmonics, and parabolic interpolation refines the result to sub-sample precision for smooth cent readings.

The frequency is then mapped to the nearest semitone using equal temperament math (A4 = 440 Hz), and the deviation is expressed in cents (±50¢ range).

## Running it

Open `index.html` in a browser, a local server is required for microphone access. With the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension, right-click `index.html` and select *Open with Live Server*.

Or with any other static server:

```bash
npx serve .
```

Allow microphone access when prompted, then play or sing a note. The display shows the nearest note, its octave, and how many cents sharp or flat you are.

## Project structure

```
QuickTune/
├── index.html
├── src/
│   ├── main.js          # Audio pipeline and UI updates
│   └── audio/
│       ├── acf.js       # Autocorrelation pitch detection
│       └── notes.js     # Frequency → note name + cents mapping
└── styles/
    └── main.css
```

## Tech

Vanilla JS, Web Audio API, no dependencies.
