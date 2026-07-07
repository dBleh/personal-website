// Ported from kneetracker/profiles.py. Two independent 0-100 axes (accuracy,
// intervention) map to concrete tracking behaviour, with named presets.
import type { TrackingProfile } from './types';

const FB_STRICT = 1.0;
const FB_LOOSE = 8.0;
const ERR_STRICT = 8.0;
const ERR_LOOSE = 60.0;
const MAX_GRACE = 40;
const REACQUIRE_RADIUS = 18;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function fromAxes(
  accuracy: number,
  intervention: number,
  name = 'Custom',
): TrackingProfile {
  accuracy = Math.round(clamp(accuracy, 0, 100));
  intervention = Math.round(clamp(intervention, 0, 100));
  const t = accuracy / 100.0;

  const fbThresh = Math.round(lerp(FB_STRICT, FB_LOOSE, t) * 100) / 100;
  const errThresh = Math.round(lerp(ERR_STRICT, ERR_LOOSE, t) * 10) / 10;

  let recoverGrace: number | null;
  let autoReanchor: boolean;
  if (intervention >= 99) {
    recoverGrace = 0; // ask on the first bad frame
    autoReanchor = false;
  } else if (intervention <= 1) {
    recoverGrace = null; // never interrupt
    autoReanchor = true;
  } else {
    recoverGrace = Math.max(
      1,
      Math.round(((100 - intervention) / 100.0) * MAX_GRACE),
    );
    autoReanchor = true;
  }

  return {
    name,
    accuracy,
    intervention,
    fbThresh,
    errThresh,
    autoReanchor,
    recoverGrace,
    reacquireRadius: REACQUIRE_RADIUS,
  };
}

// (accuracy, intervention) points. Ordered from most hands-on to most hands-off.
export const PRESETS: Record<string, [number, number]> = {
  Strict: [15, 100],
  Balanced: [45, 60],
  Forgiving: [80, 0],
};
export const DEFAULT_PRESET = 'Balanced';

export function preset(name: string): TrackingProfile {
  const [acc, iv] = PRESETS[name] ?? PRESETS[DEFAULT_PRESET];
  return fromAxes(acc, iv, name);
}

export function describeProfile(p: TrackingProfile): string {
  let pol: string;
  if (p.recoverGrace === 0) pol = 'asks immediately';
  else if (p.recoverGrace === null) pol = 'never interrupts';
  else pol = `auto-reanchors, asks after ${p.recoverGrace} bad frames`;
  return pol;
}
