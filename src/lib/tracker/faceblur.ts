// Automatic face anonymisation for the video preview. Haar-cascade face
// detection (frontal + both profiles) runs on each decoded frame via the
// OpenCV.js module we already load for tracking, and every detected face is
// pixelated on the display canvas. Detection happens on the raw pixels, but
// tracking also uses the raw pixels (readFrame captures ImageData before this
// runs), so blurring never affects tracking accuracy.

import { loadOpenCV } from './opencv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CV = any;

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Cascade model files, served from /public alongside opencv.js.
const CASCADES = {
  frontal: '/opencv/haarcascade_frontalface_default.xml',
  profile: '/opencv/haarcascade_profileface.xml',
};

// Detection runs on a downscaled copy for speed.
const DETECT_WIDTH = 320;
// Re-detect every Nth processed frame; boxes are held in between.
const DETECT_EVERY = 2;
// Keep blurring a region for this many processed frames after the detector
// last saw a face there — bridges frames where detection momentarily fails,
// erring on the side of over-blurring.
const HOLD_FRAMES = 36;
// Padding around the raw detector box (it hugs the face tightly).
const PAD_X = 0.25;
const PAD_Y = 0.35;

/** Fetch a cascade XML into the Emscripten FS and load a classifier from it. */
async function loadCascade(cv: CV, url: string): Promise<CV> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch face model ${url} (${res.status}).`);
  const data = new Uint8Array(await res.arrayBuffer());
  const fsName = url.split('/').pop() as string;
  try {
    cv.FS_createDataFile('/', fsName, data, true, false, false);
  } catch {
    /* already present from a previous load */
  }
  const clf = new cv.CascadeClassifier();
  if (!clf.load(fsName)) {
    clf.delete();
    throw new Error(`Face model ${fsName} failed to load.`);
  }
  return clf;
}

function iou(a: FaceBox, b: FaceBox): number {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  return inter / (a.w * a.h + b.w * b.h - inter);
}

/** Mosaic one region of the canvas so the face is unrecognisable. */
function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scratch: HTMLCanvasElement,
  b: FaceBox,
): void {
  const x = Math.max(0, Math.floor(b.x));
  const y = Math.max(0, Math.floor(b.y));
  const w = Math.min(canvas.width - x, Math.ceil(b.w));
  const h = Math.min(canvas.height - y, Math.ceil(b.h));
  if (w < 4 || h < 4) return;
  // Cell size scales with the face so close-ups stay just as anonymous.
  const cell = Math.max(10, Math.round(Math.max(w, h) / 8));
  const tw = Math.max(1, Math.round(w / cell));
  const th = Math.max(1, Math.round(h / cell));
  scratch.width = tw;
  scratch.height = th;
  const sctx = scratch.getContext('2d');
  if (!sctx) return;
  sctx.imageSmoothingEnabled = true;
  sctx.drawImage(canvas, x, y, w, h, 0, 0, tw, th);
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scratch, 0, 0, tw, th, x, y, w, h);
  ctx.imageSmoothingEnabled = smoothing;
}

export class FaceBlurrer {
  private held: { box: FaceBox; ttl: number }[] = [];
  private counter = 0;
  private scratch: HTMLCanvasElement;

  constructor(
    private cv: CV,
    private frontal: CV,
    private profile: CV,
  ) {
    this.scratch = document.createElement('canvas');
  }

  /** Forget held regions (call when a different video is loaded). */
  reset(): void {
    this.held = [];
    this.counter = 0;
  }

  /**
   * Detect faces in the frame's raw pixels and pixelate them on the display
   * canvas. Call after the frame is drawn and its ImageData captured.
   */
  process(
    img: ImageData,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    if (this.counter % DETECT_EVERY === 0) this.refresh(this.detect(img));
    this.counter += 1;
    for (const h of this.held) {
      h.ttl -= 1;
      pixelateRegion(ctx, canvas, this.scratch, h.box);
    }
    this.held = this.held.filter((h) => h.ttl > 0);
  }

  private refresh(found: FaceBox[]): void {
    for (const f of found) {
      const hit = this.held.find((h) => iou(h.box, f) > 0.3);
      if (hit) {
        hit.box = f;
        hit.ttl = HOLD_FRAMES;
      } else {
        this.held.push({ box: f, ttl: HOLD_FRAMES });
      }
    }
  }

  private detect(img: ImageData): FaceBox[] {
    const cv = this.cv;
    const boxes: FaceBox[] = [];
    const src = cv.matFromImageData(img);
    const gray = new cv.Mat();
    const small = new cv.Mat();
    const flipped = new cv.Mat();
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      const scale = Math.min(1, DETECT_WIDTH / gray.cols);
      cv.resize(
        gray,
        small,
        new cv.Size(Math.round(gray.cols * scale), Math.round(gray.rows * scale)),
      );
      cv.equalizeHist(small, small);

      const run = (clf: CV, mat: CV, mirrored: boolean) => {
        const faces = new cv.RectVector();
        try {
          clf.detectMultiScale(mat, faces, 1.1, 4, 0, new cv.Size(18, 18));
          for (let i = 0; i < faces.size(); i++) {
            const r = faces.get(i);
            const rx = mirrored ? mat.cols - r.x - r.width : r.x;
            const w = r.width / scale;
            const h = r.height / scale;
            boxes.push({
              x: rx / scale - w * PAD_X,
              y: r.y / scale - h * PAD_Y,
              w: w * (1 + 2 * PAD_X),
              h: h * (1 + 2 * PAD_Y),
            });
          }
        } finally {
          faces.delete();
        }
      };

      run(this.frontal, small, false);
      // The profile cascade only finds left-facing faces; run it on a
      // mirrored copy too so right-facing profiles are caught.
      run(this.profile, small, false);
      cv.flip(small, flipped, 1);
      run(this.profile, flipped, true);
    } finally {
      src.delete();
      gray.delete();
      small.delete();
      flipped.delete();
    }

    // Merge overlapping hits from the different cascades into one box.
    const merged: FaceBox[] = [];
    for (const b of boxes) {
      const hit = merged.find((m) => iou(m, b) > 0.3);
      if (hit) {
        const x0 = Math.min(hit.x, b.x);
        const y0 = Math.min(hit.y, b.y);
        hit.w = Math.max(hit.x + hit.w, b.x + b.w) - x0;
        hit.h = Math.max(hit.y + hit.h, b.y + b.h) - y0;
        hit.x = x0;
        hit.y = y0;
      } else {
        merged.push({ ...b });
      }
    }
    return merged;
  }
}

let blurrerPromise: Promise<FaceBlurrer> | null = null;

/** Load (once) the face models and return the shared blurrer. */
export function loadFaceBlurrer(): Promise<FaceBlurrer> {
  if (blurrerPromise) return blurrerPromise;
  blurrerPromise = (async () => {
    const cv = await loadOpenCV();
    if (!cv.CascadeClassifier) {
      throw new Error('This OpenCV.js build has no face detector.');
    }
    const [frontal, profile] = await Promise.all([
      loadCascade(cv, CASCADES.frontal),
      loadCascade(cv, CASCADES.profile),
    ]);
    return new FaceBlurrer(cv, frontal, profile);
  })().catch((e) => {
    blurrerPromise = null; // allow retry on the next video load
    throw e;
  });
  return blurrerPromise;
}
