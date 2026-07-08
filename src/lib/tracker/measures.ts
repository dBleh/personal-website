// Reusable measurement definitions. Every measurement is a small recipe:
// which landmarks to track, and how to turn their per-frame positions into a
// value series (a joint angle, a segment inclination, or a raw displacement).
// Adding a new joint is one entry in MEASURES — the tracker, charts, CSV
// import/export, and stats all key off this table.

export interface Pt {
  x: number;
  y: number;
}

export interface PointDef {
  id: string; // short slug, used for CSV column names
  label: string; // what to click on the video
}

// angle3   – included angle at the middle (vertex) point, 0–180°
// incline2 – signed angle of the line p1→p2 vs. horizontal, −90..+90°
// point    – single-point displacement from the first frame (x and y)
export type MeasureKind = 'angle3' | 'incline2' | 'point';

export interface MeasureDef {
  key: string;
  label: string;
  group: string;
  kind: MeasureKind;
  points: PointDef[];
  valueLabel: string; // what the primary series means
  value2Label?: string; // secondary series (point kind only)
  hint: string; // camera / landmark guidance shown in the UI
}

const deg = (rad: number) => (rad * 180) / Math.PI;

/** Included angle at vertex b between rays b→a and b→c, in degrees (0–180). */
export function angleAt(a: Pt, b: Pt, c: Pt): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 < 1e-9 || n2 < 1e-9) return 0;
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return deg(Math.acos(cos));
}

/**
 * Signed inclination of the line a→b versus horizontal, in degrees. Screen y
 * grows downward, so the sign is flipped to read "up = positive". Folded to
 * −90..+90 so swapping the two landmarks doesn't flip the magnitude.
 */
export function inclination(a: Pt, b: Pt): number {
  let ang = deg(Math.atan2(-(b.y - a.y), b.x - a.x));
  if (ang > 90) ang -= 180;
  if (ang < -90) ang += 180;
  return ang;
}

/** Per-frame value of a measure given that frame's tracked points. */
export function measureValue(def: MeasureDef, pts: Pt[]): number {
  switch (def.kind) {
    case 'angle3':
      return angleAt(pts[0], pts[1], pts[2]);
    case 'incline2':
      return inclination(pts[0], pts[1]);
    case 'point':
      return pts[0].x; // caller re-references against frame 0 and scales
  }
}

const angle3 = (
  key: string,
  label: string,
  group: string,
  points: [string, string][],
  hint: string,
): MeasureDef => ({
  key,
  label,
  group,
  kind: 'angle3',
  points: points.map(([id, l]) => ({ id, label: l })),
  valueLabel: 'Joint angle',
  hint,
});

export const MEASURES: Record<string, MeasureDef> = {
  'knee-flex': angle3(
    'knee-flex',
    'Knee flexion / extension',
    'Lower limb',
    [
      ['hip', 'Hip — greater trochanter'],
      ['knee', 'Knee — lateral joint line (vertex)'],
      ['ankle', 'Ankle — lateral malleolus'],
    ],
    'Film side-on. ROM is the change in the hip–knee–ankle angle (straight leg ≈ 180°).',
  ),
  'hip-flex': angle3(
    'hip-flex',
    'Hip flexion / extension',
    'Lower limb',
    [
      ['trunk', 'Trunk — mid-axillary line / shoulder'],
      ['hip', 'Hip — greater trochanter (vertex)'],
      ['knee', 'Knee — lateral joint line'],
    ],
    'Film side-on. Angle between the trunk line and the femur (standing tall ≈ 180°).',
  ),
  'ankle-flex': angle3(
    'ankle-flex',
    'Ankle dorsi / plantar flexion',
    'Lower limb',
    [
      ['knee', 'Knee — lateral joint line'],
      ['ankle', 'Ankle — lateral malleolus (vertex)'],
      ['toe', 'Foot — 5th metatarsal head'],
    ],
    'Film side-on. Angle between the shank and the foot.',
  ),
  'shoulder-flex': angle3(
    'shoulder-flex',
    'Shoulder flexion / abduction',
    'Upper limb',
    [
      ['hip', 'Hip — greater trochanter'],
      ['shoulder', 'Shoulder — acromion (vertex)'],
      ['elbow', 'Elbow — lateral epicondyle'],
    ],
    'Film side-on for flexion, front-on for abduction. Angle between trunk and humerus (arm down ≈ 0–10°).',
  ),
  'elbow-flex': angle3(
    'elbow-flex',
    'Elbow flexion / extension',
    'Upper limb',
    [
      ['shoulder', 'Shoulder — acromion'],
      ['elbow', 'Elbow — lateral epicondyle (vertex)'],
      ['wrist', 'Wrist — radial styloid'],
    ],
    'Film side-on to the arm. Straight arm ≈ 180°.',
  ),
  'wrist-flex': angle3(
    'wrist-flex',
    'Wrist flexion / extension',
    'Upper limb',
    [
      ['elbow', 'Forearm — mid-forearm or lateral epicondyle'],
      ['wrist', 'Wrist — radial styloid (vertex)'],
      ['hand', 'Hand — 2nd knuckle (MCP)'],
    ],
    'Film side-on to the forearm with the thumb up. Neutral wrist ≈ 180°.',
  ),
  'pelvic-tilt': {
    key: 'pelvic-tilt',
    label: 'Pelvic tilt (anterior / posterior)',
    group: 'Pelvis',
    kind: 'incline2',
    points: [
      { id: 'asis', label: 'ASIS — front of the pelvis' },
      { id: 'psis', label: 'PSIS — back of the pelvis' },
    ],
    valueLabel: 'Pelvic inclination',
    hint: 'Film side-on at pelvis height. The ASIS–PSIS line angle vs. horizontal; the change over the clip is the tilt excursion.',
  },
  'pelvic-shift': {
    key: 'pelvic-shift',
    label: 'Lateral pelvic shift',
    group: 'Pelvis',
    kind: 'point',
    points: [{ id: 'pelvis', label: 'Pelvis midpoint — sacrum / S2' }],
    valueLabel: 'Lateral shift',
    value2Label: 'Vertical drift',
    hint: 'Film front-on or from behind. Horizontal drift of the pelvis midpoint from its start position.',
  },
  point: {
    key: 'point',
    label: 'Single point (any landmark)',
    group: 'General',
    kind: 'point',
    points: [{ id: 'point', label: 'Any landmark you want to track' }],
    valueLabel: 'Horizontal deviation',
    value2Label: 'Vertical deviation',
    hint: 'The classic knee-stability mode: track one landmark and chart its drift on both axes.',
  },
};

export const DEFAULT_MEASURE = 'knee-flex';

export function getMeasure(key: string): MeasureDef {
  return MEASURES[key] ?? MEASURES.point;
}

/** Measure keys grouped for a <select> with <optgroup>s, in a stable order. */
export function measureGroups(): { group: string; defs: MeasureDef[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, MeasureDef[]>();
  for (const def of Object.values(MEASURES)) {
    if (!byGroup.has(def.group)) {
      byGroup.set(def.group, []);
      order.push(def.group);
    }
    byGroup.get(def.group)!.push(def);
  }
  return order.map((group) => ({ group, defs: byGroup.get(group)! }));
}
