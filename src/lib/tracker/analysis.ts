// Ported from kneetracker/analysis.py: deviation, descriptive stats, and CSV
// read/write in the exact desktop format (so exports interoperate with the
// Python `--compare` and re-import).

import { DEFAULT_FPS, SEC_TAG, VIEW_INFO, VIEWS, ViewKey } from './constants';
import type { Session, StudyInfo, TrackRecord, Unit } from './types';

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

/** Full descriptive stats for one 1-D deviation series. Port of _series_stats. */
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
  const std = Math.sqrt(varSum / n); // population std (ddof=0), matches numpy
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

/** reference xy + Nx2 deviations. Port of compute_deviation. */
export function computeDeviation(
  records: TrackRecord[],
  referenceMode: 'first' | 'mean' = 'first',
): { ref: [number, number]; dev: [number, number][] } {
  let refX: number;
  let refY: number;
  if (referenceMode === 'mean') {
    let sx = 0;
    let sy = 0;
    for (const r of records) {
      sx += r.x;
      sy += r.y;
    }
    refX = sx / records.length;
    refY = sy / records.length;
  } else {
    refX = records[0].x;
    refY = records[0].y;
  }
  const dev = records.map(
    (r) => [r.x - refX, r.y - refY] as [number, number],
  );
  return { ref: [refX, refY], dev };
}

/** Summary stats of a session's primary (horizontal) axis, in its unit. */
export function sessionPrimaryStats(s: Session) {
  const d = s.dev.map((p) => p[0]);
  const st = seriesStats(d, s.t);
  return {
    n: st.n,
    dur: s.t.length > 1 ? s.t[s.t.length - 1] - s.t[0] : 0,
    mean: st.mean,
    range: st.range,
    std: st.std,
    rms: st.rms,
    peak: st.peak,
  };
}

export function primaryLabel(view: ViewKey): string {
  return (VIEW_INFO[view] ?? VIEW_INFO.anterior).primary;
}

/** Stats for both axes of a session, with their anatomical tags. */
export function sessionAxisStats(s: Session): {
  primary: SeriesStats;
  secondary: SeriesStats;
  primaryTag: string;
  secondaryTag: string;
  duration: number;
} {
  const info = VIEW_INFO[s.view] ?? VIEW_INFO.anterior;
  return {
    primary: seriesStats(s.dev.map((p) => p[0]), s.t),
    secondary: seriesStats(s.dev.map((p) => p[1]), s.t),
    primaryTag: info.primary,
    secondaryTag: SEC_TAG[info.plane] ?? 'Y',
    duration: s.t.length > 1 ? s.t[s.t.length - 1] - s.t[0] : 0,
  };
}

// --- CSV ---------------------------------------------------------------------

/**
 * Build a session from live tracking output, applying the mm scale. Port of
 * Session.from_tracking.
 */
