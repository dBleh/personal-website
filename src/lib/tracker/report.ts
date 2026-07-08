// Printable case-study report: a self-contained HTML document (inline CSS +
// inline SVG, no external resources) built from the study metadata and the
// analysed sessions. Open it in a new tab and print to PDF, or save the file
// alongside client records.

import {
  primaryLabel,
  sessionAxisStats,
  SeriesStats,
} from './analysis';
import { CMP_COLORS, PALETTE, VIEW_INFO } from './constants';
import type { Session, StudyInfo } from './types';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmt = (v: number, sign = false) => {
  const s = v.toFixed(2);
  return sign && v >= 0 ? `+${s}` : s;
};

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const step0 = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) out.push(v);
  return out;
}

interface SeriesSpec {
  t: number[];
  d: number[];
  color: string;
  width: number;
  opacity?: number;
}

/** Static SVG line plot (print-friendly, no interactivity). */
function svgPlot(
  series: SeriesSpec[],
  yLabel: string,
  opts?: { area?: boolean },
): string {
  const W = 760;
  const H = 280;
  const M = { top: 14, right: 16, bottom: 40, left: 56 };
  const pw = W - M.left - M.right;
  const ph = H - M.top - M.bottom;

  let tMin = Infinity;
  let tMax = -Infinity;
  let yMin = 0;
  let yMax = 0;
  for (const s of series) {
    if (!s.t.length) continue;
    tMin = Math.min(tMin, s.t[0]);
    tMax = Math.max(tMax, s.t[s.t.length - 1]);
    for (const v of s.d) {
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
  }
  if (!isFinite(tMin)) {
    tMin = 0;
    tMax = 1;
  }
  const yPad = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;
  const sx = (v: number) => M.left + ((v - tMin) / (tMax - tMin || 1)) * pw;
  const sy = (v: number) => M.top + (1 - (v - y0) / (y1 - y0 || 1)) * ph;
  const path = (t: number[], d: number[]) =>
    d
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(t[i]).toFixed(1)},${sy(v).toFixed(1)}`)
      .join(' ');

  const parts: string[] = [];
  parts.push(
    `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="background:${PALETTE.surface};border-radius:6px">`,
  );
  for (const v of niceTicks(y0, y1)) {
    parts.push(
      `<line x1="${M.left}" x2="${M.left + pw}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}" stroke="${PALETTE.grid}" stroke-width="1"/>`,
      `<text x="${M.left - 6}" y="${(sy(v) + 3).toFixed(1)}" font-size="9" text-anchor="end" fill="${PALETTE.muted}">${v.toFixed(1)}</text>`,
    );
  }
  for (const v of niceTicks(tMin, tMax)) {
    parts.push(
      `<text x="${sx(v).toFixed(1)}" y="${M.top + ph + 14}" font-size="9" text-anchor="middle" fill="${PALETTE.muted}">${v.toFixed(1)}</text>`,
    );
  }
  parts.push(
    `<line x1="${M.left}" x2="${M.left + pw}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}" stroke="${PALETTE.baseline}" stroke-width="1"/>`,
  );
  if (opts?.area && series.length) {
    const s = series[series.length - 1];
    if (s.d.length) {
      parts.push(
        `<path d="${path(s.t, s.d)} L${sx(s.t[s.t.length - 1]).toFixed(1)},${sy(0).toFixed(1)} L${sx(s.t[0]).toFixed(1)},${sy(0).toFixed(1)} Z" fill="${s.color}" opacity="0.1"/>`,
      );
    }
  }
  for (const s of series) {
    parts.push(
      `<path d="${path(s.t, s.d)}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linejoin="round" stroke-linecap="round"${s.opacity != null ? ` opacity="${s.opacity}"` : ''}/>`,
    );
  }
  parts.push(
    `<text x="${M.left + pw / 2}" y="${H - 6}" font-size="10" text-anchor="middle" fill="${PALETTE.inkSoft}">Time since start (s)</text>`,
    `<text x="12" y="${M.top + ph / 2}" font-size="10" text-anchor="middle" fill="${PALETTE.inkSoft}" transform="rotate(-90 12 ${M.top + ph / 2})">${esc(yLabel)}</text>`,
    '</svg>',
  );
  return parts.join('');
}

