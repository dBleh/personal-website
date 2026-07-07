// Browser frame access for a loaded video. Replaces OpenCV's VideoCapture:
// we seek an off-screen <video> to frame/fps seconds, draw it to a canvas, and
// read the pixels. Memory stays bounded (only the current frame is held).

import { DEFAULT_FPS } from './constants';

export interface VideoSource {
  el: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  duration: number;
  objectUrl: string;
}

/** Wait for the video to have real metadata (dimensions + duration). */
function whenMeta(el: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (el.readyState >= 1 && el.videoWidth > 0 && isFinite(el.duration)) {
      resolve();
      return;
    }
    const onMeta = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error('Could not open the video (unsupported codec?).'));
    };
    const cleanup = () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('error', onErr);
    };
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('error', onErr);
  });
}

/**
 * Best-effort frames-per-second detection. The HTML video API doesn't expose
 * fps, so we measure it with requestVideoFrameCallback over a short play when
 * available, else fall back to DEFAULT_FPS. The user can override it in the UI.
 */
async function detectFps(el: HTMLVideoElement): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyEl = el as any;
  if (typeof anyEl.requestVideoFrameCallback !== 'function') {
    return DEFAULT_FPS;
  }
  return new Promise<number>((resolve) => {
    const times: number[] = [];
    let done = false;
    const finish = (v: number) => {
      if (done) return;
      done = true;
      el.pause();
      el.muted = false;
      resolve(v);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFrame = (_now: number, meta: any) => {
      times.push(meta.mediaTime);
      if (times.length >= 8) {
        const gaps: number[] = [];
        for (let i = 1; i < times.length; i++) {
          const d = times[i] - times[i - 1];
          if (d > 0) gaps.push(d);
        }
        gaps.sort((a, b) => a - b);
        const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
        finish(med > 0 ? Math.round((1 / med) * 100) / 100 : DEFAULT_FPS);
        return;
      }
      anyEl.requestVideoFrameCallback(onFrame);
    };
    el.muted = true;
    el.currentTime = 0;
    anyEl.requestVideoFrameCallback(onFrame);
    el.play().catch(() => finish(DEFAULT_FPS));
    // Safety timeout: never hang on a stubborn clip.
    setTimeout(() => {
      if (times.length >= 2) {
        const d = times[times.length - 1] - times[0];
        const n = times.length - 1;
        finish(d > 0 ? Math.round((n / d) * 100) / 100 : DEFAULT_FPS);
      } else {
        finish(DEFAULT_FPS);
      }
    }, 1500);
  });
}

/** Build a VideoSource from a File. Detects size, duration, and fps. */
export async function openVideo(file: File): Promise<VideoSource> {
  const el = document.createElement('video');
  el.preload = 'auto';
  el.playsInline = true;
  el.crossOrigin = 'anonymous';
  const objectUrl = URL.createObjectURL(file);
  el.src = objectUrl;

  await whenMeta(el);
  const width = el.videoWidth;
  const height = el.videoHeight;
  const duration = el.duration;
  const fps = await detectFps(el);
  // Re-seek to start after fps probe.
  await seekTime(el, 0);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create a 2D canvas context.');

  const frameCount = Math.max(1, Math.round(duration * fps));

  return {
    el,
    canvas,
    ctx,
    width,
    height,
    fps,
    frameCount,
    duration,
    objectUrl,
  };
}

/** Recompute frameCount when the user overrides fps. */
export function setFps(src: VideoSource, fps: number): VideoSource {
  src.fps = fps;
  src.frameCount = Math.max(1, Math.round(src.duration * fps));
  return src;
}

/** Seek the element to a specific time (s) and wait for the frame to be ready. */
export function seekTime(el: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const dur = isFinite(el.duration) ? el.duration : time + 1;
    const target = Math.max(0, Math.min(time, Math.max(0, dur - 1e-3)));
    const EPS = 1e-3;

    // Already at the target with the frame decoded: setting currentTime again
    // would NOT fire 'seeked', so resolve immediately (the frame is current).
    if (Math.abs(el.currentTime - target) < EPS && el.readyState >= 2) {
      resolve();
      return;
    }

    let done = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.removeEventListener('seeked', onSeeked);
      resolve();
    };
    const onSeeked = () => finish();
    el.addEventListener('seeked', onSeeked);
    try {
      el.currentTime = target;
    } catch {
      finish();
      return;
    }
    // Safety net: never hang if the browser swallows the seeked event.
    timer = setTimeout(finish, 1500);
  });
}

/** Seek to a frame index and return its pixels as ImageData. */
export async function readFrame(
  src: VideoSource,
  frame: number,
): Promise<ImageData> {
  const t = Math.min(src.duration, frame / src.fps);
  await seekTime(src.el, t);
  src.ctx.drawImage(src.el, 0, 0, src.width, src.height);
  return src.ctx.getImageData(0, 0, src.width, src.height);
}

/** Draw the current (already-sought) frame into a target 2D context. */
export function drawCurrentFrame(
  src: VideoSource,
  ctx: CanvasRenderingContext2D,
  dw: number,
  dh: number,
): void {
  ctx.drawImage(src.el, 0, 0, dw, dh);
}

export function closeVideo(src: VideoSource): void {
  try {
    src.el.pause();
    src.el.removeAttribute('src');
    src.el.load();
  } catch {
    /* ignore */
  }
  URL.revokeObjectURL(src.objectUrl);
}
