// Shared axis/scale helpers for the chart components.

/** Round tick positions covering [min, max] on a 1/2/5 grid. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const step0 = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(v);
  return ticks;
}

/** Index of the value in sorted `arr` nearest to `v`. */
export function nearestIndex(arr: number[], v: number): number {
  if (arr.length === 0) return -1;
  let lo = 0;
  let hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid;
    else hi = mid;
  }
  return v - arr[lo] <= arr[hi] - v ? lo : hi;
}