function metricsRows(tag: string, st: SeriesStats): string {
  const cells = [
    tag,
    fmt(st.mean, true),
    `${fmt(st.min, true)} / ${fmt(st.max, true)}`,
    fmt(st.range),
    fmt(st.std),
    fmt(st.rms),
    fmt(st.peak),
    st.peakT.toFixed(2),
  ];
  return `<tr>${cells
    .map((c, i) => `<td class="${i === 0 ? 'axis' : 'num'}">${esc(c)}</td>`)
    .join('')}</tr>`;
}

function sessionSection(s: Session, index: number): string {
  const info = VIEW_INFO[s.view] ?? VIEW_INFO.anterior;
  const ax = sessionAxisStats(s);
  const chart = svgPlot(
    [
      {
        t: s.t,
        d: s.dev.map((p) => p[1]),
        color: PALETTE.secondary,
        width: 1.4,
        opacity: 0.9,
      },
      { t: s.t, d: s.dev.map((p) => p[0]), color: PALETTE.primary, width: 2 },
    ],
    `Deviation (${s.unit})`,
    { area: true },
  );
  return `
  <section class="session">
    <h3>${index + 1}. ${esc(s.name)}</h3>
    <p class="meta">
      ${esc(s.date)} ·
      ${esc(cap(s.view))} view (${esc(info.plane)} plane) ·
      landmark: ${esc(info.landmark)} ·
      ${ax.primary.n} frames · ${ax.duration.toFixed(2)} s ·
      unit: ${s.unit === 'mm' ? 'mm (calibrated)' : 'px (uncalibrated)'}${
        s.calibNote ? ` · scale: ${esc(s.calibNote)}` : ''
      }
    </p>
    <div class="legend">
      <span><i class="key" style="background:${PALETTE.primary}"></i>${esc(info.hLabel)} (${esc(ax.primaryTag)}) — primary</span>
      <span><i class="key" style="background:${PALETTE.secondary}"></i>${esc(info.vLabel)} (${esc(ax.secondaryTag)}) — secondary</span>
    </div>
    ${chart}
    <table class="metrics">
      <thead>
        <tr><th>axis</th><th>mean</th><th>min / max</th><th>range</th><th>std</th><th>RMS</th><th>peak |dev|</th><th>peak t (s)</th></tr>
      </thead>
      <tbody>
        ${metricsRows(`${ax.primaryTag} (primary)`, ax.primary)}
        ${metricsRows(ax.secondaryTag, ax.secondary)}
      </tbody>
    </table>
    <p class="unit-note">All metrics in ${s.unit}.</p>
  </section>`;
}

