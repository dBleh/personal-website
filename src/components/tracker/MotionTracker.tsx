'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './tracker.css';
import { CMP_COLORS, POINT_COLORS } from '../../lib/tracker/constants';
import {
  sessionFromCsv,
  sessionFromTracking,
  sessionsToSummaryCsv,
  sessionToCsv,
} from '../../lib/tracker/analysis';
import { downloadText } from '../../lib/tracker/download';
import { FaceBlurrer, loadFaceBlurrer } from '../../lib/tracker/faceblur';
import {
  DEFAULT_MEASURE,
  MeasureDef,
  getMeasure,
  isLengthMeasure,
  measureGroups,
  measureValue,
} from '../../lib/tracker/measures';
import {
  grayFromImageData,
  lkStep,
  loadOpenCV,
  redetectNear,
} from '../../lib/tracker/opencv';
import { DEFAULT_PRESET, PRESETS, preset } from '../../lib/tracker/profiles';
import { clearState, loadState, saveState } from '../../lib/tracker/storage';
import type { FrameRecord, Session } from '../../lib/tracker/types';
import {
  VideoSource,
  closeVideo,
  openVideo,
  readFrame,
  setFps,
} from '../../lib/tracker/video';
import ComparisonChart from './ComparisonChart';
import SessionDetail from './SessionDetail';

// The viewport is a fixed 16:9 stage (720×405 CSS px, 2× backing store for
// crisp zooming). Every video is letterboxed into it, so portrait phone clips
// no longer blow the layout up — zoom in for detail instead.
const VIEW_W = 1440;
const VIEW_H = 810;
const BACKING = 2; // backing px per CSS px
const MAX_ZOOM = 8;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phase = 'empty' | 'setup' | 'tracking' | 'review';
type MarkMode = 'points' | 'calibrate';
type Tab = 'track' | 'analyse';

interface Ctl {
  paused: boolean;
  finish: boolean;
  abort: boolean;
  restartFrom: number | null; // resume/re-track from this absolute frame
}

interface XY {
  x: number;
  y: number;
}

const STEPS = ['Load video', 'Place points', 'Track', 'Review & save'];
const PLAY_SPEEDS = [0.25, 0.5, 1, 2, 4];

