'use client';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { PALETTE, SEC_TAG, VIEW_INFO } from '../../lib/tracker/constants';
import { seriesStats } from '../../lib/tracker/analysis';
import { downloadSvgAsPng } from '../../lib/tracker/download';
import { nearestIndex, niceTicks } from '../../lib/tracker/scale';
import type { Session } from '../../lib/tracker/types';

const W = 860;
const H = 340;
const M = { top: 14, right: 16, bottom: 40, left: 56 };

/**
 * Single-session deviation chart: SVG carries only the plot; the legend and
 * tooltip are real HTML. A crosshair snaps to the nearest sample and the
 * tooltip reads out both axes, so no value is gated behind the pixels of a
 * 2px line.
 */
export default function DeviationChart({ session }: { session: Session }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverI, setHoverI] = useState<number | null>(null);

  const info = VIEW_INFO[session.view] ?? VIEW_INFO.anterior;
  const secTag = SEC_TAG[info.plane] ?? 'Y';
  const unit = session.unit;
  const t = session.t;
  const dx = useMemo(() => session.dev.map((p) => p[0]), [session.dev]);
  const dy = useMemo(() => session.dev.map((p) => p[1]), [session.dev]);
  const pstat = useMemo(() => seriesStats(dx, t), [dx, t]);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const tMin = t.length ? t[0] : 0;
  const tMax = t.length ? t[t.length - 1] : 1;
  const yVals = dx.concat(dy).concat([0]);
  const yPad = (Math.max(...yVals) - Math.min(...yVals)) * 0.08 || 1;
  const y0 = Math.min(...yVals) - yPad;
  const y1 = Math.max(...yVals) + yPad;

  const sx = (v: number) => M.left + ((v - tMin) / (tMax - tMin || 1)) * plotW;
  const sy = (v: number) => M.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;
  const path = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(t[i]).toFixed(1)},${sy(v).toFixed(1)}`)
      .join(' ');

  const areaPath = dx.length
    ? `${path(dx)} L${sx(t[t.length - 1]).toFixed(1)},${sy(0).toFixed(1)} L${sx(t[0]).toFixed(1)},${sy(0).toFixed(1)} Z`
    : '';

  const onMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !t.length) return;
      const rect = svg.getBoundingClientRect();
      const frac = (e.clientX - rect.left) / rect.width;
      const vx = frac * W;
      if (vx < M.left - 12 || vx > M.left + plotW + 12) {
        setHoverI(null);
        return;
      }
      const tv = tMin + ((vx - M.left) / plotW) * (tMax - tMin);
      setHoverI(nearestIndex(t, tv));
    },
    [t, tMin, tMax, plotW],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!t.length) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setHoverI((prev) => {
          const base = prev ?? 0;
          const next = e.key === 'ArrowRight' ? base + step : base - step;
          return Math.max(0, Math.min(t.length - 1, next));
        });
      } else if (e.key === 'Escape') {
        setHoverI(null);
      }
    },
    [t.length],
  );

  const hover = hoverI != null && hoverI >= 0 && hoverI < t.length ? hoverI : null;
  const tipLeftPct = hover != null ? (sx(t[hover]) / W) * 100 : 0;
  const tipFlip = tipLeftPct > 58;

  return (
    <div className="ktc">
      <div className="ktc-legend" role="list">
        <span role="listitem">
          <i className="ktc-key" style={{ background: PALETTE.primary }} />
          {info.hLabel} ({info.primary}) — primary
        </span>
        <span role="listitem">
          <i className="ktc-key" style={{ background: PALETTE.secondary }} />
          {info.vLabel} ({secTag}) — secondary
        </span>
      </div>

      <div className="ktc-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Deviation over time for ${session.name}. Use the data table below for exact values.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHoverI(null)}
          onKeyDown={onKey}
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
          {niceTicks(tMin, tMax).map((v) => (
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

          {areaPath && <path d={areaPath} fill={PALETTE.primary} opacity={0.1} />}
          <path
            d={path(dy)}
            fill="none"
            stroke={PALETTE.secondary}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />
          <path
            d={path(dx)}
            fill="none"
            stroke={PALETTE.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* peak marker */}
          {pstat.n > 0 && (
            <circle
              cx={sx(pstat.peakT)}
              cy={sy(pstat.peakSigned)}
              r={4.5}
              fill={PALETTE.primary}
              stroke={PALETTE.surface}
              strokeWidth={2}
            />
          )}

          {/* crosshair + hover markers */}
          {hover != null && (
            <g pointerEvents="none">
              <line
                x1={sx(t[hover])}
                x2={sx(t[hover])}
                y1={M.top}
                y2={M.top + plotH}
                stroke={PALETTE.baseline}
                strokeWidth={1}
              />
              <circle
                cx={sx(t[hover])}
                cy={sy(dy[hover])}
                r={4.5}
                fill={PALETTE.secondary}
                stroke={PALETTE.surface}
                strokeWidth={2}
              />
              <circle
                cx={sx(t[hover])}
                cy={sy(dx[hover])}
                r={5}
                fill={PALETTE.primary}
                stroke={PALETTE.surface}
                strokeWidth={2}
              />
            </g>
          )}

          <text
            x={M.left + plotW / 2}
            y={H - 6}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
          >
            Time since start (s)
          </text>
          <text
            x={14}
            y={M.top + plotH / 2}
            fontSize={11}
            textAnchor="middle"
            fill={PALETTE.inkSoft}
            transform={`rotate(-90 14 ${M.top + plotH / 2})`}
          >
            {`Deviation (${unit})`}
          </text>
        </svg>

        {hover != null && (
          <div
            className={`ktc-tooltip ${tipFlip ? 'flip' : ''}`}
            style={{ left: `${tipLeftPct}%` }}
          >
            <div className="ktc-tip-time">
              {t[hover].toFixed(2)} s · frame {hover}
            </div>
            <div className="ktc-tip-row">
              <i className="ktc-key" style={{ background: PALETTE.primary }} />
              <b>
                {dx[hover] >= 0 ? '+' : ''}
                {dx[hover].toFixed(2)} {unit}
              </b>
              <span>{info.primary}</span>
            </div>
            <div className="ktc-tip-row">
              <i className="ktc-key" style={{ background: PALETTE.secondary }} />
              <b>
                {dy[hover] >= 0 ? '+' : ''}
                {dy[hover].toFixed(2)} {unit}
              </b>
              <span>{secTag}</span>
            </div>
          </div>
        )}
      </div>

      <div className="ktc-footer">
        <span className="kt-hint">
          Peak {pstat.peakSigned >= 0 ? '+' : ''}
          {pstat.peakSigned.toFixed(2)} {unit} at {pstat.peakT.toFixed(2)} s · hover or use ←/→ for exact values
        </span>
        <button
          className="kt-btn kt-btn-ghost kt-btn-sm"
          onClick={() =>
            svgRef.current &&
            downloadSvgAsPng(svgRef.current, `${session.name}_${session.view}_chart.png`)
          }
        >
          PNG
        </button>
      </div>
    </div>
  );
}
