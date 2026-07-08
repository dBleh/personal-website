// OpenCV.js loader + Lucas-Kanade helpers. This is the browser port of
// kneetracker/tracking.py's lk_step / redetect_near. All heavy computation runs
// client-side in WebAssembly, so videos never leave the user's device.

import { LK } from './constants';

// OpenCV.js is loaded at runtime from a script URL. Prefer the local copy
// under `/public/opencv/opencv.js` for offline use, but fall back to the
// official CDN if the local file fails to load. Override the location via
// `NEXT_PUBLIC_OPENCV_URL` at build time.
const OPENCV_LOCAL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_OPENCV_URL) ||
  '/opencv/opencv.js';
const OPENCV_CDN = 'https://docs.opencv.org/4.x/opencv.js';
// Toggle this to force the CDN build for debugging local failures.
const FORCE_CDN = false;

// Fail loudly instead of hanging the "Loading tracking engine…" spinner forever.
const LOAD_TIMEOUT_MS = 60_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CV = any;

let cvPromise: Promise<CV> | null = null;

/**
 * Load (once) and return the initialized OpenCV.js module. Safe to call
 * repeatedly. Modern OpenCV.js (4.x) is a MODULARIZE build: `window.cv` is a
 * *factory function* that must be invoked and awaited — it is not the ready
 * module. Older builds expose the module directly (resolved, or via
 * `onRuntimeInitialized`). This resolves every shape, and rejects (rather than
 * throwing uncaught or hanging) on any failure so the UI can surface an error.
 */