function comparisonSection(sessions: Session[]): string {
  const units = new Set(sessions.map((s) => s.unit));
  const mixed = units.size > 1;
  const unitLabel = mixed ? 'mixed units' : Array.from(units)[0] ?? 'px';
  const chart = svgPlot(
    sessions.map((s, i) => ({
      t: s.t,
      d: s.dev.map((p) => p[0]),
      color: CMP_COLORS[i % CMP_COLORS.length],
      width: 2,
    })),
    `Primary-axis deviation (${unitLabel})`,
  );
  const rows = sessions
    .map((s, i) => {
      const ax = sessionAxisStats(s);
      return `<tr>
        <td><i class="key" style="background:${CMP_COLORS[i % CMP_COLORS.length]}"></i>${esc(s.name)}</td>
        <td>${esc(s.view)}</td><td>${s.unit}</td>
        <td class="num">${ax.primary.n}</td>
        <td class="num">${ax.duration.toFixed(2)}</td>
        <td class="num">${fmt(ax.primary.mean, true)}</td>
        <td class="num">${fmt(ax.primary.range)}</td>
        <td class="num">${fmt(ax.primary.std)}</td>
        <td class="num">${fmt(ax.primary.rms)}</td>
        <td class="num">${fmt(ax.primary.peak)}</td>
      </tr>`;
    })
    .join('');
  return `
  <section class="session">
    <h3>Session comparison — primary-axis deviation</h3>
    <p class="meta">Curves are time-zeroed to the start of each session's tracking; the primary clinical
    axis is ${esc(primaryLabel(sessions[0].view))} for the first session's view (A/P for sagittal, M/L for frontal).
    ${mixed ? '<strong>Sessions mix px and mm — magnitudes are not directly comparable.</strong>' : ''}</p>
    ${chart}
    <table class="metrics">
      <thead>
        <tr><th>session</th><th>view</th><th>unit</th><th>frames</th><th>dur (s)</th><th>mean</th><th>range</th><th>std</th><th>RMS</th><th>peak</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildReportHtml(
  study: StudyInfo,
  sessions: Session[],
): string {
  const generated = new Date().toLocaleString();
  const metaRows: [string, string][] = [
    ['Client', study.client || '—'],
    ['Assessment date', study.date || '—'],
    ['Assessor', study.assessor || '—'],
    ['Movement / task', study.movement || '—'],
    ['Side assessed', study.side === 'n/a' ? '—' : study.side],
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Knee Stability Report${study.client ? ` — ${esc(study.client)}` : ''}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2.2rem 1.5rem 3rem;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: ${PALETTE.ink}; background: #fff; line-height: 1.5;
  }
  .page { max-width: 800px; margin: 0 auto; }
  header h1 { font-size: 1.5rem; margin: 0 0 0.15rem; }
  header .sub { color: ${PALETTE.inkSoft}; font-size: 0.85rem; margin: 0 0 1.2rem; }
  table.study { border-collapse: collapse; width: 100%; margin-bottom: 1.6rem; }
  table.study td { padding: 0.3rem 0.6rem; border: 1px solid ${PALETTE.grid}; font-size: 0.85rem; }
  table.study td.k { width: 11rem; color: ${PALETTE.inkSoft}; font-weight: 600; background: #f7f7f5; }
  .notes { border: 1px solid ${PALETTE.grid}; border-radius: 6px; padding: 0.6rem 0.8rem;
    font-size: 0.85rem; margin-bottom: 1.6rem; white-space: pre-wrap; }
  .notes .k { font-weight: 600; color: ${PALETTE.inkSoft}; display: block; margin-bottom: 0.2rem; }
  .session { margin-bottom: 2rem; break-inside: avoid; }
  .session h3 { font-size: 1.05rem; margin: 0 0 0.15rem; }
  .meta { color: ${PALETTE.inkSoft}; font-size: 0.8rem; margin: 0 0 0.5rem; }
  .legend { display: flex; gap: 1.2rem; flex-wrap: wrap; font-size: 0.75rem;
    color: ${PALETTE.inkSoft}; margin-bottom: 0.4rem; }
  .legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
  .key { display: inline-block; width: 14px; height: 3px; border-radius: 2px; margin-right: 0.35rem; }
  .legend .key { margin-right: 0; }
  table.metrics { border-collapse: collapse; width: 100%; margin-top: 0.6rem;
    font-size: 0.8rem; }
  table.metrics th, table.metrics td { padding: 0.28rem 0.5rem; border: 1px solid ${PALETTE.grid}; text-align: left; }
  table.metrics th { background: #f7f7f5; color: ${PALETTE.inkSoft}; font-weight: 600; }
  table.metrics td.num { font-variant-numeric: tabular-nums; text-align: right; }
  table.metrics td.axis { font-weight: 600; }
  .unit-note { color: ${PALETTE.muted}; font-size: 0.72rem; margin: 0.25rem 0 0; }
  footer { margin-top: 2.5rem; padding-top: 0.8rem; border-top: 1px solid ${PALETTE.grid};
    color: ${PALETTE.muted}; font-size: 0.72rem; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
  .no-print { margin-bottom: 1.4rem; }
  .no-print button { font: inherit; font-weight: 600; padding: 0.45rem 0.9rem;
    border-radius: 6px; border: 1px solid ${PALETTE.grid}; background: #f7f7f5; cursor: pointer; }
</style>
</head>
<body>
<div class="page">
  <div class="no-print"><button onclick="window.print()">Print / save as PDF</button></div>
  <header>
    <h1>Knee Stability Assessment Report</h1>
    <p class="sub">Video landmark tracking · generated ${esc(generated)}</p>
  </header>
  <table class="study"><tbody>
    ${metaRows
      .map(
        ([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`,
      )
      .join('')}
  </tbody></table>
  ${study.notes ? `<div class="notes"><span class="k">Clinical notes</span>${esc(study.notes)}</div>` : ''}
  ${sessions.map((s, i) => sessionSection(s, i)).join('')}
  ${sessions.length >= 2 ? comparisonSection(sessions) : ''}
  <footer>
    Method: a user-marked anatomical landmark is tracked frame-by-frame with Lucas–Kanade
    optical flow; deviation is measured against the clip's reference position.
    Uncalibrated sessions report pixels; calibrated sessions use a two-point mm scale.
    Generated by the Knee Stability Tracker (in-browser; video never leaves the device).
    For movement observation only — not a diagnostic instrument.
  </footer>
</div>
</body>
</html>`;
}

/** Open the report in a new tab, ready to print / save as PDF. */
export function openReport(html: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
