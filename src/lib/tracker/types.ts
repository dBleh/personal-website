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
  // Assessment date (ISO yyyy-mm-dd). Written into the CSV header on export
  // and recovered on import, so multi-day histories survive the round trip.
  date: string;
}

// Case-study metadata entered by the practitioner. Travels into the summary
// CSV and the printable report so exports stand on their own as documents.
export interface StudyInfo {
  client: string;
  date: string; // ISO yyyy-mm-dd
  assessor: string;
  movement: string; // task performed on camera, e.g. "bodyweight squat"
  side: 'left' | 'right' | 'n/a';
  notes: string;
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