export function loadOpenCV(): Promise<CV> {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise<CV>((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log('[opencv] loadOpenCV() start, OPENCV_LOCAL=', OPENCV_LOCAL, 'OPENCV_CDN=', OPENCV_CDN);
    if (typeof window === 'undefined') {
      reject(new Error('OpenCV can only load in the browser'));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;

    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const done = (mod: CV) => {
      // eslint-disable-next-line no-console
      console.log('[opencv] module initialized');
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Legacy Emscripten builds (including the docs.opencv.org 4.x one)
      // attach a fake `Module.then` that invokes its callback with the Module
      // itself. Resolving a Promise with such a self-referential thenable
      // recurses forever (emscripten#5820) and freezes the page — strip it
      // before resolving.
      if (mod && typeof mod.then === 'function') {
        try {
          delete mod.then;
        } catch {
          /* non-configurable then: fall through and hope it's a real promise */
        }
      }
      resolve(mod);
    };
    const fail = (err: Error) => {
      // eslint-disable-next-line no-console
      console.error('[opencv] load failed', err && err.message ? err.message : err);
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cvPromise = null; // allow a later retry (e.g. the user re-uploads)
      reject(err);
    };
    timer = setTimeout(
      () =>
        fail(
          new Error(
            'Timed out loading the tracking engine (OpenCV.js). Reload and try again.',
          ),
        ),
      LOAD_TIMEOUT_MS,
    );

    // Turn whatever `window.cv` currently is into a ready module.
    const initFromGlobal = () => {
      // eslint-disable-next-line no-console
      console.log('[opencv] initFromGlobal: window.cv=', typeof w.cv);
      const cv = w.cv;
      try {
        if (typeof cv === 'function') {
          // MODULARIZE factory: calling it returns either a real Promise or a
          // legacy self-thenable Module. Never use Promise.resolve() here —
          // assimilating a legacy thenable recurses forever. Call .then
          // directly instead; `done` strips the fake `then` before resolving.
          try {
            const out = cv();
            if (out && typeof out.then === 'function') {
              out.then((m: CV) => {
                w.cv = m || out; // cache the initialized module
                done(w.cv);
              });
            } else {
              w.cv = out;
              done(out);
            }
          } catch (e) {
            // If calling cv() throws synchronously, surface the error.
            fail(e instanceof Error ? e : new Error(String(e)));
          }
        } else if (cv && typeof cv.then === 'function') {
          // Emscripten's non-standard Module.then registers a callback to be
          // invoked when the runtime is ready. Call it directly so we don't
          // accidentally resolve the module before initialization (which
          // happens if we do `Promise.resolve(cv).then(...)`).
          try {
            // Some implementations call the callback immediately if ready,
            // or later when initialized.
            cv.then((m: CV) => {
              // If the thenable yields a module, use it; otherwise, keep
              // `cv` itself which should be the Module object.
              done(m || cv);
            });
          } catch (e) {
            // Fallback: treat `cv` as a plain value and resolve it.
            Promise.resolve(cv).then(done).catch(fail);
          }
        } else if (cv && cv.Mat) {
          done(cv);
        } else if (cv) {
          cv.onRuntimeInitialized = () => done(cv);
        } else {
          fail(new Error('OpenCV script loaded but the cv object is missing.'));
        }
      } catch (e) {
        fail(e instanceof Error ? e : new Error(String(e)));
      }
    };

    // Already loaded by a previous call.
    if (w.cv) {
      initFromGlobal();
      return;
    }

    const existing = document.getElementById(
      'opencv-js',
    ) as HTMLScriptElement | null;
    if (existing) {
      // eslint-disable-next-line no-console
      console.log('[opencv] found existing script element (id=opencv-js)');
      existing.addEventListener('load', initFromGlobal);
      existing.addEventListener('error', () =>
        fail(new Error('Failed to load OpenCV.js.')),
      );
      if (w.cv) initFromGlobal();
      return;
    }

    // Append a new script tag to load OpenCV.js
    const tryAppend = (url: string) => {
      const script = document.createElement('script');
      script.id = 'opencv-js';
      script.src = url;
      script.async = true;
      // eslint-disable-next-line no-console
      console.log('[opencv] appending script', url);
      script.onload = () => {
        // eslint-disable-next-line no-console
        console.log('[opencv] script.onload fired for', url);
        initFromGlobal();
      };
      script.onerror = (ev) => {
        // eslint-disable-next-line no-console
        console.error('[opencv] script.onerror for', url, ev);
        // If this was the local URL, try the CDN as a fallback before failing.
        if (url === OPENCV_LOCAL && OPENCV_CDN) {
          // Remove the failed script element and attempt CDN.
          try { document.body.removeChild(script); } catch {}
          // eslint-disable-next-line no-console
          console.warn('[opencv] local script failed, trying CDN', OPENCV_CDN);
          tryAppend(OPENCV_CDN);
          return;
        }
        fail(new Error('Could not load the tracking engine (OpenCV.js) from ' + url + '.'));
      };
      document.body.appendChild(script);
    };

    // Start with local by default, unless debugging forces the CDN first.
    if (FORCE_CDN && OPENCV_CDN) {
      // eslint-disable-next-line no-console
      console.warn('[opencv] FORCE_CDN enabled — loading CDN first');
      tryAppend(OPENCV_CDN);
    } else {
      tryAppend(OPENCV_LOCAL);
    }
  });
  return cvPromise;
}

/** Wrap a grayscale single-channel cv.Mat around canvas ImageData (RGBA). */
export function grayFromImageData(cv: CV, img: ImageData): CV {
  const src = cv.matFromImageData(img);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  src.delete();
  return gray;
}

export interface LKResult {
  x: number;
  y: number;
  ok: boolean;
  err: number;
}

/**
 * Advance a single tracked point by one frame with Lucas-Kanade flow, with an
 * optional forward-backward consistency check. Direct port of lk_step().
 */
export function lkStep(
  cv: CV,
  prevGray: CV,
  gray: CV,
  px: number,
  py: number,
  fbThresh: number | null,
  errThresh: number,
): LKResult {
  const winSize = new cv.Size(LK.winSize, LK.winSize);
  const criteria = new cv.TermCriteria(
    cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT,
    LK.criteriaCount,
    LK.criteriaEps,
  );

  const p0 = cv.matFromArray(1, 1, cv.CV_32FC2, [px, py]);
  const p1 = new cv.Mat();
  const st = new cv.Mat();
  const err = new cv.Mat();

  cv.calcOpticalFlowPyrLK(
    prevGray,
    gray,
    p0,
    p1,
    st,
    err,
    winSize,
    LK.maxLevel,
    criteria,
  );

  let ok = st.data[0] === 1;
  const e = err.rows > 0 ? err.data32F[0] : 0.0;
  const nx = p1.data32F[0];
  const ny = p1.data32F[1];

  if (ok && errThresh != null && e > errThresh) ok = false;

  // Forward-backward check: re-track p1 back onto prev_gray.
  if (ok && fbThresh != null) {
    const pb = new cv.Mat();
    const stb = new cv.Mat();
    const errb = new cv.Mat();
    cv.calcOpticalFlowPyrLK(
      gray,
      prevGray,
      p1,
      pb,
      stb,
      errb,
      winSize,
      LK.maxLevel,
      criteria,
    );
    if (stb.data[0] !== 1) {
      ok = false;
    } else {
      const dx = pb.data32F[0] - px;
      const dy = pb.data32F[1] - py;
      if (Math.hypot(dx, dy) > fbThresh) ok = false;
    }
    pb.delete();
    stb.delete();
    errb.delete();
  }

  p0.delete();
  p1.delete();
  st.delete();
  err.delete();
  return { x: nx, y: ny, ok, err: e };
}

/**
 * Auto-reanchor helper: find the strongest trackable corner within `radius` px
 * of (px,py) and return it, or null. Port of redetect_near().
 */
export function redetectNear(
  cv: CV,
  gray: CV,
  px: number,
  py: number,
  radius = 18,
): { x: number; y: number } | null {
  const w = gray.cols;
  const h = gray.rows;
  const x = Math.round(px);
  const y = Math.round(py);
  const x0 = Math.max(0, x - radius);
  const y0 = Math.max(0, y - radius);
  const x1 = Math.min(w, x + radius);
  const y1 = Math.min(h, y + radius);
  if (x1 - x0 < 6 || y1 - y0 < 6) return null;

  const rect = new cv.Rect(x0, y0, x1 - x0, y1 - y0);
  const roi = gray.roi(rect);
  const corners = new cv.Mat();
  let result: { x: number; y: number } | null = null;
  try {
    cv.goodFeaturesToTrack(roi, corners, 1, 0.1, 5);
    if (corners.rows > 0) {
      const cx = corners.data32F[0];
      const cy = corners.data32F[1];
      result = { x: x0 + cx, y: y0 + cy };
    }
  } finally {
    roi.delete();
    corners.delete();
  }
  return result;
}
