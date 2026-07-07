'use client';

import React from 'react';
import Link from 'next/link';
import useMediaQuery from '../../hooks/useMediaQuery';
import VerticalNavigation from '../../components/VerticalNavigation';

export default function Guide() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const navItems = [
    { id: 'overview-section', label: 'Overview' },
    { id: 'steps-section', label: 'How to use' },
    { id: 'views-section', label: 'Camera views' },
    { id: 'faq-section', label: 'Notes & FAQ' },
  ];

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        .info-card {
            background-color: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid #e5e7eb;
            margin-bottom: 1.5rem;
        }
        .section-heading {
             font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; color: #1f2937;
        }
        .step-num {
            display: inline-flex; align-items: center; justify-content: center;
            width: 1.75rem; height: 1.75rem; border-radius: 9999px;
            background: #2563eb; color: #fff; font-weight: 700; font-size: 0.9rem;
            margin-right: 0.6rem; flex-shrink: 0;
        }
        .step-row { display: flex; align-items: flex-start; margin-bottom: 1.1rem; }
        .step-row h3 { margin: 0 0 0.2rem 0; font-size: 1.05rem; color: #111827; }
        .step-row p { margin: 0; color: #374151; line-height: 1.6; }
        .description-list { padding-left: 1.25rem; color: #374151; list-style-type: disc; line-height: 1.6; }
        .description-list li { margin-bottom: 0.5rem; }
      `}</style>

      {!isMobile && <VerticalNavigation items={navItems} />}

      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.75rem',
            color: '#1f2937',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '0.5rem',
          }}
        >
          How to use the Knee Tracker
        </h1>
        <p style={{ color: '#4b5563', lineHeight: 1.7, marginBottom: '2rem' }}>
          A guide to measuring knee stability from a video. Everything runs in your browser —
          your videos are never uploaded.{' '}
          <Link href="/" style={{ color: '#2563eb', fontWeight: 600 }}>
            Open the tracker →
          </Link>
        </p>

        <section id="overview-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Overview</h2>
          <div className="info-card">
            <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
              You mark an anatomical landmark (for example the patella apex or a tibial point) on one
              frame of a pre-recorded clip. The app follows that point across every frame using
              Lucas–Kanade optical flow, then graphs how far it drifts from its starting position over
              time. Track several clips — left vs. right knee, or the same knee across appointments —
              and overlay them on a single comparison graph with summary statistics.
            </p>
          </div>
        </section>

        <section id="steps-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Step by step</h2>
          <div className="info-card">
            {[
              {
                t: 'Load a video',
                d: 'Drag a clip onto the drop zone or click to choose a file. It stays on your device. The tracking engine loads once in the background.',
              },
              {
                t: 'Choose the camera view',
                d: 'Pick medial/lateral (side-on, measures anterior–posterior movement) or anterior/posterior (front/back, measures medial–lateral). This sets the axis labels only.',
              },
              {
                t: 'Scrub to a good start frame',
                d: 'Use the slider or the frame-step buttons to land on a frame where the landmark sits on clear, textured detail.',
              },
              {
                t: 'Mark the landmark',
                d: 'With “Mark landmark” selected, click the exact point on the video. A crosshair shows where it will track from.',
              },
              {
                t: '(Optional) Calibrate to millimetres',
                d: 'Switch to “Calibrate”, click two points a known distance apart (e.g. a 100 mm marker in shot), type that distance, and Apply. Skip this to report in pixels.',
              },
              {
                t: 'Track',
                d: 'Press “Track from this frame”. Watch it run live. Pause any time; while paused you can click the video to re-anchor a drifting point. Finish & keep saves the data; Abort discards it.',
              },
              {
                t: 'Read the graph & export',
                d: 'A deviation-vs-time graph with a per-axis stats table appears. Download it as PNG, or export the raw data as CSV (compatible with the desktop app).',
              },
              {
                t: 'Compare sessions',
                d: 'Track more clips, switch on Compare mode, tick two or more sessions, and they overlay on one time-zeroed graph with a stats table.',
              },
            ].map((s, i) => (
              <div className="step-row" key={s.t}>
                <span className="step-num">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="views-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Camera views</h2>
          <div className="info-card">
            <ul className="description-list" style={{ margin: 0 }}>
              <li>
                <b>Medial / Lateral</b> (camera to the side): horizontal axis is anterior–posterior
                (A/P) — the primary clinical signal. Landmark: a tibial point / fibular head.
              </li>
              <li>
                <b>Anterior / Posterior</b> (camera facing front/back): horizontal axis is
                medial–lateral (M/L). Landmark: the patella apex / popliteal crease.
              </li>
              <li>
                <b>Generic point</b>: track any point with looser settings, for non-knee use.
              </li>
            </ul>
          </div>
        </section>

        <section id="faq-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Notes &amp; FAQ</h2>
          <div className="info-card">
            <ul className="description-list" style={{ margin: 0 }}>
              <li>
                <b>Tracking keeps losing the point?</b> Start on a frame with visible texture, or pick
                the “Forgiving” profile. You can always pause and re-anchor.
              </li>
              <li>
                <b>Timeline looks wrong?</b> The frame rate is auto-detected; override the fps in
                Capture settings if needed.
              </li>
              <li>
                <b>Comparison magnitudes look off?</b> You may be mixing pixel and mm sessions — the
                graph flags this. Calibrate every clip to mm for comparable numbers.
              </li>
              <li>
                <b>Is my video uploaded?</b> No. All processing happens locally in your browser via
                WebAssembly; nothing is sent to a server.
              </li>
              <li>
                <b>Clinical note:</b> this is a measurement and visualisation aid, not a diagnostic
                device. Interpret results alongside proper clinical assessment.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
