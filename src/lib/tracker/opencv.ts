// OpenCV.js loader + Lucas-Kanade helpers. This is the browser port of
// kneetracker/tracking.py's lk_step / redetect_near. All heavy computation runs
// client-side in WebAssembly, so videos never leave the user's device.

import { LK } from './constants';

// OpenCV.js is loaded at runtime from a script URL. Self-host it under
// /public/opencv/opencv.js for offline/reliability, or leave the CDN default.
// Override via NEXT_PUBLIC_OPENCV_URL at build time.
const OPENCV_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_OPENCV_URL) ||
  'https://docs.opencv.org/4.x/opencv.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CV = any;

let cvPromise: Promise<CV> | null = null;

/** Load (once) and return the OpenCV.js module. Safe to call repeatedly. */
export function loadOpenCV(): Promise<CV> {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise<CV>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('OpenCV can only load in the browser'));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const ready = () => {
      const cv = w.cv;
      if (cv && typeof cv.then === 'function') {
        // Some builds expose a Promise-like module.
        cv.then((m: CV) => resolve(m)).catch(reject);
      } else if (cv && cv.Mat) {
        resolve(cv);
      } else if (cv) {
        cv['onRuntimeInitialized'] = () => resolve(cv);
      } else {
        reject(new Error('OpenCV loaded but cv object is missing'));
      }
    };

    if (w.cv && w.cv.Mat) {
      resolve(w.cv);
      return;
    }

    const existing = document.getElementById(
      'opencv-js',
    ) as HTMLScriptElement | null;
    if (existing) {
      if (w.cv) ready();
      else existing.addEventListener('load', ready);
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load OpenCV.js')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-js';
    script.src = OPENCV_URL;
    script.async = true;
    script.onload = ready;
    script.onerror = () =>
      reject(
        new Error(
          'Could not load OpenCV.js from ' +
            OPENCV_URL +
            '. Check your connection or self-host it under /public/opencv/.',
        ),
      );
    document.body.appendChild(script);
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
