# Knee Stability Tracker (web)

A browser-based port of the desktop **knee_tracker** tool. Load a pre-recorded
knee video, mark an anatomical landmark, and the app tracks it across every
frame with **Lucas–Kanade optical flow** (OpenCV.js / WebAssembly), graphing how
far it deviates from a reference position over time. Track several clips and
overlay them on one comparison graph with summary statistics.

**Everything runs client-side.** Videos are never uploaded — all decoding and
tracking happen locally in the browser, which keeps the deployment a free static
site and keeps medical footage on the user's device.

Built on Next.js (static export), deployable to Cloudflare Pages / any static
host. The tracker is the home page (`/`); `/info` is the usage guide. The
original portfolio pages (`/projects`, `/geobuild`) are still present.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to ./out
```

## How the port maps to the Python app

| Desktop (`files/kneetracker`) | Web (`src/lib/tracker`, `src/components/tracker`) |
|-------------------------------|---------------------------------------------------|
| `tracking.py` (LK + fwd-back)  | `opencv.ts` (`lkStep`, `redetectNear`)            |
| `analysis.py` (deviation/stats/CSV) | `analysis.ts`                                |
| `profiles.py` (Strict/Balanced/Forgiving) | `profiles.ts`                           |
| `constants.py` (views, palette) | `constants.ts`                                  |
| Qt hub + graph windows          | `KneeTracker.tsx`, `DeviationChart.tsx`, `ComparisonChart.tsx` |
| `VideoCapture` frame access     | `video.ts` (seek `<video>` → `<canvas>`)          |

The exported CSV format is identical to the desktop app, so CSVs interoperate in
both directions (`Import CSV` reads desktop exports; web exports work with the
desktop `--compare`).

## OpenCV.js (one deployment note)

The optical-flow engine is OpenCV compiled to WebAssembly (~9 MB, loaded once
and cached). By default it loads from the official CDN
(`https://docs.opencv.org/4.x/opencv.js`).

For maximum reliability / offline use, **self-host it**:

1. Download `opencv.js` from https://docs.opencv.org/4.x/opencv.js into
   `public/opencv/opencv.js`.
2. Set the env var at build time:
   ```bash
   NEXT_PUBLIC_OPENCV_URL=/opencv/opencv.js npm run build
   ```

If OpenCV fails to load, the UI shows a clear error with this hint.
