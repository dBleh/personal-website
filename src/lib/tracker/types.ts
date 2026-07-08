// One tracked frame: the position of every measurement point plus whether the
// optical-flow match on that frame was verified good (bad frames are
// coasted/flagged and can be fixed by hand in review).
export interface FrameRecord {
  frame: number;
  pts: { x: number; y: number; ok: boolean }[];
}

export type Unit = 'px' | 'mm' | 'deg';

// An analysed clip. Built either from live tracking or an imported CSV, so
// charts and stats have a single shape to work with. `values` is the measure's
// primary series (joint angle, inclination, or horizontal deviation);
// `values2` exists only for point measures (vertical deviation). t is in
// seconds, re-zeroed to the first sample.
export interface Session {
  id: string;
  name: string;
  measure: string; // MeasureDef key; see measures.ts
  unit: Unit;
  t: number[];
  values: number[];
  values2?: number[];
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
