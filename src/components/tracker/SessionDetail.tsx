'use client';
import React, { useMemo, useState } from 'react';

import { sessionAxisStats } from '../../lib/tracker/analysis';
import { VIEW_INFO } from '../../lib/tracker/constants';
import type { Session } from '../../lib/tracker/types';
import DeviationChart from './DeviationChart';

const MAX_TABLE_ROWS = 1500;

/**
 * Results panel for one session: headline stat tiles, an interactive chart or
 * a full data table (tabbed), and the per-axis statistics as real HTML.
 */
export default function SessionDetail({
  session,
  onExportCsv,
}: {
  session: Session;
  onExportCsv: () => void;
}) {
  const [tab, setTab] = useState<'chart' | 'table'>('chart');
  const info = VIEW_INFO[session.view] ?? VIEW_INFO.anterior;
  const ax = useMemo(() => sessionAxisStats(session), [session]);
  const unit = session.unit;

  const tiles: { label: string; value: string; sub: string }[] = [
    {
      label: `Peak deviation (${ax.primaryTag})`,
      value: `${ax.primary.peakSigned >= 0 ? '+' : ''}${ax.primary.peakSigned.toFixed(1)} ${unit}`,
      sub: `at ${ax.primary.peakT.toFixed(2)} s`,
    },
    {
      label: `Range (${ax.primaryTag})`,
      value: `${ax.primary.range.toFixed(1)} ${unit}`,
      sub: `${ax.primary.min.toFixed(1)} to ${ax.primary.max.toFixed(1)}`,
    },
    {
      label: `RMS (${ax.primaryTag})`,
      value: `${ax.primary.rms.toFixed(2)} ${unit}`,
      sub: 'overall movement magnitude',
    },
    {
      label: `Std dev (${ax.primaryTag})`,
      value: `${ax.primary.std.toFixed(2)} ${unit}`,
      sub: 'spread around the mean',
    },
  ];

  // Decimate very long clips so the table stays responsive; full resolution
  // is always available in the CSV export.
  const step = Math.max(1, Math.ceil(session.t.length / MAX_TABLE_ROWS));
  const tableRows = useMemo(() => {
    const rows: { i: number; t: number; p: number; s: number }[] = [];
    for (let i = 0; i < session.t.length; i += step) {
      rows.push({
        i,
        t: session.t[i],
        p: session.dev[i][0],
        s: session.dev[i][1],
      });
    }
    return rows;
  }, [session, step]);

  return (
    <div>
      <div className="kt-detail-head">
        <div>
          <h3 className="kt-detail-title">{session.name}</h3>
          <div className="kt-hint">
            {cap(session.view)} view ({info.plane} plane) · landmark: {info.landmark} ·{' '}
            {ax.primary.n} frames · {ax.duration.toFixed(2)} s ·{' '}
            {unit === 'mm' ? 'mm (calibrated)' : 'px (uncalibrated)'}
            {session.calibNote ? ` · ${session.calibNote}` : ''}
          </div>
        </div>
        <div className="kt-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'chart'}
            className={tab === 'chart' ? 'on' : ''}
            onClick={() => setTab('chart')}
          >
            Chart
          </button>
          <button
            role="tab"
            aria-selected={tab === 'table'}
            className={tab === 'table' ? 'on' : ''}
            onClick={() => setTab('table')}
          >
            Data
          </button>
        </div>
      </div>

      <div className="kt-tiles">
        {tiles.map((tile) => (
          <div className="kt-tile" key={tile.label}>
            <div className="kt-tile-label">{tile.label}</div>
            <div className="kt-tile-value">{tile.value}</div>
            <div className="kt-tile-sub">{tile.sub}</div>
          </div>
        ))}
      </div>

      {tab === 'chart' ? (
        <DeviationChart session={session} />
      ) : (
        <div className="kt-tablewrap tall">
          {step > 1 && (
            <div className="kt-hint" style={{ padding: '0.4rem 0.6rem' }}>
              Showing every {step}
              {ordinal(step)} sample for speed — the CSV export contains every frame.
            </div>
          )}
          <table className="kt-table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th className="num">Time (s)</th>
                <th className="num">
                  {ax.primaryTag} ({unit})
                </th>
                <th className="num">
                  {ax.secondaryTag} ({unit})
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r.i}>
                  <td className="num">{r.i}</td>
                  <td className="num">{r.t.toFixed(3)}</td>
                  <td className="num">
                    {r.p >= 0 ? '+' : ''}
                    {r.p.toFixed(3)}
                  </td>
                  <td className="num">
                    {r.s >= 0 ? '+' : ''}
                    {r.s.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="kt-subhead">Per-axis statistics ({unit})</h4>
      <div className="kt-tablewrap">
        <table className="kt-table">
          <thead>
            <tr>
              <th>Axis</th>
              <th className="num">Mean</th>
              <th className="num">Min</th>
              <th className="num">Max</th>
              <th className="num">Range</th>
              <th className="num">Std</th>
              <th className="num">RMS</th>
              <th className="num">Peak |dev|</th>
              <th className="num">Peak t (s)</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                [`${ax.primaryTag} — ${info.hLabel}`, ax.primary, true],
                [`${ax.secondaryTag} — ${info.vLabel}`, ax.secondary, false],
              ] as const
            ).map(([label, st, primary]) => (
              <tr key={label} className={primary ? 'primary' : ''}>
                <td>{label}</td>
                <td className="num">{signed(st.mean)}</td>
                <td className="num">{signed(st.min)}</td>
                <td className="num">{signed(st.max)}</td>
                <td className="num">{st.range.toFixed(2)}</td>
                <td className="num">{st.std.toFixed(2)}</td>
                <td className="num">{st.rms.toFixed(2)}</td>
                <td className="num">{st.peak.toFixed(2)}</td>
                <td className="num">{st.peakT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="kt-glossary">
        <summary>What these numbers mean</summary>
        <dl>
          <dt>Deviation</dt>
          <dd>
            How far the landmark has moved from its reference position (the first tracked frame
            or the clip mean, per your capture settings), in {unit}. Positive and negative are
            the two directions along each axis.
          </dd>
          <dt>{ax.primaryTag} — primary axis</dt>
          <dd>
            {info.hLabel.toLowerCase()}. For a {session.view} view this is the clinically
            interesting direction, so it leads every chart and table.
          </dd>
          <dt>{ax.secondaryTag} — secondary axis</dt>
          <dd>
            {info.vLabel.toLowerCase()}. Mostly reflects the movement itself (e.g. squat depth)
            rather than stability, so it is drawn recessively.
          </dd>
          <dt>Mean</dt>
          <dd>
            Average deviation over the clip. Its sign shows which side of the reference the
            landmark spent most of its time on.
          </dd>
          <dt>Min / Max</dt>
          <dd>The farthest excursion reached in each direction along the axis.</dd>
          <dt>Range</dt>
          <dd>Max minus min — the total envelope the landmark wandered through.</dd>
          <dt>Std dev</dt>
          <dd>
            Spread around the mean position. Lower = steadier; it ignores where the landmark
            sat, only how much it wobbled.
          </dd>
          <dt>RMS</dt>
          <dd>
            Root-mean-square deviation from the reference — the best single "how much did it
            move overall" number, and the default metric on the Progress tab.
          </dd>
          <dt>Peak |dev|</dt>
          <dd>
            The single largest excursion (ignoring direction), with the moment it happened
            shown as peak t. Useful for spotting the worst instant of a repetition.
          </dd>
        </dl>
      </details>

      <div className="kt-row" style={{ marginTop: '0.75rem' }}>
        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={onExportCsv}>
          Download raw data (CSV)
        </button>
      </div>
    </div>
  );
}

function signed(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}
function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][Math.min(n % 10, 4)] ?? 'th';
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
