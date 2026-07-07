// Ported from kneetracker/constants.py + the analysis.py presentation palette.
// The web tracker reproduces the desktop app's behaviour, so these values are
// kept identical to keep exports/graphs consistent with the Python version.

// Lucas-Kanade optical-flow parameters. winSize is fairly large so a slightly
// jittery hand-placed marker still finds enough texture; maxLevel=3 builds a
// 4-level pyramid so we survive moderate motion between frames.
export const LK = {
  winSize: 21,
  maxLevel: 3,
  // TERM_CRITERIA_EPS | TERM_CRITERIA_COUNT, maxCount 30, epsilon 0.01
  criteriaCount: 30,
  criteriaEps: 0.01,
};

export const DEFAULT_FPS = 30.0;

export type ViewKey =
  | 'medial'
  | 'lateral'
  | 'anterior'
  | 'posterior'
  | 'generic';

export interface ViewInfo {
  key: string;
  plane: 'sagittal' | 'frontal' | 'generic';
  primary: string; // primary (horizontal) axis tag
  hLabel: string;
  vLabel: string;
  landmark: string;
  hint: string;
}

// Camera views. The tracked point's raw axes are horizontal/vertical pixels;
// what they *mean* anatomically depends on where the camera stood.
export const VIEW_INFO: Record<ViewKey, ViewInfo> = {
  medial: {
    key: 'm',
    plane: 'sagittal',
    primary: 'A/P',
    hLabel: 'Anterior-posterior (horizontal)',
    vLabel: 'Superior-inferior (vertical)',
    landmark: 'tibial landmark (e.g. tibial tuberosity)',
    hint: 'camera on the inner side of the knee',
  },
  lateral: {
    key: 'l',
    plane: 'sagittal',
    primary: 'A/P',
    hLabel: 'Anterior-posterior (horizontal)',
    vLabel: 'Superior-inferior (vertical)',
    landmark: 'fibular head / lateral joint line',
    hint: 'camera on the outer side of the knee',
  },
  anterior: {
    key: 'a',
    plane: 'frontal',
    primary: 'M/L',
    hLabel: 'Medial-lateral (horizontal)',
    vLabel: 'Superior-inferior (vertical)',
    landmark: 'patella apex',
    hint: 'camera facing the front of the knee',
  },
  posterior: {
    key: 'p',
    plane: 'frontal',
    primary: 'M/L',
    hLabel: 'Medial-lateral (horizontal)',
    vLabel: 'Superior-inferior (vertical)',
    landmark: 'popliteal crease midpoint',
    hint: 'camera facing the back of the knee',
  },
  generic: {
    key: 'g',
    plane: 'generic',
    primary: 'X',
    hLabel: 'Horizontal (x)',
    vLabel: 'Vertical (y)',
    landmark: 'point you want to track',
    hint: 'pick a moment where your point is clearly visible',
  },
};

// Selectable knee views (generic is deliberately excluded from the chooser).
export const VIEWS: ViewKey[] = ['medial', 'lateral', 'anterior', 'posterior'];

// Short secondary-axis tag per plane, for compact stats headers.
export const SEC_TAG: Record<string, string> = {
  sagittal: 'S/I',
  frontal: 'S/I',
  generic: 'Y',
};

// --- Presentation palette (shared with the Python graphs) -------------------
export const PALETTE = {
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  inkSoft: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  primary: '#2a78d6', // primary-axis signal (emphasised)
  secondary: '#8a8781', // secondary-axis signal (recessive)
  warn: '#d03b3b',
};

// Fixed-order categorical palette validated for colour-vision deficiency.
// Assign in order for the comparison overlay.
export const CMP_COLORS = [
  '#2a78d6',
  '#1baf7a',
  '#eda100',
  '#008300',
  '#4a3aa7',
  '#e34948',
  '#e87ba4',
  '#eb6834',
];
