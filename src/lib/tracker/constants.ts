// Tracking parameters and the shared presentation palette.

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

// --- Presentation palette ----------------------------------------------------
export const PALETTE = {
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  inkSoft: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  primary: '#2a78d6', // primary series (emphasised)
  secondary: '#8a8781', // secondary series (recessive)
  warn: '#d03b3b',
};

// Fixed-order categorical palette validated for colour-vision deficiency.
// Used for comparison overlays and for the tracked points on the video.
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

// High-visibility colours for the point markers drawn over video.
export const POINT_COLORS = ['#ff2d2d', '#00d26a', '#2a9dff', '#ffb100'];
