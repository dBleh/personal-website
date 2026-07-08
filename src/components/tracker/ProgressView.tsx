'use client';
import React, { useMemo, useState } from 'react';

import { sessionAxisStats } from '../../lib/tracker/analysis';
import { CMP_COLORS, PALETTE, ViewKey } from '../../lib/tracker/constants';
import { niceTicks } from '../../lib/tracker/scale';
import type { Session, Unit } from '../../lib/tracker/types';

const W = 860;
const H = 300;
const M = { top: 16, right: 20, bottom: 42, left: 56 };
const DAY = 86_400_000;

// Color follows the view (the entity), never the series count.
const VIEW_COLOR: Record<ViewKey, string> = {
  medial: CMP_COLORS[0],
  lateral: CMP_COLORS[1],
  anterior: CMP_COLORS[2],
  posterior: CMP_COLORS[3],
  generic: CMP_COLORS[4],
};

type MetricKey = 'rms' | 'peak' | 'range' | 'std';
const METRICS: { key: MetricKey; label: string; hint: string }[] = [
  { key: 'rms', label: 'RMS', hint: 'overall movement magnitude — the best single stability number' },
  { key: 'peak', label: 'Peak |dev|', hint: 'worst single excursion in the clip' },
  { key: 'range', label: 'Range', hint: 'max minus min deviation' },
  { key: 'std', label: 'Std dev', hint: 'spread around the mean position' },
];

interface Row {
  s: Session;
  dateMs: number;
  view: ViewKey;
  values: Record<MetricKey, number>;
}

/**
 * Cross-day progress: each session is a point (date, metric on the primary
 * axis); a line runs through the per-day mean of each camera view. Built for
 * the returning-user flow — import previous visits' CSVs and the trend
 * appears.
 */
