// Series statistics and CSV read/write for the motion tracker. Sessions carry
// a value series (angle or deviation) computed from tracked landmark
// positions; see measures.ts for how positions become values.

import { DEFAULT_FPS } from './constants';
import { getMeasure, measureValue } from './measures';
import type { FrameRecord, Session, Unit } from './types';

export interface SeriesStats {
  n: number;
  mean: number;
  min: number;
  max: number;
  range: number;
  std: number;
  rms: number;
  peak: number;
  peakSigned: number;
  peakT: number;
}

/** Full descriptive stats for one 1-D series. */
export function seriesStats(d: number[], t: number[]): SeriesStats {
  const n = d.length;
  if (n === 0) {
    return {
      n: 0,
      mean: 0,
      min: 0,
      max: 0,
      range: 0,
      std: 0,
      rms: 0,
      peak: 0,
      peakSigned: 0,
      peakT: 0,
    };
  }
  let min = d[0];
  let max = d[0];
  let sum = 0;
  let sumSq = 0;
  let iPeak = 0;
  let peakAbs = Math.abs(d[0]);
  for (let i = 0; i < n; i++) {
    const v = d[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    sumSq += v * v;
    const a = Math.abs(v);
    if (a > peakAbs) {
      peakAbs = a;
      iPeak = i;
    }
  }
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (d[i] - mean) * (d[i] - mean);
  const std = Math.sqrt(varSum / n); // population std (ddof=0)
  const rms = Math.sqrt(sumSq / n);
  return {
    n,
    mean,
    min,
    max,
    range: max - min,
    std,
    rms,
    peak: peakAbs,
    peakSigned: d[iPeak],
    peakT: t.length ? t[iPeak] : 0,
  };
}

/** Stats for a session's series, plus labels from its measure. */
export function sessionStats(s: Session): {
  primary: SeriesStats;
  secondary: SeriesStats | null;
  primaryLabel: string;
  secondaryLabel: string;
  duration: number;
} {
  const def = getMeasure(s.measure);
  return {
    primary: seriesStats(s.values, s.t),
    secondary: s.values2 ? seriesStats(s.values2, s.t) : null,
    primaryLabel: def.valueLabel,
    secondaryLabel: def.value2Label ?? 'Secondary',
    duration: s.t.length > 1 ? s.t[s.t.length - 1] - s.t[0] : 0,
  };
}

function cryptoId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID)
      return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Turn tracked frame records into a session by running the measure's recipe
 * over every frame. Angles are unitless in mm terms (always degrees); point
 * measures report px, or mm when a two-point calibration was applied.
 */
export function sessionFromTracking(
  name: string,
  measureKey: string,
  records: FrameRecord[],
  fps: number,
  pxPerMm: number | null,
  calibNote = '',
): Session {
  const def = getMeasure(measureKey);
  const f0 = records[0].frame;
  const t = records.map((r) => (fps ? (r.frame - f0) / fps : r.frame - f0));

  let unit: Unit;
  let values: number[];
  let values2: number[] | undefined;
  if (def.kind === 'point') {
    const scale = pxPerMm ? 1 / pxPerMm : 1;
    unit = pxPerMm ? 'mm' : 'px';
    const x0 = records[0].pts[0].x;
    const y0 = records[0].pts[0].y;
    values = records.map((r) => (r.pts[0].x - x0) * scale);
    values2 = records.map((r) => (r.pts[0].y - y0) * scale);
  } else {
    unit = 'deg';
    values = records.map((r) => measureValue(def, r.pts));
  }

  return {
    id: cryptoId(),
    name,
    measure: def.key,
    unit,
    t,
    values,
    values2,
    source: 'tracked',
    calibNote,
  };
}

// --- CSV ---------------------------------------------------------------------

/**
 * Serialise a session. When the raw frame records are available (tracked this
 * visit) the landmark positions are written too, so the file is a complete
 * data-collection record; imported/restored sessions write the series only.
 */
export function sessionToCsv(s: Session, records: FrameRecord[] | null): string {
  const def = getMeasure(s.measure);
  const meta = [`# motion_tracker`, `measure=${s.measure}`, `unit=${s.unit}`];
  if (s.calibNote) meta.push(`calib=${s.calibNote}`);

  const ptCols = def.points.flatMap((p) => [`${p.id}_x`, `${p.id}_y`]);
  const header = ['frame', 'time_s', ...ptCols, `value_${s.unit}`];
  if (s.values2) header.push(`value2_${s.unit}`);

  const lines = [meta.join(','), header.join(',')];
  for (let i = 0; i < s.values.length; i++) {
    const rec = records ? records[i] : null;
    const cols = [String(rec ? rec.frame : i), s.t[i].toFixed(4)];
    for (let p = 0; p < def.points.length; p++) {
      const pt = rec?.pts[p];
      cols.push(pt ? pt.x.toFixed(3) : '', pt ? pt.y.toFixed(3) : '');
    }
    cols.push(s.values[i].toFixed(4));
    if (s.values2) cols.push(s.values2[i].toFixed(4));
    lines.push(cols.join(','));
  }
  return lines.join('\n') + '\n';
}

