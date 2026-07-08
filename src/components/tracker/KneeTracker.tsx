'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './tracker.css';
import {
  CMP_COLORS,
  VIEW_INFO,
  VIEWS,
  ViewKey,
} from '../../lib/tracker/constants';
import {
  computeDeviation,
  sessionFromCsv,
  sessionFromTracking,
  sessionsToSummaryCsv,
  sessionToCsv,
  todayIso,
} from '../../lib/tracker/analysis';
import { downloadText } from '../../lib/tracker/download';
import {
  grayFromImageData,
  lkStep,
  loadOpenCV,
  redetectNear,
} from '../../lib/tracker/opencv';
import { DEFAULT_PRESET, PRESETS, preset } from '../../lib/tracker/profiles';
import { buildReportHtml, openReport } from '../../lib/tracker/report';
import { clearState, loadState, saveState } from '../../lib/tracker/storage';
import type { Session, StudyInfo, TrackRecord } from '../../lib/tracker/types';
import {
  VideoSource,
  closeVideo,
  openVideo,
  readFrame,
  setFps,
} from '../../lib/tracker/video';
import ComparisonChart from './ComparisonChart';
import ProgressView from './ProgressView';
import SessionDetail from './SessionDetail';

const MAX_DISPLAY_W = 720;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = 'empty' | 'setup' | 'tracking';
type MarkMode = 'mark' | 'calibrate';
type Tab = 'track' | 'analyse' | 'progress' | 'export';

interface Ctl {
  paused: boolean;
  finish: boolean;
  abort: boolean;
  reanchor: { x: number; y: number } | null;
}

const STEPS = ['Load video', 'Mark & calibrate', 'Track'];

