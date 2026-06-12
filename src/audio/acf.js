export function discardSilence(data, threshold = 0.007) {
  const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
  if (rms < threshold) {
    return [];
  }
  return data;
}

export function getCorrelation(buffer, sampleRate, lag) {
  const W = buffer.length;
  let sum = 0;
  for (let i = 0; i < W - lag; i++) {
    sum += buffer[i] * buffer[i + lag];
  }
  return sum;
}

export function AutoCorrelate(buffer, sampleRate, minFreq = 70, maxFreq = 1000) {
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.ceil(sampleRate / minFreq);

  const energy = getCorrelation(buffer, sampleRate, 0);
  if (energy === 0) return -1;

  const correlations = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    correlations[lag] = getCorrelation(buffer, sampleRate, lag);
  }

  let troughLag = minLag;
  let peakLag = minLag;

  for (let i = minLag; i <= maxLag; i++) {
    if (correlations[i] < correlations[troughLag]) troughLag = i;
    if (correlations[i] > correlations[peakLag]) peakLag = i;
  }

  if (peakLag <= troughLag) return -1;
  if (correlations[peakLag] / energy < 0.5) return -1;

  const lag = peakLag;
  const lagRefined = lag + (correlations[lag - 1] - correlations[lag + 1]) / (2 * (correlations[lag - 1] - 2 * correlations[lag] + correlations[lag + 1]));
  return sampleRate / lagRefined;
}
