'use client';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { PALETTE } from '../../lib/tracker/constants';
import { seriesStats } from '../../lib/tracker/analysis';
import { downloadSvgAsPng } from '../../lib/tracker/download';
import { getMeasure } from '../../lib/tracker/measures';
import { nearestIndex, niceTicks } from '../../lib/tracker/scale';
import type { Session } from '../../lib/tracker/types';

const W = 860;
const H = 340;
const M = { top: 14, right: 16, bottom: 40, left: 56 };

/**
 * Single-session value chart (joint angle or deviation over time): SVG carries
 * only the plot; the legend and tooltip are real HTML. A crosshair snaps to
 * the nearest sample and the tooltip reads out every series, so no value is
 * gated behind the pixels of a 2px line.
 */
export default function SessionChart({ session }: { session: Session }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverI, setHoverI] = useState<number | null>(null);

  const def = getMeasure(session.measure);
  const unit = session.unit;
  const t = session.t;
  const dx = session.values;
  const dy = session.values2 ?? null;
  const pstat = useMemo(() => seriesStats(dx, t), [dx, t]);

  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const tMin = t.length ? t[0] : 0;
  const tMax = t.length ? t[t.length - 1] : 1;
  const yVals = dy ? dx.concat(dy).concat([0]) : dx.slice();
  const yPad = (Math.max(...yVals) - Math.min(...yVals)) * 0.08 || 1;
  const y0 = Math.min(...yVals) - yPad;
  const y1 = Math.max(...yVals) + yPad;

  const sx = (v: number) => M.left + ((v - tMin) / (tMax - tMin || 1)) * plotW;
  const sy = (v: number) => M.top + (1 - (v - y0) / (y1 - y0 || 1)) * plotH;
  const path = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(t[i]).toFixed(1)},${sy(v).toFixed(1)}`)
      .join(' ');

  const onMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !t.length) return;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * W;
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
          {def.valueLabel}
        </span>
        {dy && (
          <span role="listitem">
            <i className="ktc-key" style={{ background: PALETTE.secondary }} />
            {def.value2Label ?? 'Secondary'}
          </span>
        )}
      </div>

      <div className="ktc-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${def.valueLabel} over time for ${session.name}. Use the data table for exact values.`}
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
          {y0 <= 0 && y1 >= 0 && (
            <line
              x1={M.left}
              x2={M.left + plotW}
              y1={sy(0)}
              y2={sy(0)}
              stroke={PALETTE.baseline}
              strokeWidth={1}
            />
          )}

          {dy && (
            <path
              d={path(dy)}
              fill="none"
              stroke={PALETTE.secondary}
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.9}
            />
          )}
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
              {dy && (
                <circle
                  cx={sx(t[hover])}
                  cy={sy(dy[hover])}
                  r={4.5}
                  fill={PALETTE.secondary}
                  stroke={PALETTE.surface}
                  strokeWidth={2}
                />
              )}
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
            {`${def.valueLabel} (${unit})`}
          </text>
        </svg>

        {hover != null && (
          <div
            className={`ktc-tooltip ${tipFlip ? 'flip' : ''}`}
            style={{ left: `${tipLeftPct}%` }}
          >
            <div className="ktc-tip-time">
              {t[hover].toFixed(2)} s · sample {hover}
            </div>
            <div className="ktc-tip-row">
              <i className="ktc-key" style={{ background: PALETTE.primary }} />
              <b>
                {dx[hover] >= 0 ? '+' : ''}
                {dx[hover].toFixed(2)} {unit}
              </b>
              <span>{def.valueLabel}</span>
            </div>
            {dy && (
              <div className="ktc-tip-row">
                <i className="ktc-key" style={{ background: PALETTE.secondary }} />
                <b>
                  {dy[hover] >= 0 ? '+' : ''}
                  {dy[hover].toFixed(2)} {unit}
                </b>
                <span>{def.value2Label ?? 'Secondary'}</span>
              </div>
            )}
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
            svgRef.current && downloadSvgAsPng(svgRef.current, `${session.name}_chart.png`)
          }
        >
          PNG
        </button>
      </div>
    </div>
  );
}
