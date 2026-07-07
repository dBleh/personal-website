// Small client-side download helpers: text (CSV) and SVG->PNG rasterisation.

export function downloadText(
  filename: string,
  text: string,
  mime = 'text/csv',
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Rasterise a self-contained <svg> element to a PNG and download it. The SVG
 * must not reference external resources (it doesn't) so the canvas stays
 * untainted and toBlob works.
 */
export function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  bg = '#fcfcfb',
  scale = 2,
): void {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const w = svg.viewBox.baseVal.width || svg.clientWidth || 900;
  const h = svg.viewBox.baseVal.height || svg.clientHeight || 660;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };
  img.src = svg64;
}