/**
 * Read back a motion_tracker CSV. Legacy knee_tracker deviation CSVs (from the
 * previous web version and the Python desktop app) import as single-point
 * sessions, so old data still loads.
 */
export function sessionFromCsv(text: string, filename: string): Session {
  const rows = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split(',').map((c) => c.trim()));
  if (rows.length === 0) throw new Error('Empty CSV');
  const name = filename.replace(/\.[^.]+$/, '');

  // Legacy format: "# knee_tracker" meta + deviation_x_/deviation_y_ columns.
  if (rows[0][0].startsWith('# knee_tracker') || rows[0][0] === 'frame') {
    return legacyFromCsv(rows, name);
  }

  let idx = 0;
  let measure = 'point';
  let calibNote = '';
  if (rows[0][0].startsWith('#')) {
    for (const tok of rows[0]) {
      if (tok.startsWith('measure=')) measure = tok.slice(8);
      else if (tok.startsWith('calib=')) calibNote = tok.slice(6);
    }
    idx = 1;
  }
  const header = rows[idx];
  idx++;
  const valueCol = header.findIndex((h) => h.startsWith('value_'));
  if (!header || header[0] !== 'frame' || valueCol < 0) {
    throw new Error(`Not a motion_tracker CSV: ${filename}`);
  }
  const unit = (header[valueCol].split('_').pop() ?? 'px') as Unit;
  const value2Col = header.findIndex((h) => h.startsWith('value2_'));

  const t: number[] = [];
  const values: number[] = [];
  const values2: number[] = [];
  for (; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length <= valueCol) continue;
    const frame = parseFloat(row[0]);
    t.push(row[1] ? parseFloat(row[1]) : frame / DEFAULT_FPS);
    values.push(parseFloat(row[valueCol]));
    if (value2Col >= 0) values2.push(parseFloat(row[value2Col]));
  }
  if (values.length < 2)
    throw new Error(`CSV has fewer than 2 samples: ${filename}`);

  const t0 = t[0];
  return {
    id: cryptoId(),
    name,
    measure: getMeasure(measure).key,
    unit,
    t: t.map((v) => v - t0),
    values,
    values2: value2Col >= 0 ? values2 : undefined,
    source: 'csv',
    calibNote,
  };
}

function legacyFromCsv(rows: string[][], name: string): Session {
  let idx = 0;
  let calibNote = '';
  if (rows[0][0].startsWith('#')) {
    for (const tok of rows[0]) {
      if (tok.startsWith('calib=')) calibNote = tok.slice(6);
    }
    idx = 1;
  }
  const header = rows[idx];
  idx++;
  if (
    !header ||
    header[0] !== 'frame' ||
    header.length < 6 ||
    !header[4].startsWith('deviation_x_')
  ) {
    throw new Error(`Not a recognised tracker CSV: ${name}`);
  }
  const unit = (header[4].split('_').pop() ?? 'px') as Unit;
  const t: number[] = [];
  const values: number[] = [];
  const values2: number[] = [];
  for (; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length < 6) continue;
    const frame = parseFloat(row[0]);
    t.push(row[1] ? parseFloat(row[1]) : frame / DEFAULT_FPS);
    values.push(parseFloat(row[4]));
    values2.push(parseFloat(row[5]));
  }
  if (values.length < 2) throw new Error(`CSV has fewer than 2 samples: ${name}`);
  const t0 = t[0];
  return {
    id: cryptoId(),
    name,
    measure: 'point',
    unit,
    t: t.map((v) => v - t0),
    values,
    values2,
    source: 'csv',
    calibNote,
  };
}

/**
 * One-row-per-session summary: the full metric set for every session, ready
 * for a spreadsheet. Pure data collection — no metadata beyond the session
 * name and measure.
 */
export function sessionsToSummaryCsv(sessions: Session[]): string {
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const header = [
    'session',
    'measure',
    'unit',
    'calibration',
    'frames',
    'duration_s',
    'mean',
    'min',
    'max',
    'range',
    'std',
    'rms',
    'peak_abs',
    'peak_time_s',
  ];
  const lines = [header.join(',')];
  for (const s of sessions) {
    const st = sessionStats(s);
    const num = (v: number) => v.toFixed(3);
    lines.push(
      [
        esc(s.name),
        s.measure,
        s.unit,
        esc(s.calibNote || 'none'),
        String(st.primary.n),
        st.duration.toFixed(3),
        num(st.primary.mean),
        num(st.primary.min),
        num(st.primary.max),
        num(st.primary.range),
        num(st.primary.std),
        num(st.primary.rms),
        num(st.primary.peak),
        st.primary.peakT.toFixed(3),
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}
