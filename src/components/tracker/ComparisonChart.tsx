'use client';
import React, { useMemo, useRef } from 'react';

import { CMP_COLORS, PALETTE } from '../../lib/tracker/constants';
import { primaryLabel, sessionPrimaryStats } from '../../lib/tracker/analysis';
import { downloadSvgAsPng } from '../../lib/tracker/download';
import type { Session } from '../../lib/tracker/types';

const W = 940;
const M = { top: 74, right: 30, bottom: 40, left: 70 };

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(v);
  return ticks;
}

export default function ComparisonChart({
  sessions,
  title,
}: {
  sessions: Session[];
  title?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const units = new Set(sessions.map((s) => s.unit));
  const mixed = units.size > 1;
  const unitLabel = mixed ? 'mixed units' : Array.from(units)[0] ?? 'px';

  const tableRowH = 20;
  const tableH = 34 + tableRowH * sessions.length;
  const H = 430 + tableH;
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom - tableH;

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

  const xticks = niceTicks(0, tMax);
  const yticks = niceTicks(y0, y1);
  const tableTop = M.top + plotH + 54;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, background: PALETTE.surface, borderRadius: 8 }}
        role="img"
        aria-label="Session comparison"
      >
        <rect x={0} y={0} width={W} height={H} fill={PALETTE.surface} />
        <text x={M.left} y={30} fontSize={19} fontWeight={700} fill={PALETTE.ink}>
          {title ?? 'Session comparison — primary-axis deviation'}
        </text>
        <text x={M.left} y={50} fontSize={11} fill={PALETTE.inkSoft}>
          Each session time-zeroed to the start of its tracking; curves show the primary clinical axis (A/P for
          sagittal, M/L for frontal).
        </text>
        {mixed && (
          <text x={W - M.right} y={50} fontSize={11} fontWeight={700} textAnchor="end" fill={PALETTE.warn}>
            ! mixed px/mm — magnitudes not comparable
          </text>
        )}

        {yticks.map((v) => (
          <g key={`y${v}`}>
            <line x1={M.left} x2={M.left + plotW} y1={sy(v)} y2={sy(v)} stroke={PALETTE.grid} strokeWidth={0.8} />
            <text x={M.left - 8} y={sy(v) + 3} fontSize={9} textAnchor="end" fill={PALETTE.muted}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {xticks.map((v) => (
          <text key={`x${v}`} x={sx(v)} y={M.top + plotH + 16} fontSize={9} textAnchor="middle" fill={PALETTE.muted}>
            {v.toFixed(1)}
          </text>
        ))}
        <line x1={M.left} x2={M.left + plotW} y1={sy(0)} y2={sy(0)} stroke={PALETTE.baseline} strokeWidth={1} />

        {sessions.map((s, i) => (
          <path key={s.id} d={line(s)} fill="none" stroke={CMP_COLORS[i % CMP_COLORS.length]} strokeWidth={1.9} />
        ))}

        <text x={M.left + plotW / 2} y={M.top + plotH + 34} fontSize={11} textAnchor="middle" fill={PALETTE.inkSoft}>
          Time since start of tracking (s)
        </text>
        <text
          x={18}
          y={M.top + plotH / 2}
          fontSize={11}
          textAnchor="middle"
          fill={PALETTE.inkSoft}
          transform={`rotate(-90 18 ${M.top + plotH / 2})`}
        >
          {`Primary-axis deviation (${unitLabel})`}
        </text>

        {/* stats table */}
        <g>
          {['session', 'view', 'unit', 'frames', 'dur', 'mean', 'range', 'std', 'RMS', 'peak'].map((h, i) => (
            <text
              key={h}
              x={M.left + 22 + i * ((plotW - 22) / 10)}
              y={tableTop}
              fontSize={10}
              fontWeight={700}
              fill={PALETTE.inkSoft}
            >
              {h}
            </text>
          ))}
          {sessions.map((s, r) => {
            const st = sessionPrimaryStats(s);
            const yy = tableTop + 6 + (r + 1) * tableRowH;
            const cells = [
              s.name.slice(0, 22),
              s.view,
              s.unit,
              String(st.n),
              st.dur.toFixed(2),
              (st.mean >= 0 ? '+' : '') + st.mean.toFixed(2),
              st.range.toFixed(2),
              st.std.toFixed(2),
              st.rms.toFixed(2),
              st.peak.toFixed(2),
            ];
            return (
              <g key={s.id}>
                <rect x={M.left} y={yy - 12} width={14} height={10} fill={CMP_COLORS[r % CMP_COLORS.length]} />
                {cells.map((c, i) => (
                  <text
                    key={i}
                    x={M.left + 22 + i * ((plotW - 22) / 10)}
                    y={yy}
                    fontSize={10}
                    fill={i === 0 ? PALETTE.ink : PALETTE.inkSoft}
                  >
                    {c}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ marginTop: 8 }}>
        <button
          className="kt-btn kt-btn-ghost"
          onClick={() => svgRef.current && downloadSvgAsPng(svgRef.current, 'comparison.png')}
        >
          Download comparison (PNG)
        </button>
      </div>
      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
        Legend swatches match each session&apos;s curve. {primaryLabel(sessions[0]?.view ?? 'anterior')} shown.
      </p>
    </div>
  );
}
