'use client';
import React, { useMemo, useRef } from 'react';

import { PALETTE, SEC_TAG, VIEW_INFO } from '../../lib/tracker/constants';
import { seriesStats } from '../../lib/tracker/analysis';
import { downloadSvgAsPng } from '../../lib/tracker/download';
import type { Session } from '../../lib/tracker/types';

const W = 900;
const H = 660;
const M = { top: 70, right: 30, bottom: 210, left: 70 };

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    return [min - 1, min, min + 1];
  }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step =
    (norm >= 5 ? 5 : norm >= 2 ? 2 : norm >= 1 ? 1 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(v);
  return ticks;
}

export default function DeviationChart({
  session,
  title,
}: {
  session: Session;
  title?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const info = VIEW_INFO[session.view] ?? VIEW_INFO.anterior;
  const secTag = SEC_TAG[info.plane] ?? 'sec';
  const unit = session.unit;

  const t = session.t;
  const dx = useMemo(() => session.dev.map((p) => p[0]), [session.dev]);
  const dy = useMemo(() => session.dev.map((p) => p[1]), [session.dev]);
  const pstat = useMemo(() => seriesStats(dx, t), [dx, t]);
  const sstat = useMemo(() => seriesStats(dy, t), [dy, t]);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const tMin = t.length ? t[0] : 0;
  const tMax = t.length ? t[t.length - 1] : 1;
  const yVals = dx.concat(dy).concat([0]);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const yPad = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;

  const sx = (v: number) =>
    M.left + ((v - tMin) / (tMax - tMin || 1)) * plotW;
  const sy = (v: number) => M.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;

  const path = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(t[i]).toFixed(1)},${sy(v).toFixed(1)}`)
      .join(' ');

  const areaPath =
    dx.length > 0
      ? `${path(dx)} L${sx(t[t.length - 1]).toFixed(1)},${sy(0).toFixed(1)} L${sx(t[0]).toFixed(1)},${sy(0).toFixed(1)} Z`
      : '';

  const xticks = niceTicks(tMin, tMax);
  const yticks = niceTicks(y0, y1);
  const dur = t.length > 1 ? t[t.length - 1] - t[0] : 0;

  const baseTitle =
    title ??
    `${session.view.charAt(0).toUpperCase() + session.view.slice(1)} view — knee deviation`;

  // Stats table rows.
  const rows: [string, string, string][] = [
    ['mean', fmt(pstat.mean, '+'), fmt(sstat.mean, '+')],
    [
      'min / max',
      `${fmt(pstat.min, '+')} / ${fmt(pstat.max, '+')}`,
      `${fmt(sstat.min, '+')} / ${fmt(sstat.max, '+')}`,
    ],
    ['range (max−min)', fmt(pstat.range), fmt(sstat.range)],
    ['std dev', fmt(pstat.std), fmt(sstat.std)],
    ['RMS', fmt(pstat.rms), fmt(sstat.rms)],
    ['peak |deviation|', fmt(pstat.peak), fmt(sstat.peak)],
    ['peak time (s)', pstat.peakT.toFixed(2), sstat.peakT.toFixed(2)],
  ];
  const tableTop = M.top + plotH + 66;
  const rowH = 19;
  const c0 = M.left;
  const c1 = M.left + plotW * 0.36;
  const c2 = M.left + plotW * 0.68;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, background: PALETTE.surface, borderRadius: 8 }}
        role="img"
        aria-label={baseTitle}
      >
        <rect x={0} y={0} width={W} height={H} fill={PALETTE.surface} />
        {/* Titles */}
        <text x={M.left} y={30} fontSize={19} fontWeight={700} fill={PALETTE.ink}>
          {baseTitle}
        </text>
        <text x={M.left} y={49} fontSize={11} fill={PALETTE.inkSoft}>
          {`${cap(session.view)} view (${info.plane} plane)  ·  landmark: ${info.landmark}  ·  unit: ${unit === 'mm' ? 'mm (calibrated)' : 'px (uncalibrated)'}`}
        </text>
        <text x={M.left} y={63} fontSize={11} fill={PALETTE.muted}>
          {`${pstat.n} frames  ·  ${dur.toFixed(2)} s`}
          {session.calibNote ? `  ·  scale: ${session.calibNote}` : ''}
        </text>

        {/* Grid + axes */}
        {yticks.map((v) => (
          <g key={`y${v}`}>
            <line
              x1={M.left}
              x2={M.left + plotW}
              y1={sy(v)}
              y2={sy(v)}
              stroke={PALETTE.grid}
              strokeWidth={0.8}
            />
            <text x={M.left - 8} y={sy(v) + 3} fontSize={9} textAnchor="end" fill={PALETTE.muted}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {xticks.map((v) => (
          <g key={`x${v}`}>
            <text x={sx(v)} y={M.top + plotH + 16} fontSize={9} textAnchor="middle" fill={PALETTE.muted}>
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {/* zero baseline */}
        <line x1={M.left} x2={M.left + plotW} y1={sy(0)} y2={sy(0)} stroke={PALETTE.baseline} strokeWidth={1} />

        {/* series */}
        {areaPath && <path d={areaPath} fill={PALETTE.primary} opacity={0.08} />}
        <path d={path(dy)} fill="none" stroke={PALETTE.secondary} strokeWidth={1.4} opacity={0.9} />
        <path d={path(dx)} fill="none" stroke={PALETTE.primary} strokeWidth={2} />

        {/* peak marker */}
        {pstat.n > 0 && (
          <>
            <circle cx={sx(pstat.peakT)} cy={sy(pstat.peakSigned)} r={4} fill={PALETTE.primary} />
            <text
              x={sx(pstat.peakT)}
              y={sy(pstat.peakSigned) + (pstat.peakSigned >= 0 ? -10 : 16)}
              fontSize={10}
              fontWeight={700}
              textAnchor="middle"
              fill={PALETTE.ink}
            >
              {`peak ${fmt(pstat.peakSigned, '+')} ${unit} @ ${pstat.peakT.toFixed(2)}s`}
            </text>
          </>
        )}

        {/* axis labels */}
        <text x={M.left + plotW / 2} y={M.top + plotH + 40} fontSize={11} textAnchor="middle" fill={PALETTE.inkSoft}>
          Time since start (s)
        </text>
        <text
          x={18}
          y={M.top + plotH / 2}
          fontSize={11}
          textAnchor="middle"
          fill={PALETTE.inkSoft}
          transform={`rotate(-90 18 ${M.top + plotH / 2})`}
        >
          {`Deviation (${unit})`}
        </text>

        {/* legend */}
        <g>
          <line x1={M.left + plotW - 250} x2={M.left + plotW - 232} y1={M.top + 14} y2={M.top + 14} stroke={PALETTE.primary} strokeWidth={2} />
          <text x={M.left + plotW - 228} y={M.top + 17} fontSize={9.5} fill={PALETTE.inkSoft}>
            {`${info.hLabel} (${info.primary}) — primary`}
          </text>
          <line x1={M.left + plotW - 250} x2={M.left + plotW - 232} y1={M.top + 30} y2={M.top + 30} stroke={PALETTE.secondary} strokeWidth={1.6} />
          <text x={M.left + plotW - 228} y={M.top + 33} fontSize={9.5} fill={PALETTE.inkSoft}>
            {`${info.vLabel} (${secTag}) — secondary`}
          </text>
        </g>

        {/* stats table */}
        <g>
          <text x={c0} y={tableTop - 14} fontSize={11} fontWeight={700} fill={PALETTE.inkSoft}>
            Per-axis statistics ({unit})
          </text>
          <rect x={c1 - 8} y={tableTop - 2} width={c2 - c1} height={rowH * (rows.length + 1)} fill="#eaf2fc" />
          <text x={c0} y={tableTop + 12} fontSize={10} fontWeight={700} fill={PALETTE.inkSoft}>metric</text>
          <text x={c1} y={tableTop + 12} fontSize={10} fontWeight={700} fill={PALETTE.primary}>{`${info.primary} · primary`}</text>
          <text x={c2} y={tableTop + 12} fontSize={10} fontWeight={700} fill={PALETTE.inkSoft}>{secTag}</text>
          {rows.map((r, i) => {
            const yy = tableTop + 12 + (i + 1) * rowH;
            return (
              <g key={r[0]}>
                <text x={c0} y={yy} fontSize={10} fill={PALETTE.inkSoft}>{r[0]}</text>
                <text x={c1} y={yy} fontSize={10} fill={PALETTE.ink}>{r[1]}</text>
                <text x={c2} y={yy} fontSize={10} fill={PALETTE.inkSoft}>{r[2]}</text>
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ marginTop: 8 }}>
        <button
          className="kt-btn kt-btn-ghost"
          onClick={() =>
            svgRef.current &&
            downloadSvgAsPng(svgRef.current, `${session.name}_${session.view}_deviation.png`)
          }
        >
          Download graph (PNG)
        </button>
      </div>
    </div>
  );
}

function fmt(v: number, sign?: '+'): string {
  const s = v.toFixed(2);
  return sign === '+' && v >= 0 ? `+${s}` : s;
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
