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

// angle3    – included angle at the middle (vertex) point, 0–180°
// incline2  – signed angle of the line p1→p2 vs. horizontal, −90..+90°
// vincline2 – signed angle of the line p1→p2 vs. vertical, −90..+90°
// point     – single-point displacement from the first frame (x and y)
// offset2   – displacement of p2 relative to p1 (a moving landmark tracked
//             against a reference landmark), re-zeroed to the first frame.
//             Cancels whole-limb/camera motion, so it reads true joint
//             translation (e.g. anterior–posterior tibial shift). Length-valued
//             like `point`: px, or mm when a scale calibration is applied.
export type MeasureKind = 'angle3' | 'incline2' | 'vincline2' | 'point' | 'offset2';

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

/**
 * Signed inclination of the line a→b versus vertical, in degrees, folded to
 * −90..+90. Near-vertical body segments (spine, hanging shank, upright
 * forearm) read ≈0 here instead of sitting on the ±90 fold of `inclination`,
 * so rotation and side-bend excursions chart continuously through neutral.
 */
export function vinclination(a: Pt, b: Pt): number {
  let ang = deg(Math.atan2(b.x - a.x, -(b.y - a.y)));
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
    case 'vincline2':
      return vinclination(pts[0], pts[1]);
    case 'point':
      return pts[0].x; // caller re-references against frame 0 and scales
    case 'offset2':
      return pts[1].x - pts[0].x; // caller re-references against frame 0 and scales
  }
}

/**
 * Length-valued measures report a displacement in px (or mm when calibrated)
 * rather than an angle in degrees. These use scale calibration, carry a
 * secondary vertical series, and read out per-axis in the tracker UI.
 */
export function isLengthMeasure(def: MeasureDef): boolean {
  return def.kind === 'point' || def.kind === 'offset2';
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

// Two-point line measure: incline2 tilts vs. horizontal, vincline2 vs.
// vertical. The dashed reference in the overlay is drawn through the first
// point, so list the pivot/lower landmark first.
const line2 = (
  key: string,
  label: string,
  group: string,
  kind: 'incline2' | 'vincline2',
  points: [string, string][],
  valueLabel: string,
  hint: string,
): MeasureDef => ({
  key,
  label,
  group,
  kind,
  points: points.map(([id, l]) => ({ id, label: l })),
  valueLabel,
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
  'hip-rot': line2(
    'hip-rot',
    'Hip internal / external rotation',
    'Lower limb',
    'vincline2',
    [
      ['knee', 'Knee — centre of the patella'],
      ['ankle', 'Ankle — front of the ankle joint'],
    ],
    'Shank swing',
    'Sit with the knee bent 90° over the edge of a chair and film front-on. The shank swings like a pendulum: foot out = internal rotation, foot in = external. Angle of the knee→ankle line vs. vertical.',
  ),
  'tibial-shift': {
    key: 'tibial-shift',
    label: 'Anterior / posterior tibial shift',
    group: 'Lower limb',
    kind: 'offset2',
    points: [
      { id: 'femur', label: 'Femur — lateral femoral condyle / epicondyle (reference)' },
      { id: 'tibia', label: 'Tibia — tibial tuberosity (moving point)' },
    ],
    valueLabel: 'Anterior–posterior shift',
    value2Label: 'Vertical drift',
    hint: 'Film side-on with a stationary, square camera. Tracks the tibial tuberosity relative to the femoral condyle, so whole-leg motion cancels out and the horizontal reading is the anterior (+) / posterior (−) drawer of the tibia. Calibrate the scale for mm. Note: single-camera skin tracking shows the trend, not an instrumented laxity value.',
  },
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
  'shoulder-rot': line2(
    'shoulder-rot',
    'Shoulder internal / external rotation',
    'Upper limb',
    'vincline2',
    [
      ['elbow', 'Elbow — olecranon / point of the elbow'],
      ['wrist', 'Wrist — radial styloid'],
    ],
    'Forearm swing',
    'Lie on your back, shoulder out 90°, elbow bent 90°, forearm pointing at the ceiling. Film from beside the elbow, looking along the upper arm. Angle of the elbow→wrist line vs. vertical (toward the head = external rotation).',
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
  'cervical-flex': line2(
    'cervical-flex',
    'Cervical flexion / extension',
    'Spine',
    'vincline2',
    [
      ['c7', 'C7 — bony bump at the base of the neck'],
      ['ear', 'Ear — ear canal / tragus'],
    ],
    'Neck inclination',
    'Film side-on at shoulder height. Angle of the C7→ear line vs. vertical; nod fully forward, then look fully up — the excursion is cervical flex/ext ROM.',
  ),
  'cervical-side': line2(
    'cervical-side',
    'Cervical side bending',
    'Spine',
    'incline2',
    [
      ['l-eye', 'Left eye — outer corner'],
      ['r-eye', 'Right eye — outer corner'],
    ],
    'Head tilt',
    'Film front-on at head height. Tilt of the eye-to-eye line vs. horizontal as you bring each ear toward its shoulder.',
  ),
  'cervical-rot': line2(
    'cervical-rot',
    'Cervical rotation',
    'Spine',
    'incline2',
    [
      ['l-ear', 'Left ear — top of the ear'],
      ['r-ear', 'Right ear — top of the ear'],
    ],
    'Head rotation',
    'Sit and film from directly above the head, looking straight down. The ear-to-ear line rotates with the head as you turn fully left and right.',
  ),
  'thoracic-flex': line2(
    'thoracic-flex',
    'Thoracic flexion / extension',
    'Spine',
    'vincline2',
    [
      ['t12', 'T12/L1 — spine at the bottom of the ribcage'],
      ['c7', 'C7 — bony bump at the base of the neck'],
    ],
    'Thoracic inclination',
    'Film side-on. Angle of the T12→C7 line vs. vertical as you slump/curl the mid-back, then extend over the back of a chair.',
  ),
  'lumbar-flex': line2(
    'lumbar-flex',
    'Lumbar flexion / extension',
    'Spine',
    'vincline2',
    [
      ['sacrum', 'Sacrum — S2, midline between the PSIS dimples'],
      ['t12', 'T12/L1 — spine at the bottom of the ribcage'],
    ],
    'Lumbar inclination',
    'Film side-on. Angle of the sacrum→T12 line vs. vertical. Pair with pelvic tilt to separate true lumbar motion from hip motion.',
  ),
  'spine-side': line2(
    'spine-side',
    'Spine side bending (thoracolumbar)',
    'Spine',
    'vincline2',
    [
      ['sacrum', 'Sacrum — S2, midline between the PSIS dimples'],
      ['c7', 'C7 — bony bump at the base of the neck'],
    ],
    'Trunk lean',
    'Film from directly behind, standing. Angle of the sacrum→C7 line vs. vertical as you slide a hand down the side of each thigh.',
  ),
  'spine-rot': line2(
    'spine-rot',
    'Spinal rotation (thoracolumbar)',
    'Spine',
    'incline2',
    [
      ['l-shoulder', 'Left shoulder — acromion'],
      ['r-shoulder', 'Right shoulder — acromion'],
    ],
    'Shoulder-line rotation',
    'Sit (to fix the pelvis) and film from directly above. Rotation of the shoulder-to-shoulder line vs. horizontal as you twist fully each way.',
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
