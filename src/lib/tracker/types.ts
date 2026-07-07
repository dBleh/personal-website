import type { ViewKey } from './constants';

// One tracked sample: frame index, pixel position, and whether the match on
// that frame was verified good (bad frames are coasted/flagged, like Python).
export interface TrackRecord {
  frame: number;
  x: number;
  y: number;
  ok: boolean;
}

export type Unit = 'px' | 'mm';

// Calibration derived from a two-point scale: pixels-per-mm plus a note that
// records how it was derived, so it travels with the CSV/graph.
export interface Calibration {
  pxPerMm: number;
  note: string;
}

// An analysed clip. Built either from live tracking or an imported CSV, so the
// comparison code has a single shape to work with. Deviations are stored in
// the session's native `unit`; t is in seconds, re-zeroed to the first sample.
export interface Session {
  id: string;
  name: string;
  view: ViewKey;
  unit: Unit;
  t: number[]; // seconds, re-zeroed
  dev: [number, number][]; // Nx2 deviation in `unit`
  source: 'tracked' | 'csv';
  calibNote: string;
}

export interface TrackingProfile {
  name: string;
  accuracy: number; // 0..100
  intervention: number; // 0..100
  fbThresh: number | null;
  errThresh: number;
  autoReanchor: boolean;
  recoverGrace: number | null; // consecutive bad frames tolerated; null = never ask
  reacquireRadius: number;
}