export default function KneeTracker() {
  const [tab, setTab] = useState<Tab>('track');
  const [phase, setPhase] = useState<Phase>('empty');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Video / display geometry
  const srcRef = useRef<VideoSource | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0, dispW: 0, dispH: 0, scale: 1 });
  const [fps, setFpsState] = useState(30);
  const [frameCount, setFrameCount] = useState(1);
  const [curFrame, setCurFrame] = useState(0);

  // Capture settings
  const [view, setView] = useState<ViewKey>('medial');
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);
  const [referenceMode, setReferenceMode] = useState<'first' | 'mean'>('first');
  const [clipName, setClipName] = useState('clip');

  // Case-study metadata (travels into the summary CSV and printable report)
  const [study, setStudy] = useState<StudyInfo>(() => ({
    client: '',
    date: todayIso(),
    assessor: '',
    movement: '',
    side: 'n/a',
    notes: '',
  }));
  const setStudyField = <K extends keyof StudyInfo>(k: K, v: StudyInfo[K]) =>
    setStudy((prev) => ({ ...prev, [k]: v }));

  // Marking / calibration
  const [markMode, setMarkMode] = useState<MarkMode>('mark');
  const [landmark, setLandmark] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [calibPts, setCalibPts] = useState<{ x: number; y: number }[]>([]);
  const [calibMm, setCalibMm] = useState('');
  const [pxPerMm, setPxPerMm] = useState<number | null>(null);

  // Tracking live state
  const [progress, setProgress] = useState(0);
  const [readout, setReadout] = useState('');
  const [paused, setPaused] = useState(false);
  const [lost, setLost] = useState(false);
  const ctlRef = useRef<Ctl>({
    paused: false,
    finish: false,
    abort: false,
    reanchor: null,
  });

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const recordsMap = useRef<Map<string, TrackRecord[]>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------- persistence
  const hydrated = useRef(false);
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setSessions(saved.sessions);
      setStudy(saved.study);
      if (saved.sessions.length) {
        setSelectedId(saved.sessions[saved.sessions.length - 1].id);
        setNotice(
          `Welcome back — restored ${saved.sessions.length} session${
            saved.sessions.length === 1 ? '' : 's'
          } from your last visit.`,
        );
      }
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const warn = saveState(sessions, study);
    if (warn) setNotice(warn);
  }, [sessions, study]);

  // ------------------------------------------------------------------ loading
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setBusy('Reading video…');
    try {
      const src = await openVideo(file);
      if (srcRef.current) closeVideo(srcRef.current);
      srcRef.current = src;
      const scale = Math.min(1, MAX_DISPLAY_W / src.width);
      setDims({
        w: src.width,
        h: src.height,
        dispW: Math.round(src.width * scale),
        dispH: Math.round(src.height * scale),
        scale,
      });
      setFpsState(Math.round(src.fps * 100) / 100);
      setFrameCount(src.frameCount);
      setCurFrame(0);
      setLandmark(null);
      setCalibPts([]);
      setPxPerMm(null);
      setCalibMm('');
      setClipName(file.name.replace(/\.[^.]+$/, ''));
      setPhase('setup');
      setBusy('Loading tracking engine…');
      await loadOpenCV(); // warm the WASM up front so Track is instant
      setBusy(null);
      // draw first frame after layout settles
      requestAnimationFrame(() => {
        showFrame(0, src, scale).catch(() => {
          /* a failed preview draw shouldn't crash the page */
        });
      });
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------- draw a frame
  const drawScene = useCallback(
    (
      src: VideoSource,
      scale: number,
      pt: { x: number; y: number } | null,
      opts?: {
        trail?: { x: number; y: number }[];
        calib?: { x: number; y: number }[];
        note?: string;
        noteColor?: string;
      },
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dw = canvas.width;
      const dh = canvas.height;
      ctx.drawImage(src.canvas, 0, 0, dw, dh);

      // motion trail
      const trail = opts?.trail;
      if (trail && trail.length > 1) {
        ctx.strokeStyle = 'rgba(0,255,0,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        trail.forEach((p, i) => {
          const x = p.x * scale;
          const y = p.y * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // calibration points + line
      const calib = opts?.calib;
      if (calib && calib.length) {
        ctx.strokeStyle = '#ffb100';
        ctx.fillStyle = '#ffb100';
        ctx.lineWidth = 2;
        if (calib.length === 2) {
          ctx.beginPath();
          ctx.moveTo(calib[0].x * scale, calib[0].y * scale);
          ctx.lineTo(calib[1].x * scale, calib[1].y * scale);
          ctx.stroke();
        }
        calib.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x * scale, p.y * scale, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // crosshair
      if (pt) {
        const x = pt.x * scale;
        const y = pt.y * scale;
        ctx.strokeStyle = opts?.noteColor ?? '#ff2d2d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 14, y);
        ctx.lineTo(x + 14, y);
        ctx.moveTo(x, y - 14);
        ctx.lineTo(x, y + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // note text
      if (opts?.note) {
        ctx.font = '600 14px sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, dw, 24);
        ctx.fillStyle = opts.noteColor ?? '#fff';
        ctx.fillText(opts.note, 8, 17);
      }
    },
    [],
  );

  const showFrame = useCallback(
    async (frame: number, srcArg?: VideoSource, scaleArg?: number) => {
      const src = srcArg ?? srcRef.current;
      if (!src) return;
      const scale = scaleArg ?? dims.scale;
      await readFrame(src, frame);
      drawScene(src, scale, markMode === 'mark' ? landmark : null, {
        calib: markMode === 'calibrate' ? calibPts : undefined,
      });
    },
    [dims.scale, drawScene, landmark, calibPts, markMode],
  );

  // Re-draw the setup scene when marking state changes.
  useEffect(() => {
    if (phase === 'setup' && srcRef.current) {
      drawScene(srcRef.current, dims.scale, markMode === 'mark' ? landmark : null, {
        calib: markMode === 'calibrate' ? calibPts : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmark, calibPts, markMode, phase]);

  const onScrub = useCallback(
    (frame: number) => {
      setCurFrame(frame);
      void showFrame(frame);
    },
    [showFrame],
  );

  // ---------------------------------------------------------------- canvas map
  const eventToVideoPx = (e: React.MouseEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const bx = canvas.width / rect.width; // backing px per css px
    const by = canvas.height / rect.height;
    const x = ((e.clientX - rect.left) * bx) / dims.scale;
    const y = ((e.clientY - rect.top) * by) / dims.scale;
    return {
      x: Math.max(0, Math.min(dims.w - 1, x)),
      y: Math.max(0, Math.min(dims.h - 1, y)),
    };
  };

  const onCanvasClick = (e: React.MouseEvent) => {
    const p = eventToVideoPx(e);
    if (!p) return;
    if (phase === 'tracking') {
      if (ctlRef.current.paused) ctlRef.current.reanchor = p;
      return;
    }
    if (phase !== 'setup') return;
    if (markMode === 'mark') {
      setLandmark(p);
    } else {
      setCalibPts((prev) => (prev.length >= 2 ? [p] : [...prev, p]));
    }
  };

  const applyCalibration = () => {
    if (calibPts.length !== 2) {
      setError('Click two points on a known distance first.');
      return;
    }
    const mm = parseFloat(calibMm);
    if (!mm || mm <= 0) {
      setError('Enter the real distance in millimetres.');
      return;
    }
    const pxDist = Math.hypot(
      calibPts[1].x - calibPts[0].x,
      calibPts[1].y - calibPts[0].y,
    );
    const ppm = pxDist / mm;
    setPxPerMm(ppm);
    setError(null);
    setMarkMode('mark');
  };

  // ---------------------------------------------------------------- tracking
  const startTracking = useCallback(async () => {
    const src = srcRef.current;
    if (!src || !landmark) return;
    setError(null);
    const scale = dims.scale;
    const profile = preset(presetName);
    const useProfile =
      view === 'generic' // simple mode floors accuracy in Python; keep parity
        ? {
            ...profile,
            fbThresh: profile.fbThresh == null ? null : Math.max(profile.fbThresh, 6),
            errThresh: Math.max(profile.errThresh, 40),
          }
        : profile;

    ctlRef.current = { paused: false, finish: false, abort: false, reanchor: null };
    setPaused(false);
    setLost(false);
    setProgress(0);
    setPhase('tracking');

    let cv;
    try {
      cv = await loadOpenCV();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('setup');
      return;
    }

    const start = curFrame;
    let img = await readFrame(src, start);
    let prevGray = grayFromImageData(cv, img);
    let p = { x: landmark.x, y: landmark.y };
    const x0 = p.x;
    const y0 = p.y;

    const records: TrackRecord[] = [{ frame: start, x: p.x, y: p.y, ok: true }];
    const trail: { x: number; y: number }[] = [{ ...p }];
    let consecBad = 0;
    let lastProgress = 0;

    drawScene(src, scale, p, { trail, note: 'Tracking…', noteColor: '#7CFC00' });

    try {
      for (let idx = start + 1; idx < src.frameCount; idx++) {
        // Pause / re-anchor / finish gate.
        while (
          ctlRef.current.paused &&
          !ctlRef.current.finish &&
          !ctlRef.current.abort
        ) {
          if (ctlRef.current.reanchor) {
            p = ctlRef.current.reanchor;
            ctlRef.current.reanchor = null;
            records[records.length - 1] = {
              frame: records[records.length - 1].frame,
              x: p.x,
              y: p.y,
              ok: true,
            };
            trail[trail.length - 1] = { ...p };
            consecBad = 0;
            setLost(false);
            ctlRef.current.paused = false;
            setPaused(false);
          }
          drawScene(src, scale, p, {
            trail,
            note: lost
              ? 'TRACKING LOST — click the landmark, then Resume'
              : 'PAUSED — click Resume (or click to re-anchor)',
            noteColor: '#ffb100',
          });
          await sleep(70);
        }
        if (ctlRef.current.finish || ctlRef.current.abort) break;

        img = await readFrame(src, idx);
        const gray = grayFromImageData(cv, img);
        const res = lkStep(
          cv,
          prevGray,
          gray,
          p.x,
          p.y,
          useProfile.fbThresh,
          useProfile.errThresh,
        );
        let pt = { x: res.x, y: res.y };
        let good = res.ok;

        if (good) {
          consecBad = 0;
        } else {
          consecBad += 1;
          if (useProfile.autoReanchor) {
            const snap = redetectNear(cv, gray, pt.x, pt.y, useProfile.reacquireRadius);
            if (snap) pt = snap;
          }
          const grace = useProfile.recoverGrace;
          if (grace != null && consecBad > grace) {
            // Escalate: pause and ask the user to re-anchor.
            ctlRef.current.paused = true;
            setPaused(true);
            setLost(true);
          }
        }

        records.push({ frame: idx, x: pt.x, y: pt.y, ok: good });
        trail.push({ ...pt });
        if (trail.length > 60) trail.shift();
        p = pt;
        prevGray.delete();
        prevGray = gray;

        const pct = (100 * idx) / Math.max(1, src.frameCount - 1);
        drawScene(src, scale, p, {
          trail,
          note: good ? 'Tracking…' : 'Re-acquiring point…',
          noteColor: good ? '#7CFC00' : '#ffb100',
        });
        if (pct - lastProgress >= 1 || idx === src.frameCount - 1) {
          lastProgress = pct;
          setProgress(pct);
          setReadout(
            `frame ${idx}/${src.frameCount - 1}  ·  t=${(idx / src.fps).toFixed(2)}s  ·  dx=${(p.x - x0).toFixed(1)} dy=${(p.y - y0).toFixed(1)} px`,
          );
          await sleep(0); // yield to the UI thread
        }
      }
    } finally {
      prevGray.delete();
    }

    if (ctlRef.current.abort) {
      setPhase('setup');
      void showFrame(curFrame);
      return;
    }
    finalizeSession(records);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landmark, dims.scale, presetName, view, curFrame, drawScene, showFrame]);

  const finalizeSession = (records: TrackRecord[]) => {
    if (records.length < 2) {
      setError('Not enough tracked frames to build a session.');
      setPhase('setup');
      return;
    }
    const { dev } = computeDeviation(records, referenceMode);
    const unit = pxPerMm ? 'mm' : 'px';
    const calibNote = pxPerMm
      ? `two-point · ${(pxPerMm).toFixed(2)} px/mm`
      : '';
    const name = `${clipName}_${view}`;
    const session = sessionFromTracking(
      name,
      view,
      unit,
      pxPerMm,
      records,
      dev,
      srcRef.current?.fps ?? fps,
      calibNote,
      study.date || todayIso(),
    );
    recordsMap.current.set(session.id, records);
    setSessions((prev) => [...prev, session]);
    setSelectedId(session.id);
    setCompareMode(false);
    setPhase('setup');
    setTab('analyse'); // the result is the next thing the user wants to see
    // restore the setup view
    void showFrame(curFrame);
  };

  // ---------------------------------------------------------------- sessions
  const exportCsv = (s: Session) => {
    const recs = recordsMap.current.get(s.id) ?? null;
    const csv = sessionToCsv(s, recs, srcRef.current?.fps ?? fps);
    downloadText(`${s.name}_deviation.csv`, csv);
  };

  const exportSummaryCsv = () => {
    if (!sessions.length) return;
    const stamp = study.date || todayIso();
    const who = study.client ? `${slug(study.client)}_` : '';
    downloadText(
      `${who}${stamp}_knee_summary.csv`,
      sessionsToSummaryCsv(sessions, study),
    );
  };

  const makeReport = () => {
    if (!sessions.length) return;
    openReport(buildReportHtml(study, sessions));
  };

  const importCsv = async (files: FileList) => {
    setError(null);
    const added: Session[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const fallbackDate = file.lastModified
          ? new Date(file.lastModified).toISOString().slice(0, 10)
          : undefined;
        added.push(sessionFromCsv(text, file.name, fallbackDate));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    if (added.length) {
      setSessions((prev) => [...prev, ...added]);
      setSelectedId(added[added.length - 1].id);
      if (tab === 'track') setTab('analyse');
    }
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    recordsMap.current.delete(id);
    setCompareIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    if (selectedId === id) setSelectedId(null);
  };

  const updateSessionDate = (id: string, date: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, date } : s)));
  };

  const clearAll = () => {
    if (
      !window.confirm(
        'Remove all saved sessions and case-study details from this browser? Exported CSVs are unaffected.',
      )
    )
      return;
    setSessions([]);
    recordsMap.current.clear();
    setSelectedId(null);
    setCompareIds(new Set());
    setCompareMode(false);
    clearState();
  };

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  useEffect(() => {
    return () => {
      if (srcRef.current) closeVideo(srcRef.current);
    };
  }, []);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const compareList = sessions.filter((s) => compareIds.has(s.id));
  const info = VIEW_INFO[view];

  const activeStep = phase === 'empty' ? 0 : phase === 'tracking' ? 2 : landmark ? 2 : 1;
  const stepState = (i: number): 'done' | 'active' | 'todo' => {
    if (i < activeStep) return 'done';
    if (i === activeStep) return 'active';
    return 'todo';
  };

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    {
      key: 'track',
      label: 'Track',
      badge: phase === 'tracking' ? '●' : undefined,
    },
    {
      key: 'analyse',
      label: 'Analyse',
      badge: sessions.length ? String(sessions.length) : undefined,
    },
    { key: 'progress', label: 'Progress' },
    { key: 'export', label: 'Report & export' },
  ];

  const sessionsPanel = (
    <div className="kt-card">
      <div className="kt-row between" style={{ margin: 0 }}>
        <h3 style={{ margin: 0 }}>Sessions ({sessions.length})</h3>
        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => csvInputRef.current?.click()}>
          Import CSV
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="kt-hint" style={{ marginTop: 8 }}>
          Tracked clips and imported CSVs appear here. They are saved in this browser, so your
          history is waiting when you come back.
        </p>
      ) : (
        <>
          <div className="kt-row" style={{ marginTop: 8 }}>
            <button
              className={`kt-btn kt-btn-sm ${compareMode ? '' : 'kt-btn-ghost'}`}
              onClick={() => setCompareMode((m) => !m)}
            >
              {compareMode ? '✓ Compare mode' : 'Compare mode'}
            </button>
            <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={clearAll}>
              Clear all
            </button>
          </div>
          <ul className="kt-sessions">
            {sessions.map((s, i) => (
              <li
                key={s.id}
                className={`kt-session ${selectedId === s.id && !compareMode ? 'sel' : ''}`}
              >
                {compareMode && (
                  <input
                    type="checkbox"
                    checked={compareIds.has(s.id)}
                    onChange={() => toggleCompareId(s.id)}
                    aria-label={`Include ${s.name} in comparison`}
                  />
                )}
                <span
                  className="kt-swatch"
                  style={{ background: CMP_COLORS[i % CMP_COLORS.length] }}
                />
                <button
                  className="kt-session-name"
                  onClick={() => {
                    setSelectedId(s.id);
                    setCompareMode(false);
                  }}
                  title={s.name}
                >
                  {s.name}
                  <span className="kt-session-meta">
                    {s.date} · {s.view} · {s.unit} · {s.t.length} frames
                  </span>
                </button>
                <button
                  className="kt-icon-btn"
                  onClick={() => deleteSession(s.id)}
                  title="Remove session"
                  aria-label={`Remove ${s.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  // ------------------------------------------------------------------- render
  return (
    <div className="kt-wrap">
      <div className="kt-header">
        <div className="kt-header-text">
          <h1>Knee Stability Tracker</h1>
          <p>
            Mark an anatomical landmark on a video and it is tracked across every frame with
            Lucas–Kanade optical flow, quantifying how far the knee deviates over time.
          </p>
        </div>
        <span className="kt-privacy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Runs entirely in your browser — videos never leave your device
        </span>
      </div>

      <nav className="kt-tabbar" role="tablist" aria-label="Sections">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'on' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.badge && <span className={`kt-tab-badge ${t.badge === '●' ? 'live' : ''}`}>{t.badge}</span>}
          </button>
        ))}
      </nav>

      {error && <div className="kt-error" role="alert">{error}</div>}
      {notice && (
        <div className="kt-notice">
          <span>{notice}</span>
          <button className="kt-icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && importCsv(e.target.files)}
      />

      {/* ============================================================ TRACK */}
      <div style={{ display: tab === 'track' ? undefined : 'none' }}>
        <ol className="kt-steps" aria-label="Workflow">
          {STEPS.map((label, i) => (
            <li key={label} className={`kt-step ${stepState(i)}`}>
              <span className="kt-step-dot">{stepState(i) === 'done' ? '✓' : i + 1}</span>
              <span className="kt-step-label">{label}</span>
            </li>
          ))}
        </ol>

        <div className="kt-grid">
          <div>
            {phase === 'empty' ? (
              <div
                className={`kt-drop ${dragging ? 'drag' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="kt-drop-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="kt-drop-title">Drop a knee video here, or click to choose a file</div>
                <div className="kt-hint">MP4 / MOV / WebM · processed locally, nothing is uploaded</div>
                <div className="kt-hint">
                  Returning with CSVs from a previous visit? Import them in the Analyse section.
                </div>
              </div>
            ) : (
              <div className="kt-card">
                <div className="kt-stage">
                  <canvas
                    ref={canvasRef}
                    className="kt-canvas"
                    width={dims.dispW}
                    height={dims.dispH}
                    onClick={onCanvasClick}
                  />
                  {busy && (
                    <div className="kt-overlay">
                      <div className="kt-spinner" />
                      <div>{busy}</div>
                    </div>
                  )}
                </div>

                {phase === 'setup' && (
                  <>
                    <div className="kt-row" style={{ marginTop: '0.75rem' }}>
                      <div className="kt-seg" role="tablist">
                        <button
                          role="tab"
                          aria-selected={markMode === 'mark'}
                          className={markMode === 'mark' ? 'on' : ''}
                          onClick={() => setMarkMode('mark')}
                        >
                          Mark landmark
                        </button>
                        <button
                          role="tab"
                          aria-selected={markMode === 'calibrate'}
                          className={markMode === 'calibrate' ? 'on' : ''}
                          onClick={() => setMarkMode('calibrate')}
                        >
                          Calibrate scale (mm)
                        </button>
                      </div>
                      {landmark ? (
                        <span className="kt-chip ok">✓ landmark set</span>
                      ) : (
                        <span className="kt-chip">no landmark yet</span>
                      )}
                      {pxPerMm && <span className="kt-chip ok">✓ {pxPerMm.toFixed(2)} px/mm</span>}
                    </div>

                    <input
                      className="kt-scrub"
                      type="range"
                      min={0}
                      max={Math.max(0, frameCount - 1)}
                      value={curFrame}
                      onChange={(e) => onScrub(parseInt(e.target.value, 10))}
                      aria-label="Scrub video frame"
                    />
                    <div className="kt-row between">
                      <div className="kt-hint">
                        Frame {curFrame} / {frameCount - 1} · {(curFrame / fps).toFixed(2)}s
                      </div>
                      <div className="kt-row" style={{ margin: 0 }}>
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrub(Math.max(0, curFrame - 1))}>◀ frame</button>
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrub(Math.min(frameCount - 1, curFrame + 1))}>frame ▶</button>
                      </div>
                    </div>

                    {markMode === 'mark' ? (
                      <div className="kt-hint">
                        Scrub to a frame where the <b>{info.landmark}</b> is clearly visible, then click
                        it on the video. ({info.hint})
                      </div>
                    ) : (
                      <div>
                        <div className="kt-hint" style={{ marginBottom: 6 }}>
                          Click two points a known real-world distance apart (e.g. a ruler or a 100&nbsp;mm
                          marker), enter that distance, and apply. Optional — skip to report in pixels.
                        </div>
                        <div className="kt-row">
                          <input
                            className="kt-input"
                            style={{ width: 140 }}
                            type="number"
                            placeholder="distance (mm)"
                            value={calibMm}
                            onChange={(e) => setCalibMm(e.target.value)}
                          />
                          <button className="kt-btn kt-btn-sm" onClick={applyCalibration} disabled={calibPts.length !== 2}>
                            Apply scale
                          </button>
                          <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => setCalibPts([])}>Clear points</button>
                        </div>
                      </div>
                    )}

                    <div className="kt-row" style={{ marginTop: '0.75rem' }}>
                      <button
                        className="kt-btn"
                        disabled={!landmark}
                        onClick={startTracking}
                        title={landmark ? '' : 'Mark a landmark first'}
                      >
                        ▶ Track from this frame
                      </button>
                      <button
                        className="kt-btn kt-btn-ghost"
                        onClick={() => {
                          if (srcRef.current) closeVideo(srcRef.current);
                          srcRef.current = null;
                          setPhase('empty');
                        }}
                      >
                        Load different video
                      </button>
                    </div>
                  </>
                )}

                {phase === 'tracking' && (
                  <>
                    <div className="kt-progress">
                      <div style={{ width: `${progress}%` }} />
                    </div>
                    {readout && <div className="kt-readout">{readout}</div>}
                    <div className="kt-row" style={{ marginTop: '0.75rem' }}>
                      <button
                        className="kt-btn kt-btn-ghost"
                        onClick={() => {
                          const next = !ctlRef.current.paused;
                          ctlRef.current.paused = next;
                          setPaused(next);
                          if (!next) setLost(false);
                        }}
                      >
                        {paused ? '▶ Resume' : '⏸ Pause'}
                      </button>
                      <button
                        className="kt-btn kt-btn-ghost"
                        onClick={() => {
                          ctlRef.current.paused = true;
                          setPaused(true);
                        }}
                        title="Pause, then click the landmark on the video to re-anchor"
                      >
                        ⌖ Re-anchor
                      </button>
                      <button className="kt-btn kt-btn-ok" onClick={() => (ctlRef.current.finish = true)}>
                        ✓ Finish &amp; keep
                      </button>
                      <button className="kt-btn kt-btn-warn" onClick={() => (ctlRef.current.abort = true)}>
                        ✕ Abort
                      </button>
                    </div>
                    {(paused || lost) && (
                      <div className={`kt-hint ${lost ? 'danger' : ''}`} style={{ marginTop: 6 }}>
                        {lost
                          ? 'Tracking lost. Click the true landmark position on the video, then Resume.'
                          : 'Paused. Click the video to re-anchor the point, then Resume.'}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="kt-card">
              <h3>Capture settings</h3>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-view">Camera view</label>
                <select
                  id="kt-view"
                  className="kt-select"
                  value={view}
                  onChange={(e) => setView(e.target.value as ViewKey)}
                >
                  {VIEWS.map((v) => (
                    <option key={v} value={v}>
                      {v.charAt(0).toUpperCase() + v.slice(1)} — {VIEW_INFO[v].primary}
                    </option>
                  ))}
                  <option value="generic">Generic point</option>
                </select>
                <div className="kt-hint" style={{ marginTop: 4 }}>{info.hint}</div>
              </div>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-profile">Tracking profile</label>
                <select
                  id="kt-profile"
                  className="kt-select"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                >
                  {Object.keys(PRESETS).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-ref">Reference position</label>
                <select
                  id="kt-ref"
                  className="kt-select"
                  value={referenceMode}
                  onChange={(e) => setReferenceMode(e.target.value as 'first' | 'mean')}
                >
                  <option value="first">First tracked frame</option>
                  <option value="mean">Clip mean</option>
                </select>
              </div>
              <div className="kt-field" style={{ marginBottom: 0 }}>
                <label className="kt-label" htmlFor="kt-sess-date">Session date</label>
                <input
                  id="kt-sess-date"
                  className="kt-input"
                  type="date"
                  value={study.date}
                  onChange={(e) => setStudyField('date', e.target.value)}
                />
                <div className="kt-hint" style={{ marginTop: 4 }}>
                  Stamped on new sessions — used by the Progress timeline.
                </div>
              </div>
              {phase !== 'empty' && (
                <div className="kt-field" style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                  <label className="kt-label" htmlFor="kt-fps">Frame rate (fps)</label>
                  <input
                    id="kt-fps"
                    className="kt-input"
                    type="number"
                    value={fps}
                    min={1}
                    step={0.01}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 30;
                      setFpsState(v);
                      if (srcRef.current) {
                        setFps(srcRef.current, v);
                        setFrameCount(srcRef.current.frameCount);
                      }
                    }}
                  />
                  <div className="kt-hint" style={{ marginTop: 4 }}>Auto-detected; override if the timeline looks wrong.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== ANALYSE */}
      <div style={{ display: tab === 'analyse' ? undefined : 'none' }}>
        <div className="kt-grid">
          <div>
            {!compareMode && selected && (
              <div className="kt-card">
                <SessionDetail session={selected} onExportCsv={() => exportCsv(selected)} />
              </div>
            )}
            {!compareMode && !selected && (
              <div className="kt-card">
                <p className="kt-hint" style={{ margin: 0 }}>
                  {sessions.length
                    ? 'Pick a session on the right to see its chart and statistics.'
                    : 'No sessions yet — track a clip in the Track section, or import CSVs from a previous visit.'}
                </p>
              </div>
            )}
            {compareMode && compareList.length >= 2 && (
              <div className="kt-card">
                <h3>Comparison ({compareList.length} sessions)</h3>
                <ComparisonChart sessions={compareList} />
              </div>
            )}
            {compareMode && compareList.length < 2 && (
              <div className="kt-card">
                <p className="kt-hint" style={{ margin: 0 }}>
                  Select at least two sessions on the right to overlay them on one chart.
                </p>
              </div>
            )}
          </div>
          <div>{sessionsPanel}</div>
        </div>
      </div>

      {/* ========================================================= PROGRESS */}
      <div style={{ display: tab === 'progress' ? undefined : 'none' }}>
        <div className="kt-card">
          <h3>Progress across visits</h3>
          <ProgressView
            sessions={sessions}
            onUpdateDate={updateSessionDate}
            onImportClick={() => csvInputRef.current?.click()}
          />
        </div>
      </div>

      {/* =========================================================== EXPORT */}
      <div style={{ display: tab === 'export' ? undefined : 'none' }}>
        <div className="kt-grid">
          <div className="kt-card">
            <h3>Case study details</h3>
            <p className="kt-hint" style={{ marginTop: 0 }}>
              Everything here is embedded in the report and the summary CSV, so the export
              stands on its own in a client file.
            </p>
            <div className="kt-field-grid">
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-client">Client</label>
                <input
                  id="kt-client"
                  className="kt-input"
                  value={study.client}
                  placeholder="name or ID"
                  onChange={(e) => setStudyField('client', e.target.value)}
                />
              </div>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-date">Assessment date</label>
                <input
                  id="kt-date"
                  className="kt-input"
                  type="date"
                  value={study.date}
                  onChange={(e) => setStudyField('date', e.target.value)}
                />
              </div>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-assessor">Assessor</label>
                <input
                  id="kt-assessor"
                  className="kt-input"
                  value={study.assessor}
                  placeholder="RMT / practitioner"
                  onChange={(e) => setStudyField('assessor', e.target.value)}
                />
              </div>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-side">Side</label>
                <select
                  id="kt-side"
                  className="kt-select"
                  value={study.side}
                  onChange={(e) => setStudyField('side', e.target.value as StudyInfo['side'])}
                >
                  <option value="n/a">—</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <div className="kt-field">
              <label className="kt-label" htmlFor="kt-movement">Movement / task</label>
              <input
                id="kt-movement"
                className="kt-input"
                value={study.movement}
                placeholder="e.g. bodyweight squat, step-down"
                onChange={(e) => setStudyField('movement', e.target.value)}
              />
            </div>
            <div className="kt-field" style={{ marginBottom: 0 }}>
              <label className="kt-label" htmlFor="kt-notes">Clinical notes</label>
              <textarea
                id="kt-notes"
                className="kt-input"
                rows={4}
                value={study.notes}
                placeholder="observations, context, treatment stage…"
                onChange={(e) => setStudyField('notes', e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="kt-card">
              <h3>Exports</h3>
              {sessions.length === 0 ? (
                <p className="kt-hint" style={{ margin: 0 }}>
                  Exports unlock once at least one session exists.
                </p>
              ) : (
                <>
                  <button className="kt-btn" style={{ width: '100%' }} onClick={makeReport}>
                    Open report (print / PDF)
                  </button>
                  <p className="kt-hint" style={{ margin: '6px 0 12px' }}>
                    A formatted clinical document: study details, one chart and metrics table per
                    session, and a comparison when there are several. Print it or save as PDF.
                  </p>
                  <button
                    className="kt-btn kt-btn-ghost"
                    style={{ width: '100%' }}
                    onClick={exportSummaryCsv}
                  >
                    Summary metrics (CSV)
                  </button>
                  <p className="kt-hint" style={{ margin: '6px 0 12px' }}>
                    One row per session with every metric and the study details — ready for a
                    spreadsheet, and easy to append across visits.
                  </p>
                  <p className="kt-hint" style={{ margin: 0 }}>
                    Raw per-frame CSVs live with each session in the Analyse section — they
                    re-import here (dates included) on your next visit.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
