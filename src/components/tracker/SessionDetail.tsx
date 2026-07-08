'use client';
import React, { useMemo, useState } from 'react';

import { sessionStats } from '../../lib/tracker/analysis';
import { getMeasure } from '../../lib/tracker/measures';
import type { Session } from '../../lib/tracker/types';
import SessionChart from './SessionChart';

const MAX_TABLE_ROWS = 1500;

/**
 * Results panel for one session: headline stat tiles (ROM-first for angle
 * measures), an interactive chart or a full data table (tabbed), and the
 * per-series statistics as real HTML.
 */
export default function SessionDetail({
  session,
  onExportCsv,
}: {
  session: Session;
  onExportCsv: () => void;
}) {
  const [tab, setTab] = useState<'chart' | 'table'>('chart');
  const def = getMeasure(session.measure);
  const st = useMemo(() => sessionStats(session), [session]);
  const unit = session.unit;
  const isAngle = unit === 'deg';

  const tiles: { label: string; value: string; sub: string }[] = isAngle
    ? [
        {
          label: 'Range of motion',
          value: `${st.primary.range.toFixed(1)} ${unit}`,
          sub: `${st.primary.min.toFixed(1)} to ${st.primary.max.toFixed(1)}`,
        },
        {
          label: 'Min angle',
          value: `${st.primary.min.toFixed(1)} ${unit}`,
          sub: 'smallest angle reached',
        },
        {
          label: 'Max angle',
          value: `${st.primary.max.toFixed(1)} ${unit}`,
          sub: 'largest angle reached',
        },
        {
          label: 'Mean angle',
          value: `${st.primary.mean.toFixed(1)} ${unit}`,
          sub: 'average over the clip',
        },
      ]
    : [
        {
          label: `Peak ${def.valueLabel.toLowerCase()}`,
          value: `${st.primary.peakSigned >= 0 ? '+' : ''}${st.primary.peakSigned.toFixed(1)} ${unit}`,
          sub: `at ${st.primary.peakT.toFixed(2)} s`,
        },
        {
          label: 'Range',
          value: `${st.primary.range.toFixed(1)} ${unit}`,
          sub: `${st.primary.min.toFixed(1)} to ${st.primary.max.toFixed(1)}`,
        },
        {
          label: 'RMS',
          value: `${st.primary.rms.toFixed(2)} ${unit}`,
          sub: 'overall movement magnitude',
        },
        {
          label: 'Std dev',
          value: `${st.primary.std.toFixed(2)} ${unit}`,
          sub: 'spread around the mean',
        },
      ];

  // Decimate very long clips so the table stays responsive; full resolution
  // is always available in the CSV export.
  const step = Math.max(1, Math.ceil(session.t.length / MAX_TABLE_ROWS));
  const tableRows = useMemo(() => {
    const rows: { i: number; t: number; p: number; s: number | null }[] = [];
    for (let i = 0; i < session.t.length; i += step) {
      rows.push({
        i,
        t: session.t[i],
        p: session.values[i],
        s: session.values2 ? session.values2[i] : null,
      });
    }
    return rows;
  }, [session, step]);

  const statRows: [string, typeof st.primary][] = [[def.valueLabel, st.primary]];
  if (st.secondary) statRows.push([st.secondaryLabel, st.secondary]);

  return (
    <div>
      <div className="kt-detail-head">
        <div>
          <h3 className="kt-detail-title">{session.name}</h3>
          <div className="kt-hint">
            {def.label} · {st.primary.n} frames · {st.duration.toFixed(2)} s · {unit}
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
        <SessionChart session={session} />
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
                  {def.valueLabel} ({unit})
                </th>
                {session.values2 && (
                  <th className="num">
                    {st.secondaryLabel} ({unit})
                  </th>
                )}
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
                  {r.s != null && (
                    <td className="num">
                      {r.s >= 0 ? '+' : ''}
                      {r.s.toFixed(3)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="kt-subhead">Statistics ({unit})</h4>
      <div className="kt-tablewrap">
        <table className="kt-table">
          <thead>
            <tr>
              <th>Series</th>
              <th className="num">Mean</th>
              <th className="num">Min</th>
              <th className="num">Max</th>
              <th className="num">Range</th>
              <th className="num">Std</th>
              <th className="num">RMS</th>
              <th className="num">Peak |v|</th>
              <th className="num">Peak t (s)</th>
            </tr>
          </thead>
          <tbody>
            {statRows.map(([label, s], i) => (
              <tr key={label} className={i === 0 ? 'primary' : ''}>
                <td>{label}</td>
                <td className="num">{signed(s.mean)}</td>
                <td className="num">{signed(s.min)}</td>
                <td className="num">{signed(s.max)}</td>
                <td className="num">{s.range.toFixed(2)}</td>
                <td className="num">{s.std.toFixed(2)}</td>
                <td className="num">{s.rms.toFixed(2)}</td>
                <td className="num">{s.peak.toFixed(2)}</td>
                <td className="num">{s.peakT.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="kt-glossary">
        <summary>What these numbers mean</summary>
        <dl>
          {isAngle ? (
            <>
              <dt>{def.valueLabel}</dt>
              <dd>
                The angle computed from the tracked landmarks on every frame, in degrees.
              </dd>
              <dt>Range of motion</dt>
              <dd>Max minus min angle — the total excursion achieved during the clip.</dd>
            </>
          ) : (
            <>
              <dt>{def.valueLabel}</dt>
              <dd>
                How far the landmark has moved from its position on the first tracked frame, in{' '}
                {unit}. Positive and negative are the two directions along the axis.
              </dd>
              <dt>Range</dt>
              <dd>Max minus min — the total envelope the landmark wandered through.</dd>
            </>
          )}
          <dt>Mean</dt>
          <dd>Average value over the clip.</dd>
          <dt>Min / Max</dt>
          <dd>The smallest and largest values reached.</dd>
          <dt>Std dev</dt>
          <dd>Spread around the mean — lower means steadier.</dd>
          <dt>RMS</dt>
          <dd>Root-mean-square value — a single overall-magnitude number.</dd>
          <dt>Peak |v|</dt>
          <dd>The single largest absolute value, with the moment it happened as peak t.</dd>
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