export default function ProgressView({
  sessions,
  onUpdateDate,
  onImportClick,
}: {
  sessions: Session[];
  onUpdateDate: (id: string, date: string) => void;
  onImportClick: () => void;
}) {
  const [metric, setMetric] = useState<MetricKey>('rms');
  const [unitPick, setUnitPick] = useState<Unit | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const units = useMemo(() => {
    const c: Record<Unit, number> = { px: 0, mm: 0 };
    for (const s of sessions) c[s.unit]++;
    return c;
  }, [sessions]);
  const mixed = units.px > 0 && units.mm > 0;
  const unit: Unit = unitPick ?? (units.mm >= units.px ? 'mm' : 'px');

  const rows = useMemo<Row[]>(() => {
    return sessions
      .filter((s) => s.unit === unit)
      .map((s) => {
        const ax = sessionAxisStats(s);
        const dateMs = Date.parse(`${s.date}T00:00:00`);
        return {
          s,
          dateMs: Number.isFinite(dateMs) ? dateMs : Date.now(),
          view: s.view,
          values: {
            rms: ax.primary.rms,
            peak: ax.primary.peak,
            range: ax.primary.range,
            std: ax.primary.std,
          },
        };
      })
      .sort((a, b) => a.dateMs - b.dateMs);
  }, [sessions, unit]);

  const views = useMemo(
    () => Array.from(new Set(rows.map((r) => r.view))),
    [rows],
  );
  const dates = useMemo(
    () => Array.from(new Set(rows.map((r) => r.dateMs))).sort((a, b) => a - b),
    [rows],
  );

  if (sessions.length === 0) {
    return (
      <div className="kt-empty">
        <p className="kt-hint">
          Nothing to chart yet. Track a clip, or import the CSVs you exported on previous
          visits — each carries its assessment date, so a multi-day trend builds automatically.
        </p>
        <button className="kt-btn kt-btn-sm" onClick={onImportClick}>
          Import CSVs from earlier visits
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------- scales
  const x0 = dates[0] ?? Date.now();
  const x1 = dates[dates.length - 1] ?? x0;
  const xPad = Math.max((x1 - x0) * 0.06, DAY * 0.5);
  const xa = x0 - xPad;
  const xb = x1 + xPad;
  const vals = rows.map((r) => r.values[metric]);
  const vMax = vals.length ? Math.max(...vals) : 1;
  const y1v = vMax * 1.12 || 1;
  const sx = (v: number) => M.left + ((v - xa) / (xb - xa || 1)) * (W - M.left - M.right);
  const sy = (v: number) => M.top + (1 - v / (y1v || 1)) * (H - M.top - M.bottom);

  // Per-view line through the per-day mean.
  const lineFor = (view: ViewKey) => {
    const pts: { x: number; y: number }[] = [];
    for (const d of dates) {
      const dayRows = rows.filter((r) => r.view === view && r.dateMs === d);
      if (!dayRows.length) continue;
      const mean =
        dayRows.reduce((acc, r) => acc + r.values[metric], 0) / dayRows.length;
      pts.push({ x: sx(d), y: sy(mean) });
    }
    return pts;
  };

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const tickDates =
    dates.length <= 8
      ? dates
      : dates.filter((_, i) => i % Math.ceil(dates.length / 8) === 0);

  const hoverRow = hoverId ? rows.find((r) => r.s.id === hoverId) ?? null : null;
  const tipLeftPct = hoverRow ? (sx(hoverRow.dateMs) / W) * 100 : 0;
  const metricInfo = METRICS.find((m) => m.key === metric)!;

  return (
    <div>
      <div className="kt-row between" style={{ marginTop: 0 }}>
        <div className="kt-seg" role="tablist" aria-label="Metric">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={metric === m.key}
              className={metric === m.key ? 'on' : ''}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mixed && (
          <div className="kt-seg" role="tablist" aria-label="Unit">
            {(['mm', 'px'] as Unit[]).map((u) => (
              <button
                key={u}
                role="tab"
                aria-selected={unit === u}
                className={unit === u ? 'on' : ''}
                onClick={() => setUnitPick(u)}
              >
                {u} ({units[u]})
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="kt-hint" style={{ marginTop: 2 }}>
        {metricInfo.label}: {metricInfo.hint}. Lower generally means steadier. Each dot is one
        session; lines join the daily average per camera view.
      </p>
      {mixed && (
        <div className="kt-warnbar">
          Your history mixes pixel and millimetre sessions — they can't share one axis, so the
          chart shows one unit at a time.
        </div>
      )}
      {dates.length < 2 && (
        <div className="kt-hint" style={{ marginBottom: 6 }}>
          All {unit} sessions are on one date so far. Come back after the next visit (or import
          older CSVs) and the trend line appears.
        </div>
      )}

      {views.length > 1 && (
        <div className="ktc-legend" role="list">
          {views.map((v) => (
            <span key={v} role="listitem">
              <i className="ktc-key" style={{ background: VIEW_COLOR[v] }} />
              {v} view
            </span>
          ))}
        </div>
      )}

      <div className="ktc-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${metricInfo.label} per session across assessment dates. Exact values are in the table below.`}
          style={{ background: PALETTE.surface }}
          onPointerLeave={() => setHoverId(null)}
        >
          {niceTicks(0, y1v, 4).map((v) => (
            <g key={`y${v}`}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={sy(v)}
                y2={sy(v)}
                stroke={PALETTE.grid}
                strokeWidth={1}
              />
              <text x={M.left - 8} y={sy(v) + 3} fontSize={10} textAnchor="end" fill={PALETTE.muted}>
                {v.toFixed(1)}
              </text>
            </g>
          ))}
          {tickDates.map((d) => (
            <text
              key={d}
              x={sx(d)}
              y={H - M.bottom + 16}
              fontSize={10}
              textAnchor="middle"
              fill={PALETTE.muted}
            >
              {fmtDate(d)}
            </text>
          ))}
          <line
            x1={M.left}
            x2={W - M.right}
            y1={sy(0)}
            y2={sy(0)}
            stroke={PALETTE.baseline}
            strokeWidth={1}
          />

          {views.map((v) => {
            const pts = lineFor(v);
            if (pts.length < 2) return null;
            return (
              <path
                key={v}
                d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke={VIEW_COLOR[v]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.55}
              />
            );
          })}

          {rows.map((r) => (
            <g key={r.s.id}>
              <circle
                cx={sx(r.dateMs)}
                cy={sy(r.values[metric])}
                r={r.s.id === hoverId ? 6 : 4.5}
                fill={VIEW_COLOR[r.view]}
                stroke={PALETTE.surface}
                strokeWidth={2}
              />
              {/* oversized invisible hit target */}
              <circle
                cx={sx(r.dateMs)}
                cy={sy(r.values[metric])}
                r={14}
                fill="transparent"
                onPointerEnter={() => setHoverId(r.s.id)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}

          <text
            x={M.left + (W - M.left - M.right) / 2}
            y={H - 6}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
          >
            Assessment date
          </text>
          <text
            x={14}
            y={M.top + (H - M.top - M.bottom) / 2}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
            transform={`rotate(-90 14 ${M.top + (H - M.top - M.bottom) / 2})`}
          >
            {`${metricInfo.label} (${unit})`}
          </text>
        </svg>

        {hoverRow && (
          <div
            className={`ktc-tooltip ${tipLeftPct > 58 ? 'flip' : ''}`}
            style={{ left: `${tipLeftPct}%` }}
          >
            <div className="ktc-tip-time">
              {hoverRow.s.date} · {hoverRow.s.name}
            </div>
            <div className="ktc-tip-row">
              <i className="ktc-key" style={{ background: VIEW_COLOR[hoverRow.view] }} />
              <b>
                {hoverRow.values[metric].toFixed(2)} {unit}
              </b>
              <span>
                {metricInfo.label} · {hoverRow.view}
              </span>
            </div>
          </div>
        )}
      </div>

      <h4 className="kt-subhead">Session history ({unit})</h4>
      <div className="kt-tablewrap">
        <table className="kt-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Session</th>
              <th>View</th>
              <th className="num">Frames</th>
              <th className="num">RMS</th>
              <th className="num">Peak |dev|</th>
              <th className="num">Range</th>
              <th className="num">Std</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.s.id}>
                <td>
                  <input
                    className="kt-input kt-date-inline"
                    type="date"
                    value={r.s.date}
                    onChange={(e) => e.target.value && onUpdateDate(r.s.id, e.target.value)}
                    aria-label={`Assessment date for ${r.s.name}`}
                  />
                </td>
                <td>
                  <i className="ktc-key" style={{ background: VIEW_COLOR[r.view] }} />
                  {r.s.name}
                </td>
                <td>{r.view}</td>
                <td className="num">{r.s.t.length}</td>
                <td className="num">{r.values.rms.toFixed(2)}</td>
                <td className="num">{r.values.peak.toFixed(2)}</td>
                <td className="num">{r.values.range.toFixed(2)}</td>
                <td className="num">{r.values.std.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="kt-hint" style={{ marginTop: 6 }}>
        Wrong day on an imported file? Edit its date here — exports and this chart update
        immediately.
      </p>
    </div>
  );
}