export default function MotionTracker() {
  const [tab, setTab] = useState<Tab>('track');
  const [phase, setPhase] = useState<Phase>('empty');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Video
  const srcRef = useRef<VideoSource | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [fps, setFpsState] = useState(30);
  const [frameCount, setFrameCount] = useState(1);
  const [curFrame, setCurFrame] = useState(0);
  const [clipName, setClipName] = useState('clip');

  // Measurement setup
  const [measureKey, setMeasureKey] = useState(DEFAULT_MEASURE);
  const measure = getMeasure(measureKey);
  const [presetName, setPresetName] = useState(DEFAULT_PRESET);
  const [points, setPoints] = useState<(XY | null)[]>(() =>
    getMeasure(DEFAULT_MEASURE).points.map(() => null),
  );
  const [activePt, setActivePt] = useState(0);
  const [markMode, setMarkMode] = useState<MarkMode>('points');
  const [calibPts, setCalibPts] = useState<XY[]>([]);
  const [calibMm, setCalibMm] = useState('');
  const [pxPerMm, setPxPerMm] = useState<number | null>(null);

  // View transform (zoom/pan), in refs so the tracking loop and native wheel
  // listener always see the current values.
  const viewRef = useRef({ z: 1, tx: 0, ty: 0 });
  const [zoomUi, setZoomUi] = useState(1);

  // Tracking / review
  const [progress, setProgress] = useState(0);
  const [readout, setReadout] = useState('');
  const [paused, setPaused] = useState(false);
  const [lost, setLost] = useState(false);
  const [justFixed, setJustFixed] = useState(false); // lost points all re-anchored, ready to resume
  const [editFrame, setEditFrame] = useState(0); // scrub position while paused / reviewing
  const [editTick, setEditTick] = useState(0); // bumped when records are edited in place
  const ctlRef = useRef<Ctl>({ paused: false, finish: false, abort: false, restartFrom: null });
  const recordsRef = useRef<FrameRecord[]>([]);
  const trailRef = useRef<XY[]>([]);

  // Playback preview (setup / review / paused tracking): frames advance on a
  // wall clock so the chosen speed stays true even when seeks lag behind.
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const playingRef = useRef(false);
  const playSpeedRef = useRef(1);
  const playBasis = useRef({ frame: 0, t: 0 });

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const recordsMap = useRef<Map<string, FrameRecord[]>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  // Face blur (privacy): pixelate detected faces on the preview canvas.
  const [blurFaces, setBlurFaces] = useState(true);
  const blurFacesRef = useRef(true);
  const blurRef = useRef<FaceBlurrer | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const seekSeq = useRef(0);

  // Refs mirroring state that native listeners / the tracking loop need live.
  const phaseRef = useRef<Phase>('empty');
  phaseRef.current = phase;
  const editFrameRef = useRef(0);
  editFrameRef.current = editFrame;
  const curFrameRef = useRef(0);
  curFrameRef.current = curFrame;

  // ------------------------------------------------------------- persistence
  const hydrated = useRef(false);
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.sessions.length) {
      setSessions(saved.sessions);
      setSelectedId(saved.sessions[saved.sessions.length - 1].id);
      setNotice(
        `Restored ${saved.sessions.length} session${
          saved.sessions.length === 1 ? '' : 's'
        } from your last visit.`,
      );
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const warn = saveState(sessions);
    if (warn) setNotice(warn);
  }, [sessions]);

  // ------------------------------------------------------------ view helpers
  const fitScale = useCallback(
    (w = dims.w, h = dims.h) => (w && h ? Math.min(VIEW_W / w, VIEW_H / h) : 1),
    [dims.w, dims.h],
  );

  const clampView = useCallback(() => {
    const v = viewRef.current;
    const s = fitScale() * v.z;
    const vw = dims.w * s;
    const vh = dims.h * s;
    v.tx = vw <= VIEW_W ? (VIEW_W - vw) / 2 : Math.min(0, Math.max(VIEW_W - vw, v.tx));
    v.ty = vh <= VIEW_H ? (VIEW_H - vh) / 2 : Math.min(0, Math.max(VIEW_H - vh, v.ty));
  }, [dims.w, dims.h, fitScale]);

  /** Set zoom, keeping the backing-space focus point (fx, fy) fixed. */
  const applyZoom = useCallback(
    (z: number, fx = VIEW_W / 2, fy = VIEW_H / 2) => {
      const v = viewRef.current;
      const clamped = Math.max(1, Math.min(MAX_ZOOM, z));
      const s0 = fitScale() * v.z;
      const s1 = fitScale() * clamped;
      v.tx = fx - ((fx - v.tx) * s1) / s0;
      v.ty = fy - ((fy - v.ty) * s1) / s0;
      v.z = clamped;
      clampView();
      setZoomUi(clamped);
    },
    [clampView, fitScale],
  );

  /** Center the view on a video-space point, optionally raising zoom. */
  const centerOnPoint = useCallback(
    (vp: XY, z?: number) => {
      const v = viewRef.current;
      v.z = Math.max(1, Math.min(MAX_ZOOM, z ?? v.z));
      const s = fitScale() * v.z;
      v.tx = VIEW_W / 2 - vp.x * s;
      v.ty = VIEW_H / 2 - vp.y * s;
      clampView();
      setZoomUi(v.z);
      draw(currentOverlayRef.current());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clampView, fitScale],
  );

  const eventToBacking = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const backingToVideo = useCallback(
    (b: XY): XY => {
      const v = viewRef.current;
      const s = fitScale() * v.z;
      return {
        x: Math.max(0, Math.min(dims.w - 1, (b.x - v.tx) / s)),
        y: Math.max(0, Math.min(dims.h - 1, (b.y - v.ty) / s)),
      };
    },
    [dims.w, dims.h, fitScale],
  );

  // ---------------------------------------------------------------- drawing
  interface Overlay {
    pts?: ({ x: number; y: number; ok?: boolean } | null)[];
    calib?: XY[];
    trail?: XY[];
    note?: string;
    noteColor?: string;
  }

  const draw = useCallback(
    (o: Overlay) => {
      const canvas = canvasRef.current;
      const src = srcRef.current;
      if (!canvas || !src) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const v = viewRef.current;
      const s = fitScale() * v.z;
      const u = (cssPx: number) => (cssPx * BACKING) / s; // screen-constant size in video units

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#14110f';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.setTransform(s, 0, 0, s, v.tx, v.ty);
      ctx.imageSmoothingEnabled = v.z < 3; // show real pixels at high zoom
      ctx.drawImage(src.canvas, 0, 0);

      // motion trail (single-point measures)
      if (o.trail && o.trail.length > 1) {
        ctx.strokeStyle = 'rgba(0,255,0,0.85)';
        ctx.lineWidth = u(1.5);
        ctx.beginPath();
        o.trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      }

      // calibration points + line
      if (o.calib && o.calib.length) {
        ctx.strokeStyle = '#ffb100';
        ctx.fillStyle = '#ffb100';
        ctx.lineWidth = u(1.5);
        if (o.calib.length === 2) {
          ctx.beginPath();
          ctx.moveTo(o.calib[0].x, o.calib[0].y);
          ctx.lineTo(o.calib[1].x, o.calib[1].y);
          ctx.stroke();
        }
        for (const p of o.calib) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, u(3.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const pts = o.pts ?? [];
      const placed = pts.filter((p): p is XY & { ok?: boolean } => !!p);

      // segment lines between consecutive points (limb skeleton)
      if (measure.kind !== 'point' && placed.length >= 2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = u(1.6);
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (!p) break;
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // angle arc at the vertex
      let valueText: string | null = null;
      if (measure.kind === 'angle3' && pts[0] && pts[1] && pts[2]) {
        const [a, b, c] = pts as XY[];
        const a1 = Math.atan2(a.y - b.y, a.x - b.x);
        const a2 = Math.atan2(c.y - b.y, c.x - b.x);
        let diff = a2 - a1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        ctx.strokeStyle = '#ffe27a';
        ctx.lineWidth = u(1.6);
        ctx.beginPath();
        ctx.arc(b.x, b.y, u(22), a1, a2, diff < 0);
        ctx.stroke();
        valueText = `${measureValue(measure, pts as XY[]).toFixed(1)}°`;
      } else if (
        (measure.kind === 'incline2' || measure.kind === 'vincline2') &&
        pts[0] &&
        pts[1]
      ) {
        // dashed reference through the first point: horizontal for incline2,
        // vertical for vincline2
        const p0 = pts[0];
        ctx.strokeStyle = 'rgba(255,226,122,0.8)';
        ctx.lineWidth = u(1.2);
        ctx.setLineDash([u(5), u(4)]);
        ctx.beginPath();
        if (measure.kind === 'incline2') {
          ctx.moveTo(p0.x - u(50), p0.y);
          ctx.lineTo(p0.x + u(50), p0.y);
        } else {
          ctx.moveTo(p0.x, p0.y - u(50));
          ctx.lineTo(p0.x, p0.y + u(50));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        valueText = `${measureValue(measure, pts as XY[]).toFixed(1)}°`;
      }

      // point markers
      pts.forEach((p, i) => {
        if (!p) return;
        const color = p.ok === false ? '#ffb100' : POINT_COLORS[i % POINT_COLORS.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = u(1.8);
        ctx.beginPath();
        ctx.moveTo(p.x - u(10), p.y);
        ctx.lineTo(p.x + u(10), p.y);
        ctx.moveTo(p.x, p.y - u(10));
        ctx.lineTo(p.x, p.y + u(10));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, u(5), 0, Math.PI * 2);
        ctx.stroke();
        if (pts.length > 1) {
          ctx.font = `600 ${u(10)}px sans-serif`;
          ctx.fillStyle = color;
          ctx.fillText(measure.points[i]?.id ?? String(i + 1), p.x + u(7), p.y - u(7));
        }
      });

      // screen-space chrome
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (o.note) {
        ctx.font = `600 ${13 * BACKING}px sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, VIEW_W, 24 * BACKING);
        ctx.fillStyle = o.noteColor ?? '#fff';
        ctx.fillText(o.note, 8 * BACKING, 17 * BACKING);
      }
      if (valueText) {
        ctx.font = `700 ${15 * BACKING}px sans-serif`;
        const tw = ctx.measureText(valueText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(VIEW_W - tw - 20 * BACKING, VIEW_H - 30 * BACKING, tw + 20 * BACKING, 30 * BACKING);
        ctx.fillStyle = '#ffe27a';
        ctx.fillText(valueText, VIEW_W - tw - 10 * BACKING, VIEW_H - 9 * BACKING);
      }
    },
    [dims.w, dims.h, fitScale, measure],
  );

  /** Overlay for the current phase (what should be on screen right now). */
  const currentOverlay = useCallback((): Overlay => {
    if (phase === 'setup') {
      return markMode === 'calibrate' ? { calib: calibPts, pts: points } : { pts: points };
    }
    if (phase === 'review' || (phase === 'tracking' && ctlRef.current.paused)) {
      const recs = recordsRef.current;
      const start = recs[0]?.frame ?? 0;
      // editFrameRef (not state) so a draw right after a scrub isn't one frame stale
      const rec = recs[Math.max(0, Math.min(recs.length - 1, editFrameRef.current - start))];
      return {
        pts: rec ? rec.pts : [],
        note:
          phase === 'review'
            ? 'REVIEW — drag a point to correct it, then re-track or save'
            : lost
              ? 'TRACKING LOST — fix the point(s), then Resume'
              : 'PAUSED — scrub back or drag points, then Resume',
        noteColor: lost ? '#ff8181' : '#ffb100',
      };
    }
    return {};
  }, [phase, markMode, calibPts, points, lost]);

  /** Seek to a frame and repaint with the current overlay. */
  const showFrame = useCallback(
    async (frame: number, overlay?: Overlay) => {
      const src = srcRef.current;
      if (!src) return;
      const seq = ++seekSeq.current;
      await readFrame(src, frame);
      if (seq !== seekSeq.current) return; // a newer scrub superseded this one
      draw(overlay ?? currentOverlay());
    },
    [draw, currentOverlay],
  );

  // Repaint whenever overlay-relevant state changes outside the tracking loop.
  useEffect(() => {
    if (phase === 'setup' || phase === 'review' || (phase === 'tracking' && paused)) {
      draw(currentOverlay());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, calibPts, markMode, phase, paused, editFrame, editTick, zoomUi]);

  // Native wheel listener (React's is passive, so preventDefault needs this).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      if (phaseRef.current === 'empty') return;
      e.preventDefault();
      const b = eventToBacking(e);
      if (!b) return;
      const factor = Math.pow(1.0015, -e.deltaY);
      applyZoom(viewRef.current.z * factor, b.x, b.y);
      draw(currentOverlayRef.current());
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'empty']);

  // Keep live refs for native listeners and the playback loop.
  const currentOverlayRef = useRef(currentOverlay);
  currentOverlayRef.current = currentOverlay;
  const showFrameRef = useRef(showFrame);
  showFrameRef.current = showFrame;

  // ------------------------------------------------------------------ loading
  /** Point the current video source at the blurrer (or detach it). */
  const syncBlur = useCallback(() => {
    const src = srcRef.current;
    if (!src) return;
    const b = blurRef.current;
    src.postProcess =
      blurFacesRef.current && b
        ? (img, ctx, canvas) => b.process(img, ctx, canvas)
        : null;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    stopPlayback();
    setError(null);
    setBusy('Reading video…');
    try {
      const src = await openVideo(file);
      if (srcRef.current) closeVideo(srcRef.current);
      srcRef.current = src;
      setDims({ w: src.width, h: src.height });
      setFpsState(Math.round(src.fps * 100) / 100);
      setFrameCount(src.frameCount);
      setCurFrame(0);
      setPoints(getMeasure(measureKeyRef.current).points.map(() => null));
      setActivePt(0);
      setCalibPts([]);
      setPxPerMm(null);
      setCalibMm('');
      setClipName(file.name.replace(/\.[^.]+$/, ''));
      viewRef.current = { z: 1, tx: 0, ty: 0 };
      setZoomUi(1);
      setPhase('setup');
      setBusy('Loading tracking engine…');
      await loadOpenCV(); // warm the WASM up front so Track is instant
      try {
        blurRef.current = await loadFaceBlurrer();
        blurRef.current.reset(); // drop face regions held from a previous clip
      } catch {
        setNotice(
          'Automatic face blurring could not load, so faces will NOT be hidden in the preview. Reload the page to retry.',
        );
      }
      syncBlur();
      setBusy(null);
      requestAnimationFrame(() => {
        void showFrame(0).catch(() => {
          /* a failed preview draw shouldn't crash the page */
        });
      });
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const measureKeyRef = useRef(measureKey);
  measureKeyRef.current = measureKey;

  const changeMeasure = (key: string) => {
    setMeasureKey(key);
    setPoints(getMeasure(key).points.map(() => null));
    setActivePt(0);
    setMarkMode('points');
  };

  // ------------------------------------------------------------ interactions
  const editable = () =>
    phase === 'setup' || phase === 'review' || (phase === 'tracking' && ctlRef.current.paused);

  /** The frame record currently shown while paused / reviewing, if any. */
  const currentRecord = (): FrameRecord | null => {
    if (phase !== 'review' && !(phase === 'tracking' && ctlRef.current.paused)) return null;
    const recs = recordsRef.current;
    if (!recs.length) return null;
    const start = recs[0].frame;
    const i = Math.max(0, Math.min(recs.length - 1, editFrameRef.current - start));
    return recs[i];
  };

  const dragRef = useRef<{
    mode: 'point' | 'calib' | 'pan';
    idx: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (playingRef.current) stopPlayback();
    if (!editable()) return;
    const b = eventToBacking(e);
    if (!b) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const s = fitScale() * viewRef.current.z;
    const hitR = (12 * BACKING) / s; // 12 CSS px in video units
    const vp = backingToVideo(b);

    // Hit-test whatever is editable right now.
    let mode: 'point' | 'calib' | 'pan' = 'pan';
    let idx = -1;
    const tryHit = (cands: (XY | null)[]): number => {
      let best = -1;
      let bestD = hitR;
      cands.forEach((p, i) => {
        if (!p) return;
        const d = Math.hypot(p.x - vp.x, p.y - vp.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };
    if (phase === 'setup' && markMode === 'calibrate') {
      idx = tryHit(calibPts);
      if (idx >= 0) mode = 'calib';
    } else if (phase === 'setup') {
      idx = tryHit(points);
      if (idx >= 0) mode = 'point';
    } else {
      const rec = currentRecord();
      idx = rec ? tryHit(rec.pts) : -1;
      if (idx >= 0) mode = 'point';
    }
    dragRef.current = { mode, idx, startX: b.x, startY: b.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const b = eventToBacking(e);
    if (!b) return;
    if (Math.hypot(b.x - d.startX, b.y - d.startY) > 4 * BACKING) d.moved = true;
    if (!d.moved) return;

    if (d.mode === 'pan') {
      viewRef.current.tx += b.x - d.startX;
      viewRef.current.ty += b.y - d.startY;
      d.startX = b.x;
      d.startY = b.y;
      clampView();
      draw(currentOverlay());
      return;
    }
    const vp = backingToVideo(b);
    if (d.mode === 'calib') {
      setCalibPts((prev) => prev.map((p, i) => (i === d.idx ? vp : p)));
    } else if (phase === 'setup') {
      setPoints((prev) => prev.map((p, i) => (i === d.idx ? vp : p)));
      setActivePt(d.idx);
    } else {
      movePointAt(d.idx, vp);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.moved) return;
    const b = eventToBacking(e);
    if (!b) return;
    const vp = backingToVideo(b);

    if (phase === 'setup' && markMode === 'calibrate') {
      setCalibPts((prev) => (prev.length >= 2 ? [vp] : [...prev, vp]));
      return;
    }
    if (phase === 'setup') {
      // Place the active point, then advance to the next unplaced one.
      setPoints((prev) => {
        const next = prev.map((p, i) => (i === activePt ? vp : p));
        const after = next.findIndex((p) => p === null);
        setActivePt(after >= 0 ? after : activePt);
        return next;
      });
      return;
    }
    // Paused / review: a plain click re-anchors the selected point.
    movePointAt(activePt, vp);
  };

  /** Correct a tracked point at the currently shown frame (paused or review). */
  const movePointAt = (idx: number, vp: XY) => {
    const rec = currentRecord();
    if (!rec || !rec.pts[idx]) return;
    rec.pts[idx] = { x: vp.x, y: vp.y, ok: true };
    const nextBad = rec.pts.findIndex((p) => p.ok === false);
    if (nextBad >= 0) {
      // More points still need fixing — select the next one and bring it into view.
      setActivePt(nextBad);
      if (lost) centerOnPoint(rec.pts[nextBad]);
    } else {
      if (lost) setJustFixed(true);
      setLost(false);
    }
    setEditTick((t) => t + 1); // records live in a ref; poke React to repaint
  };

  const onStageKeyDown = (e: React.KeyboardEvent) => {
    const scrubbing =
      phase === 'setup' || phase === 'review' || (phase === 'tracking' && paused);
    if (!scrubbing) return;
    if (e.key === ' ') {
      e.preventDefault();
      if (playing) stopPlayback();
      else startPlayback();
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const target = e.key === 'Home' ? 0 : frameCount - 1; // scrub handlers clamp
      if (phase === 'setup') onScrubSetup(target);
      else onScrubEdit(target);
      return;
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoom(viewRef.current.z * 1.5);
      return;
    }
    if (e.key === '-') {
      e.preventDefault();
      applyZoom(viewRef.current.z / 1.5);
      return;
    }
    if (e.key === '0') {
      e.preventDefault();
      applyZoom(1);
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowRight' ? 1 : -1);
    if (phase === 'setup') onScrubSetup(Math.max(0, Math.min(frameCount - 1, curFrame + step)));
    else onScrubEdit(clampEditFrame(editFrame + step));
  };

  const onScrubSetup = (frame: number) => {
    stopPlayback();
    setCurFrame(frame);
    void showFrame(frame);
  };

  const clampEditFrame = (f: number) => {
    const recs = recordsRef.current;
    if (!recs.length) return f;
    return Math.max(recs[0].frame, Math.min(recs[recs.length - 1].frame, f));
  };

  const onScrubEdit = (frame: number) => {
    stopPlayback();
    const f = clampEditFrame(frame);
    setEditFrame(f);
    editFrameRef.current = f;
    void showFrame(f);
  };

  // ---------------------------------------------------------------- playback
  /** Frames playback may cover right now: whole clip in setup, tracked range otherwise. */
  const playRange = () => {
    const src = srcRef.current;
    if (!src) return null;
    if (phaseRef.current === 'setup') return { start: 0, end: src.frameCount - 1 };
    const recs = recordsRef.current;
    if (!recs.length) return null;
    return { start: recs[0].frame, end: recs[recs.length - 1].frame };
  };

  const stopPlayback = () => {
    playingRef.current = false;
    setPlaying(false);
  };

  const startPlayback = () => {
    const range = playRange();
    if (!range || playingRef.current) return;
    let from = phaseRef.current === 'setup' ? curFrameRef.current : editFrameRef.current;
    if (from >= range.end) from = range.start; // at the end — replay from the top
    playingRef.current = true;
    setPlaying(true);
    playBasis.current = { frame: from, t: performance.now() };
    void playLoop();
  };

  /** Advance frames on the wall clock; slow seeks drop frames instead of dragging the tempo. */
  const playLoop = async () => {
    const src = srcRef.current;
    if (!src) return;
    let shown = -1;
    while (playingRef.current && srcRef.current === src) {
      const range = playRange();
      if (!range) break;
      const b = playBasis.current;
      const raw = b.frame + ((performance.now() - b.t) / 1000) * playSpeedRef.current * src.fps;
      const target = Math.max(range.start, Math.min(range.end, Math.floor(raw)));
      if (target !== shown) {
        shown = target;
        if (phaseRef.current === 'setup') {
          setCurFrame(target);
        } else {
          setEditFrame(target);
          editFrameRef.current = target;
        }
        await showFrameRef.current(target);
      }
      if (target >= range.end) break; // reached the end — leave the last frame up
      await sleep(Math.max(8, 500 / (src.fps * playSpeedRef.current)));
    }
    playingRef.current = false;
    setPlaying(false);
  };

  const changePlaySpeed = (s: number) => {
    setPlaySpeed(s);
    playSpeedRef.current = s;
    if (playingRef.current) {
      // Re-base so the new speed applies from the frame on screen.
      playBasis.current = {
        frame: phaseRef.current === 'setup' ? curFrameRef.current : editFrameRef.current,
        t: performance.now(),
      };
    }
  };

  // Playback is a preview aid; anything that changes what the stage is for stops it.
  useEffect(() => {
    stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, tab]);

  /** Rewind to the most recent frame (at or before the shown one) where every point tracked cleanly. */
  const jumpToLastGood = () => {
    const recs = recordsRef.current;
    if (!recs.length) return;
    const start = recs[0].frame;
    let i = Math.max(0, Math.min(recs.length - 1, editFrameRef.current - start));
    while (i > 0 && !recs[i].pts.every((p) => p.ok !== false)) i--;
    onScrubEdit(recs[i].frame);
  };

  /** Jump to the previous / next frame where any point was flagged during tracking. */
  const jumpFlagged = (dir: 1 | -1) => {
    const recs = recordsRef.current;
    if (!recs.length) return;
    const start = recs[0].frame;
    for (
      let i = Math.max(0, Math.min(recs.length - 1, editFrame - start)) + dir;
      i >= 0 && i < recs.length;
      i += dir
    ) {
      if (recs[i].pts.some((p) => p.ok === false)) {
        onScrubEdit(recs[i].frame);
        return;
      }
    }
  };

  /** Zoom in on the currently selected point at the shown frame. */
  const zoomToActivePoint = () => {
    const rec = currentRecord();
    const p = rec?.pts[activePt];
    if (p) centerOnPoint(p, Math.max(viewRef.current.z, 3));
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
    const pxDist = Math.hypot(calibPts[1].x - calibPts[0].x, calibPts[1].y - calibPts[0].y);
    setPxPerMm(pxDist / mm);
    setError(null);
    setMarkMode('points');
  };

  // ---------------------------------------------------------------- tracking
  const allPlaced = points.every((p) => p !== null);

  const startTracking = () => {
    if (!srcRef.current || !allPlaced) return;
    recordsRef.current = [
      {
        frame: curFrame,
        pts: (points as XY[]).map((p) => ({ x: p.x, y: p.y, ok: true })),
      },
    ];
    trailRef.current = measure.kind === 'point' ? [{ ...(points[0] as XY) }] : [];
    void runTracking(curFrame);
  };

  const retrackFromEdit = () => {
    const recs = recordsRef.current;
    if (!recs.length) return;
    const start = recs[0].frame;
    recs.length = Math.max(1, editFrame - start + 1);
    trailRef.current = [];
    void runTracking(recs[recs.length - 1].frame);
  };

  /** Track forward from `fromFrame` (which must already have a record). */
  const runTracking = async (fromFrame: number) => {
    const src = srcRef.current;
    if (!src) return;
    setError(null);
    const profile = preset(presetName);
    ctlRef.current = { paused: false, finish: false, abort: false, restartFrom: null };
    setPaused(false);
    setLost(false);
    setJustFixed(false);
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

    const recs = recordsRef.current;
    const start = recs[0].frame;
    const total = Math.max(1, src.frameCount - 1 - start);
    let img = await readFrame(src, fromFrame);
    let prevGray = grayFromImageData(cv, img);
    let pts = recs[fromFrame - start].pts.map((p) => ({ ...p }));
    let consecBad = 0;
    let lastProgress = -1;

    const liveOverlay = (note: string, color: string): Overlay => ({
      pts,
      trail: measure.kind === 'point' ? trailRef.current : undefined,
      note,
      noteColor: color,
    });
    draw(liveOverlay('Tracking…', '#7CFC00'));

    try {
      for (let idx = fromFrame + 1; idx < src.frameCount; idx++) {
        // Pause gate: while paused the scrub/drag handlers own the canvas.
        let wasPaused = false;
        while (ctlRef.current.paused && !ctlRef.current.finish && !ctlRef.current.abort) {
          wasPaused = true;
          await sleep(80);
        }
        if (ctlRef.current.finish || ctlRef.current.abort) break;
        if (wasPaused) {
          // Resume from wherever the user scrubbed to, dropping later frames.
          const rf = clampEditFrameRef.current(editFrameRef.current);
          recs.length = rf - start + 1;
          img = await readFrame(src, rf);
          prevGray.delete();
          prevGray = grayFromImageData(cv, img);
          pts = recs[rf - start].pts.map((p) => ({ ...p }));
          trailRef.current = trailRef.current.slice(0, Math.max(1, rf - start + 1));
          consecBad = 0;
          idx = rf;
          continue;
        }

        img = await readFrame(src, idx);
        const gray = grayFromImageData(cv, img);
        let anyBad = false;
        const nextPts = pts.map((p) => {
          const res = lkStep(cv, prevGray, gray, p.x, p.y, profile.fbThresh, profile.errThresh);
          let np = { x: res.x, y: res.y, ok: res.ok };
          if (!np.ok && profile.autoReanchor) {
            const snap = redetectNear(cv, gray, np.x, np.y, profile.reacquireRadius);
            if (snap) np = { ...snap, ok: false };
          }
          if (!np.ok) anyBad = true;
          return np;
        });

        if (anyBad) {
          consecBad += 1;
          if (profile.recoverGrace != null && consecBad > profile.recoverGrace) {
            // Escalate: pause on this frame and ask the user to fix it.
            recs.push({ frame: idx, pts: nextPts });
            pts = nextPts;
            prevGray.delete();
            prevGray = gray;
            ctlRef.current.paused = true;
            setPaused(true);
            setLost(true);
            setJustFixed(false);
            setEditFrame(idx);
            editFrameRef.current = idx;
            // Select the lost point and bring it into view so a plain click fixes it.
            const badIdx = nextPts.findIndex((p) => !p.ok);
            setActivePt(Math.max(0, badIdx));
            if (badIdx >= 0)
              centerOnPoint(nextPts[badIdx], Math.max(viewRef.current.z, 2.5));
            draw(liveOverlay('TRACKING LOST — fix the point(s), then Resume', '#ffb100'));
            continue;
          }
        } else {
          consecBad = 0;
        }

        recs.push({ frame: idx, pts: nextPts });
        pts = nextPts;
        if (measure.kind === 'point') {
          trailRef.current.push({ x: nextPts[0].x, y: nextPts[0].y });
          if (trailRef.current.length > 60) trailRef.current.shift();
        }
        prevGray.delete();
        prevGray = gray;

        const pct = (100 * (idx - start)) / total;
        draw(liveOverlay(anyBad ? 'Re-acquiring point…' : 'Tracking…', anyBad ? '#ffb100' : '#7CFC00'));
        if (pct - lastProgress >= 1 || idx === src.frameCount - 1) {
          lastProgress = pct;
          setProgress(pct);
          setReadout(
            `frame ${idx}/${src.frameCount - 1} · t=${(idx / src.fps).toFixed(2)}s · ${valueReadout(
              measure,
              recs,
              recs.length - 1,
              pxPerMm,
            )}`,
          );
          await sleep(0); // yield to the UI thread
        }
      }
    } finally {
      prevGray.delete();
    }

    if (ctlRef.current.abort) {
      setPhase('setup');
      void showFrame(curFrame, { pts: points });
      return;
    }
    // Land in review on the last tracked frame.
    const last = recs[recs.length - 1]?.frame ?? start;
    setPaused(false);
    setLost(false);
    setPhase('review');
    setEditFrame(last);
    editFrameRef.current = last;
    void showFrame(last);
  };

  // clampEditFrame closes over state; keep a live version for the loop.
  const clampEditFrameRef = useRef(clampEditFrame);
  clampEditFrameRef.current = clampEditFrame;

  const saveSession = () => {
    const recs = recordsRef.current;
    if (recs.length < 2) {
      setError('Not enough tracked frames to build a session.');
      setPhase('setup');
      return;
    }
    const calibNote = pxPerMm ? `two-point · ${pxPerMm.toFixed(2)} px/mm` : '';
    const session = sessionFromTracking(
      `${clipName}_${measure.key}`,
      measure.key,
      recs,
      srcRef.current?.fps ?? fps,
      isLengthMeasure(measure) ? pxPerMm : null,
      calibNote,
    );
    recordsMap.current.set(session.id, recs.slice());
    recordsRef.current = [];
    setSessions((prev) => [...prev, session]);
    setSelectedId(session.id);
    setCompareMode(false);
    setPhase('setup');
    setTab('analyse');
    void showFrame(curFrame);
  };

  const discardTracking = () => {
    recordsRef.current = [];
    setPhase('setup');
    void showFrame(curFrame);
  };

  // ---------------------------------------------------------------- sessions
  const exportCsv = (s: Session) => {
    const recs = recordsMap.current.get(s.id) ?? null;
    downloadText(`${s.name}.csv`, sessionToCsv(s, recs));
  };

  const exportSummaryCsv = () => {
    if (!sessions.length) return;
    downloadText('tracker_summary.csv', sessionsToSummaryCsv(sessions));
  };

  const importCsv = async (files: FileList) => {
    setError(null);
    const added: Session[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push(sessionFromCsv(await file.text(), file.name));
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

  const clearAll = () => {
    if (!window.confirm('Remove all saved sessions from this browser? Exported CSVs are unaffected.'))
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

  const toggleBlur = (on: boolean) => {
    setBlurFaces(on);
    blurFacesRef.current = on;
    syncBlur();
    // Repaint the shown frame so the change is immediate.
    if (phase === 'setup') void showFrame(curFrame);
    else if (phase === 'review' || (phase === 'tracking' && paused))
      void showFrame(editFrameRef.current);
  };

  // ------------------------------------------------------------------- render
  const activeProfile = preset(presetName);
  const profileHint =
    activeProfile.recoverGrace === 0
      ? 'Pauses the moment a point drifts so you can fix it on the spot — most accurate, most interruptions.'
      : activeProfile.recoverGrace == null
        ? 'Never interrupts: lost points snap back automatically and you tidy up any stragglers in review.'
        : `Recovers lost points automatically; pauses for your help only after ${activeProfile.recoverGrace} bad frames in a row (~${(activeProfile.recoverGrace / fps).toFixed(1)} s).`;

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const compareList = sessions.filter((s) => compareIds.has(s.id));

  const activeStep =
    phase === 'empty' ? 0 : phase === 'setup' ? (allPlaced ? 2 : 1) : phase === 'tracking' ? 2 : 3;
  const stepState = (i: number): 'done' | 'active' | 'todo' =>
    i < activeStep ? 'done' : i === activeStep ? 'active' : 'todo';

  const recs = recordsRef.current;
  const trackStart = recs[0]?.frame ?? 0;
  const trackEnd = recs[recs.length - 1]?.frame ?? 0;
  const editRec = recs.length
    ? recs[Math.max(0, Math.min(recs.length - 1, editFrame - trackStart))]
    : null;
  const anyFlagged = recs.some((r) => r.pts.some((p) => p.ok === false));
  const lostLabels = editRec
    ? editRec.pts
        .map((p, i) => (p.ok === false ? measure.points[i]?.label ?? `P${i + 1}` : null))
        .filter(Boolean)
        .join(' + ')
    : '';

  const zoomBar = phase !== 'empty' && (
    <div className="kt-zoombar">
      <button className="kt-icon-btn" onClick={() => applyZoom(zoomUi / 1.5)} aria-label="Zoom out" title="Zoom out">−</button>
      <span className="kt-zoom-val">{Math.round(zoomUi * 100)}%</span>
      <button className="kt-icon-btn" onClick={() => applyZoom(zoomUi * 1.5)} aria-label="Zoom in" title="Zoom in">+</button>
      <button className="kt-icon-btn" onClick={() => applyZoom(1)} title="Fit video">Fit</button>
      <span className="kt-hint" style={{ marginLeft: 6 }}>scroll to zoom · drag to pan</span>
      <label
        className="kt-blur-toggle"
        title="Automatically pixelate any face detected in the video"
      >
        <input
          type="checkbox"
          checked={blurFaces}
          onChange={(e) => toggleBlur(e.target.checked)}
        />
        Blur faces
      </label>
    </div>
  );

  const playbackBar = (
    <div className="kt-playbar">
      <button
        className="kt-btn kt-btn-ghost kt-btn-sm"
        onClick={() => (playing ? stopPlayback() : startPlayback())}
        aria-label={playing ? 'Pause playback' : 'Play'}
      >
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>
      <div className="kt-seg kt-seg-speed" role="group" aria-label="Playback speed">
        {PLAY_SPEEDS.map((s) => (
          <button
            key={s}
            className={playSpeed === s ? 'on' : ''}
            aria-pressed={playSpeed === s}
            onClick={() => changePlaySpeed(s)}
            title={`Play at ${s}× speed`}
          >
            {s}×
          </button>
        ))}
      </div>
      <span className="kt-hint kt-playbar-hint">
        space play/pause · ←/→ step (Shift ×10) · Home/End jump · +/− zoom
      </span>
    </div>
  );

  const pointChips = (interactive: boolean) => (
    <div className="kt-points" role="tablist" aria-label="Measurement points">
      {measure.points.map((pd, i) => {
        const set = phase === 'setup' ? points[i] !== null : true;
        const bad = phase !== 'setup' && editRec?.pts[i]?.ok === false;
        return (
          <button
            key={pd.id}
            role="tab"
            aria-selected={activePt === i}
            className={`kt-point-chip ${activePt === i ? 'on' : ''} ${set ? 'set' : ''} ${bad ? 'bad' : ''}`}
            onClick={() => interactive && setActivePt(i)}
            title={bad ? `${pd.label} — tracking lost here, click to select and fix it` : pd.label}
          >
            <span className="kt-point-dot" style={{ background: POINT_COLORS[i % POINT_COLORS.length] }} />
            {pd.label}
            {bad ? ' ⚠' : set ? ' ✓' : ''}
          </button>
        );
      })}
    </div>
  );

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
          data is waiting when you come back.
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
            <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={exportSummaryCsv}>
              Summary CSV
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
                <span className="kt-swatch" style={{ background: CMP_COLORS[i % CMP_COLORS.length] }} />
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
                    {getMeasure(s.measure).label} · {s.unit} · {s.t.length} frames
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

  return (
    <div className="kt-wrap">
      <div className="kt-header">
        <div className="kt-header-text">
          <h1>ROM &amp; Motion Tracker</h1>
          <p>
            Place landmarks on a video and they are tracked across every frame with optical flow —
            measuring joint range of motion, pelvic tilt and shift, or the drift of any single point.
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
        <button
          role="tab"
          aria-selected={tab === 'track'}
          className={tab === 'track' ? 'on' : ''}
          onClick={() => setTab('track')}
        >
          Track
          {phase === 'tracking' && <span className="kt-tab-badge live">●</span>}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'analyse'}
          className={tab === 'analyse' ? 'on' : ''}
          onClick={() => setTab('analyse')}
        >
          Analyse &amp; export
          {sessions.length > 0 && <span className="kt-tab-badge">{sessions.length}</span>}
        </button>
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
                <div className="kt-drop-title">Drop a video here, or click to choose a file</div>
                <div className="kt-hint">MP4 / MOV / WebM · processed locally, nothing is uploaded · faces are auto-blurred</div>
              </div>
            ) : (
              <div className="kt-card">
                {zoomBar}
                <div
                  className="kt-stage"
                  tabIndex={0}
                  onKeyDown={onStageKeyDown}
                  aria-label="Video stage. Space plays or pauses; left and right arrow keys step frames; Home and End jump to the start and end."
                >
                  <canvas
                    ref={canvasRef}
                    className="kt-canvas"
                    width={VIEW_W}
                    height={VIEW_H}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
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
                      {isLengthMeasure(measure) && (
                        <div className="kt-seg" role="tablist">
                          <button
                            role="tab"
                            aria-selected={markMode === 'points'}
                            className={markMode === 'points' ? 'on' : ''}
                            onClick={() => setMarkMode('points')}
                          >
                            Place point
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
                      )}
                      {allPlaced ? (
                        <span className="kt-chip ok">✓ all points placed</span>
                      ) : (
                        <span className="kt-chip">
                          {points.filter(Boolean).length}/{points.length} points placed
                        </span>
                      )}
                      {isLengthMeasure(measure) && pxPerMm && (
                        <span className="kt-chip ok">✓ {pxPerMm.toFixed(2)} px/mm</span>
                      )}
                    </div>

                    {markMode === 'points' ? (
                      <>
                        {pointChips(true)}
                        <div className="kt-hint">
                          Click the video to place <b>{measure.points[activePt]?.label}</b>. Drag any
                          placed point to fine-tune it — zoom in for precision. {measure.hint}
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="kt-hint" style={{ marginBottom: 6 }}>
                          Click the two ends of a known length (e.g. a 100&nbsp;mm marker), enter that
                          distance, and apply. The reference must sit at the same distance from the
                          camera as the tracked joint, facing the camera flat-on — not angled toward
                          it. Optional — skip to report in pixels.
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
                          <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => setCalibPts([])}>
                            Clear points
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      className="kt-scrub"
                      type="range"
                      min={0}
                      max={Math.max(0, frameCount - 1)}
                      value={curFrame}
                      onChange={(e) => onScrubSetup(parseInt(e.target.value, 10))}
                      aria-label="Scrub video frame"
                    />
                    <div className="kt-row between">
                      <div className="kt-hint">
                        Frame {curFrame} / {frameCount - 1} · {(curFrame / fps).toFixed(2)}s
                      </div>
                      <div className="kt-row" style={{ margin: 0 }}>
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubSetup(Math.max(0, curFrame - 1))}>◀ frame</button>
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubSetup(Math.min(frameCount - 1, curFrame + 1))}>frame ▶</button>
                      </div>
                    </div>
                    {playbackBar}

                    <div className="kt-row" style={{ marginTop: '0.75rem' }}>
                      <button
                        className="kt-btn"
                        disabled={!allPlaced}
                        onClick={startTracking}
                        title={allPlaced ? '' : 'Place all points first'}
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
                    {paused && (
                      <>
                        <input
                          className="kt-scrub"
                          type="range"
                          min={trackStart}
                          max={Math.max(trackStart, trackEnd)}
                          value={editFrame}
                          onChange={(e) => onScrubEdit(parseInt(e.target.value, 10))}
                          aria-label="Rewind through tracked frames"
                        />
                        <div className="kt-row between" style={{ margin: '0 0 0.25rem' }}>
                          <div className="kt-hint">
                            Rewind: frame {editFrame} / {trackEnd} · {(editFrame / fps).toFixed(2)}s —
                            resuming re-tracks from here
                          </div>
                          <div className="kt-row" style={{ margin: 0 }}>
                            <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubEdit(editFrame - 1)}>◀ frame</button>
                            <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubEdit(editFrame + 1)}>frame ▶</button>
                          </div>
                        </div>
                        {playbackBar}
                        <div className="kt-row" style={{ margin: '0 0 0.25rem' }}>
                          <button
                            className="kt-btn kt-btn-ghost kt-btn-sm"
                            onClick={zoomToActivePoint}
                            title="Zoom in on the selected point for precise placement"
                          >
                            🔍 Zoom to {measure.points[activePt]?.label ?? 'point'}
                          </button>
                          {anyFlagged && (
                            <button
                              className="kt-btn kt-btn-ghost kt-btn-sm"
                              onClick={jumpToLastGood}
                              title="Rewind to the most recent frame where every point tracked cleanly"
                            >
                              ⏮ Last good frame
                            </button>
                          )}
                        </div>
                        {measure.points.length > 1 && pointChips(true)}
                      </>
                    )}
                    <div className="kt-row" style={{ marginTop: '0.5rem' }}>
                      <button
                        className={`kt-btn ${justFixed ? 'kt-btn-ok' : 'kt-btn-ghost'}`}
                        onClick={() => {
                          const next = !ctlRef.current.paused;
                          ctlRef.current.paused = next;
                          setPaused(next);
                          setJustFixed(false);
                          if (next) {
                            const last = recordsRef.current[recordsRef.current.length - 1]?.frame ?? 0;
                            setEditFrame(last);
                            editFrameRef.current = last;
                          } else {
                            setLost(false);
                          }
                        }}
                      >
                        {paused ? (justFixed ? '▶ Resume tracking' : '▶ Resume') : '⏸ Pause / rewind'}
                      </button>
                      <button className="kt-btn kt-btn-ok" onClick={() => (ctlRef.current.finish = true)}>
                        ✓ Finish → review
                      </button>
                      <button className="kt-btn kt-btn-warn" onClick={() => (ctlRef.current.abort = true)}>
                        ✕ Abort
                      </button>
                    </div>
                    {(paused || lost) && (
                      <div className={`kt-hint ${lost ? 'danger' : justFixed ? 'ok' : ''}`} style={{ marginTop: 6 }}>
                        {lost
                          ? `Tracking lost${lostLabels ? `: ${lostLabels}` : ''}. The lost point is selected and zoomed in — just click its true position on the video (fixing one selects the next), then Resume.`
                          : justFixed
                            ? '✓ Point re-anchored. Press Resume to re-track forward from this frame.'
                            : 'Paused. Scrub back through tracked frames, drag points to correct them, then Resume — tracking re-runs from the shown frame.'}
                      </div>
                    )}
                  </>
                )}

                {phase === 'review' && (
                  <>
                    <input
                      className="kt-scrub"
                      type="range"
                      min={trackStart}
                      max={Math.max(trackStart, trackEnd)}
                      value={editFrame}
                      onChange={(e) => onScrubEdit(parseInt(e.target.value, 10))}
                      aria-label="Scrub tracked frames"
                    />
                    <div className="kt-row between" style={{ margin: '0 0 0.25rem' }}>
                      <div className="kt-hint">
                        Frame {editFrame} / {trackEnd} · {(editFrame / fps).toFixed(2)}s ·{' '}
                        {editRec ? valueReadout(measure, recs, editFrame - trackStart, pxPerMm) : ''}
                      </div>
                      <div className="kt-row" style={{ margin: 0 }}>
                        {anyFlagged && (
                          <>
                            <button
                              className="kt-btn kt-btn-ghost kt-btn-sm"
                              onClick={() => jumpFlagged(-1)}
                              title="Jump to the previous frame where tracking struggled"
                            >
                              ◀ ⚠
                            </button>
                            <button
                              className="kt-btn kt-btn-ghost kt-btn-sm"
                              onClick={() => jumpFlagged(1)}
                              title="Jump to the next frame where tracking struggled"
                            >
                              ⚠ ▶
                            </button>
                          </>
                        )}
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubEdit(editFrame - 1)}>◀ frame</button>
                        <button className="kt-btn kt-btn-ghost kt-btn-sm" onClick={() => onScrubEdit(editFrame + 1)}>frame ▶</button>
                        <button
                          className="kt-btn kt-btn-ghost kt-btn-sm"
                          onClick={zoomToActivePoint}
                          title="Zoom in on the selected point for precise placement"
                        >
                          🔍 Zoom to point
                        </button>
                      </div>
                    </div>
                    {playbackBar}
                    {measure.points.length > 1 && pointChips(true)}
                    <div className="kt-hint">
                      Check the whole clip. Drag a point (or click with it selected) to correct a
                      frame; use “Re-track from here” to re-run tracking forward from the corrected
                      frame.
                      {anyFlagged &&
                        ' Frames where tracking struggled are marked ⚠ — use the ⚠ arrows to jump straight to them.'}
                    </div>
                    <div className="kt-row" style={{ marginTop: '0.5rem' }}>
                      <button className="kt-btn kt-btn-ok" onClick={saveSession}>
                        ✓ Save session
                      </button>
                      <button className="kt-btn kt-btn-ghost" onClick={retrackFromEdit}>
                        ⟲ Re-track from here
                      </button>
                      <button className="kt-btn kt-btn-warn" onClick={discardTracking}>
                        ✕ Discard
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="kt-card">
              <h3>Measurement</h3>
              <div className="kt-field">
                <label className="kt-label" htmlFor="kt-measure">What to measure</label>
                <select
                  id="kt-measure"
                  className="kt-select"
                  value={measureKey}
                  onChange={(e) => changeMeasure(e.target.value)}
                  disabled={phase === 'tracking' || phase === 'review'}
                >
                  {measureGroups().map(({ group, defs }) => (
                    <optgroup key={group} label={group}>
                      {defs.map((d: MeasureDef) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="kt-hint" style={{ marginTop: 4 }}>{measure.hint}</div>
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
                <div className="kt-hint" style={{ marginTop: 4 }}>{profileHint}</div>
              </div>
              {phase !== 'empty' && (
                <div className="kt-field" style={{ marginBottom: 0 }}>
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
                  <div className="kt-hint" style={{ marginTop: 4 }}>
                    Auto-detected; override if the timeline looks wrong.
                  </div>
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
                    : 'No sessions yet — track a clip in the Track section, or import CSVs.'}
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
    </div>
  );
}

/** Live value text for the readout line, e.g. "angle=143.2°" or "dx=+3.1 dy=-0.4 px". */
function valueReadout(
  measure: MeasureDef,
  recs: FrameRecord[],
  i: number,
  pxPerMm: number | null,
): string {
  const rec = recs[i];
  if (!rec) return '';
  if (isLengthMeasure(measure)) {
    const scale = pxPerMm ? 1 / pxPerMm : 1;
    const unit = pxPerMm ? 'mm' : 'px';
    let dx: number;
    let dy: number;
    if (measure.kind === 'point') {
      dx = (rec.pts[0].x - recs[0].pts[0].x) * scale;
      dy = (rec.pts[0].y - recs[0].pts[0].y) * scale;
    } else {
      // offset2: displacement of pts[1] relative to pts[0], re-zeroed to frame 0
      const o0x = recs[0].pts[1].x - recs[0].pts[0].x;
      const o0y = recs[0].pts[1].y - recs[0].pts[0].y;
      dx = (rec.pts[1].x - rec.pts[0].x - o0x) * scale;
      dy = (rec.pts[1].y - rec.pts[0].y - o0y) * scale;
    }
    return `dx=${dx >= 0 ? '+' : ''}${dx.toFixed(1)} dy=${dy >= 0 ? '+' : ''}${dy.toFixed(1)} ${unit}`;
  }
  return `angle=${measureValue(measure, rec.pts).toFixed(1)}°`;
}
