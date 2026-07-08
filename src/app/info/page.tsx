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
    { id: 'measures-section', label: 'Measurements' },
    { id: 'refine-section', label: 'Refining tracks' },
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
          How to use the ROM &amp; Motion Tracker
        </h1>
        <p style={{ color: '#4b5563', lineHeight: 1.7, marginBottom: '2rem' }}>
          A guide to measuring joint range of motion and landmark movement from a video.
          Everything runs in your browser — your videos are never uploaded.{' '}
          <Link href="/" style={{ color: '#2563eb', fontWeight: 600 }}>
            Open the tracker →
          </Link>
        </p>

        <section id="overview-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Overview</h2>
          <div className="info-card">
            <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
              Pick a measurement (knee flexion, shoulder ROM, pelvic tilt, a single drifting
              landmark, …), place its landmarks on one frame of a clip, and the app follows every
              point across the whole video with Lucas–Kanade optical flow. The result is a value
              series — a joint angle or a displacement per frame — with a chart, summary
              statistics (ROM, min/max, RMS), and CSV exports for your own analysis.
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
                t: 'Choose what to measure',
                d: 'Pick a measurement in the panel on the right. It lists the landmarks to place (e.g. hip–knee–ankle for knee flexion) and how to set the camera up.',
              },
              {
                t: 'Scrub to a good start frame',
                d: 'Use the slider, the frame-step buttons, or the ←/→ keys to land on a frame where every landmark is clearly visible.',
              },
              {
                t: 'Place the points',
                d: 'Click the video to place each landmark in turn. Scroll to zoom and drag the image to pan for pixel-level precision; drag any placed point to fine-tune it.',
              },
              {
                t: '(Optional) Calibrate to millimetres',
                d: 'For single-point measures you can click the two ends of a reference object of known length (a ruler, two tape dots a measured distance apart), so displacements report in mm instead of px. Placement matters: the reference must be at the same distance from the camera as the joint and facing the camera flat-on — never running from the camera toward the body (see the FAQ). Angles are always in degrees — no calibration needed.',
              },
              {
                t: 'Track',
                d: 'Press “Track from this frame” and watch it run live, with the angle or displacement drawn on the video. Pause any time to rewind and fix a drifting point.',
              },
              {
                t: 'Review, refine, save',
                d: 'When tracking ends you land in review: scrub the whole clip, drag any point that drifted, and re-track forward from the corrected frame. Save when it looks right.',
              },
              {
                t: 'Analyse & export',
                d: 'Charts, ROM/stats tables, session comparison overlays, per-session raw CSVs, and a one-row-per-session summary CSV. Sessions persist in your browser between visits.',
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

        <section id="measures-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Measurements</h2>
          <div className="info-card">
            <ul className="description-list" style={{ margin: 0 }}>
              <li>
                <b>Joint angles (3 points)</b>: knee, hip, ankle, shoulder, elbow, and wrist
                flexion/extension. Three landmarks define two limb segments; the included angle at
                the middle point is charted per frame, and its range over the clip is the ROM.
              </li>
              <li>
                <b>Pelvic tilt (2 points)</b>: mark the ASIS and PSIS from a side view; the
                angle of that line versus horizontal tracks anterior/posterior tilt.
              </li>
              <li>
                <b>Lateral pelvic shift (1 point)</b>: mark the sacrum midpoint from the front or
                back; its horizontal drift from the start position is the shift.
              </li>
              <li>
                <b>Single point</b>: the classic stability mode — track any landmark and chart its
                horizontal and vertical drift (px, or mm when calibrated).
              </li>
            </ul>
          </div>
        </section>

        <section id="refine-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Refining a track</h2>
          <div className="info-card">
            <ul className="description-list" style={{ margin: 0 }}>
              <li>
                <b>Zoom &amp; pan</b>: scroll on the video to zoom (up to 8×), drag to pan, and use
                the toolbar to reset. Works while placing points, while paused, and in review.
              </li>
              <li>
                <b>Rewind while tracking</b>: pause, scrub backwards through the already-tracked
                frames, drag a point back onto the landmark, and resume — tracking re-runs from
                the frame you fixed.
              </li>
              <li>
                <b>Review pass</b>: after tracking, step through the clip frame by frame (←/→
                keys, shift for ×10). Any point can be dragged to correct it; “Re-track from here”
                re-runs the tracker forward from that frame.
              </li>
              <li>
                <b>Tracking profiles</b>: Strict pauses for your input as soon as a point looks
                lost; Forgiving auto-recovers and never interrupts; Balanced sits in between.
              </li>
            </ul>
          </div>
        </section>

        <section id="faq-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-heading">Notes &amp; FAQ</h2>
          <div className="info-card">
            <ul className="description-list" style={{ margin: 0 }}>
              <li>
                <b>Where do I put the ruler for mm calibration?</b> At the same distance from the
                camera as the joint you are tracking, facing the camera flat-on. Best options, in
                order: two skin markers a measured distance apart on the limb itself; a ruler
                taped to a wall or stand right beside the joint; or a ruler on the floor running{' '}
                <i>across</i> the frame (left–right as the camera sees it) directly below the
                subject. A ruler pointing from the camera toward the body will not work — it is
                foreshortened, so its pixel spacing does not represent the scale at the joint.
                Longer references and zooming in before clicking both improve accuracy.
              </li>
              <li>
                <b>Why not just enter the camera distance instead?</b> Distance alone cannot give
                a px-to-mm scale — that also depends on the lens field of view, zoom, crop, and
                stabilisation, none of which are knowable from the video file. Clicking a known
                length measured in the actual footage captures all of that in one number.
              </li>
              <li>
                <b>Tracking keeps losing a point?</b> Start on a frame with visible texture at
                each landmark (skin markers help a lot), or pick the Forgiving profile. You can
                always pause, rewind, and fix it.
              </li>
              <li>
                <b>Timeline looks wrong?</b> The frame rate is auto-detected; override the fps in
                the Measurement panel if needed.
              </li>
              <li>
                <b>2-D angles are projections.</b> Film square-on to the plane of movement —
                out-of-plane rotation makes an on-screen angle differ from the true joint angle.
              </li>
              <li>
                <b>Is my video uploaded?</b> No. All processing happens locally in your browser
                via WebAssembly; nothing is sent to a server.
              </li>
              <li>
                <b>Old CSVs still work.</b> Files exported by the previous knee tracker (or the
                desktop app) import as single-point sessions.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
