export interface PhotoBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Find a product on a plain white/transparent background, without changing its file. */
export function findPhotoBounds(pixels: ArrayLike<number>, width: number, height: number): PhotoBounds | null {
  if (width < 8 || height < 8 || pixels.length !== width * height * 4) return null;
  const borderLevels: number[] = [];
  let borderCount = 0, lightBorder = 0;
  const inspectBorder = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    borderCount++;
    if (pixels[i + 3] < 20) { lightBorder++; return; }
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (min >= 210 && max - min < 18) { lightBorder++; borderLevels.push(min); }
  };
  for (let x = 0; x < width; x++) { inspectBorder(x, 0); inspectBorder(x, height - 1); }
  for (let y = 1; y < height - 1; y++) { inspectBorder(0, y); inspectBorder(width - 1, y); }
  // Accept neutral near-white gradients, but not tables or coloured backgrounds.
  if (lightBorder / borderCount < 0.97) return null;
  borderLevels.sort((a, b) => a - b);
  const backgroundLevel = Math.max(210, Math.min(236,
    (borderLevels[Math.floor(borderLevels.length * 0.05)] ?? 242) - 6));
  const isBackground = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (pixels[i + 3] < 20) return true;
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
    return min >= backgroundLevel && max - min < 18;
  };

  let left = width, right = -1, top = height, bottom = -1, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isBackground(x, y)) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        count++;
      }
    }
  }
  if (count < 24 || right - left < 3 || bottom - top < 3) return null;
  // A small sampling allowance preserves thin leads. The visible margin is set in
  // viewport pixels below, so oversized source margins do not shrink the part.
  const padding = 2;
  left = Math.max(0, left - padding); top = Math.max(0, top - padding);
  right = Math.min(width, right + 1 + padding); bottom = Math.min(height, bottom + 1 + padding);
  return { left: left / width, top: top / height, width: (right - left) / width, height: (bottom - top) / height };
}

export function photoTransform(bounds: PhotoBounds, imageWidth: number, imageHeight: number, boxWidth: number, boxHeight: number) {
  if (!imageWidth || !imageHeight || !boxWidth || !boxHeight) return "none";
  const fit = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const inset = Math.min(4, boxWidth * 0.025, boxHeight * 0.025);
  const zoom = Math.max(1, Math.min(8,
    (boxWidth - 2 * inset) / (bounds.width * imageWidth * fit),
    (boxHeight - 2 * inset) / (bounds.height * imageHeight * fit)));
  const x = (0.5 - bounds.left - bounds.width / 2) * imageWidth * fit * zoom;
  const y = (0.5 - bounds.top - bounds.height / 2) * imageHeight * fit * zoom;
  if (zoom < 1.01 && Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return "none";
  return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${zoom.toFixed(4)})`;
}
