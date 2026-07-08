'use client';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { CMP_COLORS, PALETTE } from '../../lib/tracker/constants';
import { sessionAxisStats } from '../../lib/tracker/analysis';
import { downloadSvgAsPng } from '../../lib/tracker/download';
import { nearestIndex, niceTicks } from '../../lib/tracker/scale';
import type { Session } from '../../lib/tracker/types';

const W = 860;
const H = 340;
const M = { top: 14, right: 16, bottom: 40, left: 56 };

/**
 * Overlay of the primary-axis deviation of several sessions. The SVG is plot
 * only; identity, values, and stats live in the HTML legend, crosshair
 * tooltip, and metrics table below.
 */
export default function ComparisonChart({ sessions }: { sessions: Session[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverT, setHoverT] = useState<number | null>(null);

  const units = new Set(sessions.map((s) => s.unit));
  const mixed = units.size > 1;
  const unitLabel = mixed ? 'mixed units' : Array.from(units)[0] ?? 'px';

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const { tMax, yMin, yMax } = useMemo(() => {
    let tMax = 0;
    let yMin = 0;
    let yMax = 0;
    for (const s of sessions) {
      if (s.t.length) tMax = Math.max(tMax, s.t[s.t.length - 1]);
      for (const p of s.dev) {
        if (p[0] < yMin) yMin = p[0];
        if (p[0] > yMax) yMax = p[0];
      }
    }
    return { tMax: tMax || 1, yMin, yMax };
  }, [sessions]);

  const yPad = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;
  const sx = (v: number) => M.left + (v / tMax) * plotW;
  const sy = (v: number) => M.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

  const line = (s: Session) =>
    s.dev
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(s.t[i]).toFixed(1)},${sy(p[0]).toFixed(1)}`)
      .join(' ');

  const onMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * W;
      if (vx < M.left - 12 || vx > M.left + plotW + 12) {
        setHoverT(null);
        return;
      }
      setHoverT(((vx - M.left) / plotW) * tMax);
    },
    [plotW, tMax],
  );

  // Per-session sample nearest the hovered time (skipped once a clip has ended).
  const hoverRows =
    hoverT == null
      ? null
      : sessions.map((s, i) => {
          if (!s.t.length) return null;
          const idx = nearestIndex(s.t, hoverT);
          const dt = Math.abs(s.t[idx] - hoverT);
          const tol = Math.max(0.25, tMax / 40);
          if (dt > tol) return null;
          return { s, i, idx, v: s.dev[idx][0] };
        });

  const tipLeftPct = hoverT != null ? (sx(hoverT) / W) * 100 : 0;
  const tipFlip = tipLeftPct > 58;

  return (
    <div className="ktc">
      <div className="ktc-legend" role="list">
        {sessions.map((s, i) => (
          <span key={s.id} role="listitem">
            <i className="ktc-key" style={{ background: CMP_COLORS[i % CMP_COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
      {mixed && (
        <div className="kt-warnbar">
          Sessions mix px and mm — curve magnitudes are not directly comparable. Calibrate
          clips (or import calibrated CSVs) to compare in millimetres.
        </div>
      )}

      <div className="ktc-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Comparison of primary-axis deviation across sessions. Use the table below for exact values."
          onPointerMove={onMove}
          onPointerLeave={() => setHoverT(null)}
          style={{ background: PALETTE.surface }}
        >
          {niceTicks(y0, y1).map((v) => (
            <g key={`y${v}`}>
              <line
                x1={M.left}
                x2={M.left + plotW}
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
          {niceTicks(0, tMax).map((v) => (
            <text
              key={`x${v}`}
              x={sx(v)}
              y={M.top + plotH + 16}
              fontSize={10}
              textAnchor="middle"
              fill={PALETTE.muted}
            >
              {v.toFixed(1)}
            </text>
          ))}
          <line
            x1={M.left}
            x2={M.left + plotW}
            y1={sy(0)}
            y2={sy(0)}
            stroke={PALETTE.baseline}
            strokeWidth={1}
          />

          {sessions.map((s, i) => (
            <path
              key={s.id}
              d={line(s)}
              fill="none"
              stroke={CMP_COLORS[i % CMP_COLORS.length]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hoverT != null && hoverRows && (
            <g pointerEvents="none">
              <line
                x1={sx(hoverT)}
                x2={sx(hoverT)}
                y1={M.top}
                y2={M.top + plotH}
                stroke={PALETTE.baseline}
                strokeWidth={1}
              />
              {hoverRows.map(
                (r) =>
                  r && (
                    <circle
                      key={r.s.id}
                      cx={sx(r.s.t[r.idx])}
                      cy={sy(r.v)}
                      r={4.5}
                      fill={CMP_COLORS[r.i % CMP_COLORS.length]}
                      stroke={PALETTE.surface}
                      strokeWidth={2}
                    />
                  ),
              )}
            </g>
          )}

          <text
            x={M.left + plotW / 2}
            y={H - 6}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
          >
            Time since start of tracking (s)
          </text>
          <text
            x={14}
            y={M.top + plotH / 2}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
            transform={`rotate(-90 14 ${M.top + plotH / 2})`}
          >
            {`Primary-axis deviation (${unitLabel})`}
          </text>
        </svg>

        {hoverT != null && hoverRows && hoverRows.some(Boolean) && (
          <div
            className={`ktc-tooltip ${tipFlip ? 'flip' : ''}`}
            style={{ left: `${tipLeftPct}%` }}
          >
            <div className="ktc-tip-time">{hoverT.toFixed(2)} s</div>
            {hoverRows.map(
              (r) =>
                r && (
                  <div className="ktc-tip-row" key={r.s.id}>
                    <i
                      className="ktc-key"
                      style={{ background: CMP_COLORS[r.i % CMP_COLORS.length] }}
                    />
                    <b>
                      {r.v >= 0 ? '+' : ''}
                      {r.v.toFixed(2)} {r.s.unit}
                    </b>
                    <span>{r.s.name}</span>
                  </div>
                ),
            )}
          </div>
        )}
      </div>

      <div className="ktc-footer">
        <span className="kt-hint">
          Each curve is time-zeroed to its own start; showing the primary clinical axis (A/P
          sagittal, M/L frontal).
        </span>
        <button
          className="kt-btn kt-btn-ghost kt-btn-sm"
          onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, 'comparison_chart.png')}
        >
          PNG
        </button>
      </div>

      <div className="kt-tablewrap">
        <table className="kt-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>View</th>
              <th>Unit</th>
              <th className="num">Frames</th>
              <th className="num">Duration (s)</th>
              <th className="num">Mean</th>
              <th className="num">Range</th>
              <th className="num">Std</th>
              <th className="num">RMS</th>
              <th className="num">Peak</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const ax = sessionAxisStats(s);
              return (
                <tr key={s.id}>
                  <td>
                    <i
                      className="ktc-key"
                      style={{ background: CMP_COLORS[i % CMP_COLORS.length] }}
                    />
                    {s.name}
                  </td>
                  <td>{s.view}</td>
                  <td>{s.unit}</td>
                  <td className="num">{ax.primary.n}</td>
                  <td className="num">{ax.duration.toFixed(2)}</td>
                  <td className="num">
                    {ax.primary.mean >= 0 ? '+' : ''}
                    {ax.primary.mean.toFixed(2)}
                  </td>
                  <td className="num">{ax.primary.range.toFixed(2)}</td>
                  <td className="num">{ax.primary.std.toFixed(2)}</td>
                  <td className="num">{ax.primary.rms.toFixed(2)}</td>
                  <td className="num">{ax.primary.peak.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