export function sessionFromTracking(
  name: string,
  view: ViewKey,
  unit: Unit,
  pxPerMm: number | null,
  records: TrackRecord[],
  devPx: [number, number][],
  fps: number,
  calibNote = '',
  date?: string,
): Session {
  const scale = pxPerMm && unit === 'mm' ? 1.0 / pxPerMm : 1.0;
  const f0 = records[0].frame;
  const t = records.map((r) => (fps ? (r.frame - f0) / fps : r.frame - f0));
  const dev = devPx.map(
    (p) => [p[0] * scale, p[1] * scale] as [number, number],
  );
  return {
    id: cryptoId(),
    name,
    view,
    unit,
    t,
    dev,
    source: 'tracked',
    calibNote,
    date: date || todayIso(),
  };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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
 * Serialise a session to the desktop CSV format. Positions are re-derived from
 * deviations here only for tracked sessions that keep raw px; to keep it simple
 * and lossless we write frame/time/deviation columns. Port of write_csv shape.
 */
export function sessionToCsv(
  s: Session,
  records: TrackRecord[] | null,
  fps: number,
): string {
  const sagittal = (VIEW_INFO[s.view]?.plane ?? '') === 'sagittal';
  const hx = `deviation_x_${s.unit}`;
  const hy = `deviation_y_${s.unit}`;
  const hap = `ap_deviation_${s.unit}`;
  const meta = [`# knee_tracker`, `view=${s.view}`, `unit=${s.unit}`];
  if (s.date) meta.push(`date=${s.date}`);
  if (s.calibNote) meta.push(`calib=${s.calibNote}`);
  const lines: string[] = [];
  lines.push(meta.join(','));
  lines.push(['frame', 'time_s', 'x_px', 'y_px', hx, hy, hap].join(','));

  for (let i = 0; i < s.dev.length; i++) {
    const [dx, dy] = s.dev[i];
    const rec = records ? records[i] : null;
    const frame = rec ? rec.frame : i;
    // Only trust `fps` when we have real frame indices; a session restored
    // from storage/CSV keeps its own timeline.
    const t = rec && fps ? frame / fps : s.t[i];
    const x = rec ? rec.x : 0;
    const y = rec ? rec.y : 0;
    const ap = sagittal ? dx.toFixed(4) : '';
    lines.push(
      [
        String(frame),
        t.toFixed(4),
        x.toFixed(3),
        y.toFixed(3),
        dx.toFixed(4),
        dy.toFixed(4),
        ap,
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}

/**
 * Read back a knee_tracker deviation CSV. Port of read_deviation_csv.
 * `fallbackDate` (e.g. the file's modified date) is used when the CSV predates
 * the `date=` meta field, so multi-day imports still land on a timeline.
 */
export function sessionFromCsv(
  text: string,
  filename: string,
  fallbackDate?: string,
): Session {
  const rows = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split(',').map((c) => c.trim()));
  if (rows.length === 0) throw new Error('Empty CSV');

  let idx = 0;
  let viewMeta: string | null = null;
  let calibNote = '';
  let dateMeta = '';
  if (rows[0][0].startsWith('#')) {
    for (const tok of rows[0]) {
      if (tok.startsWith('view=')) viewMeta = tok.slice(5);
      else if (tok.startsWith('calib=')) calibNote = tok.slice(6);
      else if (tok.startsWith('date=')) dateMeta = tok.slice(5);
    }
    idx = 1;
  }
  const header = rows[idx];
  idx++;
  if (
    !header ||
    header[0] !== 'frame' ||
    header.length < 7 ||
    !header[4].startsWith('deviation_x_')
  ) {
    throw new Error(`Not a knee_tracker deviation CSV: ${filename}`);
  }
  const unit = header[4].split('_').pop() as Unit;

  const t: number[] = [];
  const dev: [number, number][] = [];
  let apSeen = false;
  for (; idx < rows.length; idx++) {
    const row = rows[idx];
    if (row.length < 7) continue;
    const frame = parseFloat(row[0]);
    t.push(row[1] ? parseFloat(row[1]) : frame / DEFAULT_FPS);
    dev.push([parseFloat(row[4]), parseFloat(row[5])]);
    if (row[6] && row[6].length) apSeen = true;
  }
  if (dev.length < 2)
    throw new Error(`CSV has fewer than 2 samples: ${filename}`);

  const t0 = t[0];
  const tZeroed = t.map((v) => v - t0);
  let view: ViewKey;
  if (viewMeta && (VIEW_INFO as Record<string, unknown>)[viewMeta]) {
    view = viewMeta as ViewKey;
  } else {
    view = apSeen ? 'medial' : 'anterior';
  }
  const name = filename.replace(/\.[^.]+$/, '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateMeta)
    ? dateMeta
    : fallbackDate || todayIso();
  return {
    id: cryptoId(),
    name,
    view,
    unit,
    t: tZeroed,
    dev,
    source: 'csv',
    calibNote,
    date,
  };
}

/**
 * One-row-per-session summary CSV for case studies: study metadata plus the
 * full metric set for both axes, ready to drop into a spreadsheet and
 * aggregate across visits.
 */
export function sessionsToSummaryCsv(
  sessions: Session[],
  study: StudyInfo,
): string {
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const header = [
    'client',
    'assessment_date',
    'assessor',
    'movement',
    'side',
    'session',
    'session_date',
    'view',
    'plane',
    'landmark',
    'unit',
    'calibration',
    'frames',
    'duration_s',
    'primary_axis',
    'primary_mean',
    'primary_min',
    'primary_max',
    'primary_range',
    'primary_std',
    'primary_rms',
    'primary_peak',
    'primary_peak_time_s',
    'secondary_axis',
    'secondary_mean',
    'secondary_min',
    'secondary_max',
    'secondary_range',
    'secondary_std',
    'secondary_rms',
    'secondary_peak',
    'secondary_peak_time_s',
    'notes',
  ];
  const lines = [header.join(',')];
  for (const s of sessions) {
    const info = VIEW_INFO[s.view] ?? VIEW_INFO.anterior;
    const ax = sessionAxisStats(s);
    const num = (v: number) => v.toFixed(3);
    lines.push(
      [
        esc(study.client),
        esc(study.date),
        esc(study.assessor),
        esc(study.movement),
        study.side,
        esc(s.name),
        s.date,
        s.view,
        info.plane,
        esc(info.landmark),
        s.unit,
        esc(s.calibNote || 'none (pixel units)'),
        String(ax.primary.n),
        ax.duration.toFixed(3),
        ax.primaryTag,
        num(ax.primary.mean),
        num(ax.primary.min),
        num(ax.primary.max),
        num(ax.primary.range),
        num(ax.primary.std),
        num(ax.primary.rms),
        num(ax.primary.peak),
        ax.primary.peakT.toFixed(3),
        ax.secondaryTag,
        num(ax.secondary.mean),
        num(ax.secondary.min),
        num(ax.secondary.max),
        num(ax.secondary.range),
        num(ax.secondary.std),
        num(ax.secondary.rms),
        num(ax.secondary.peak),
        ax.secondary.peakT.toFixed(3),
        esc(study.notes),
      ].join(','),
    );
  }
  return lines.join('\n') + '\n';
}

export { VIEWS };
