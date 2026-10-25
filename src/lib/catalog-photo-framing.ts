export interface PhotoBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SubjectAnalysis {
  bounds: PhotoBounds;
  /** 1 = background pixel. */
  background: Uint8Array;
  massX: number;
  massY: number;
  /** Inclusive left/top, exclusive right/bottom of the foreground. */
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ContentWindow {
  left: number;
  top: number;
  width: number;
  height: number;
  padLeft: number;
  padTop: number;
  padRight: number;
  padBottom: number;
}

export interface AlphaSubject {
  left: number;
  top: number;
  right: number;
  bottom: number;
  massX: number;
  massY: number;
  transparentRatio: number;
}

export interface CutoutPlacement {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  side: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

const CORE_LUMA = 22;
const GROW_STEP = 16;
const MAX_DARKER = 86;
const MAX_LIGHTER = 26;
const MAX_CHROMA = 24;

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[sorted.length >> 1] ?? 255;
}

function lumaOf(r: number, g: number, b: number) {
  return (r + g + b) / 3;
}

function chromaOf(r: number, g: number, b: number) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

/**
 * Separate a part from a plain light background.
 * The border colour is measured from the photo itself. A soft grey shadow
 * connected to that border is background; a hard-edged object is not.
 * The returned bounds are centred on visual mass.
 */
export function analyzePhotoSubject(pixels: ArrayLike<number>, width: number, height: number): SubjectAnalysis | null {
  if (width < 8 || height < 8 || pixels.length !== width * height * 4) return null;

  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  let transparentBorder = 0;
  let borderCount = 0;
  const visitBorder = (x: number, y: number) => {
    borderCount++;
    const i = (y * width + x) * 4;
    if (pixels[i + 3] < 20) {
      transparentBorder++;
      return;
    }
    rs.push(pixels[i]);
    gs.push(pixels[i + 1]);
    bs.push(pixels[i + 2]);
  };
  for (let x = 0; x < width; x++) {
    visitBorder(x, 0);
    visitBorder(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    visitBorder(0, y);
    visitBorder(width - 1, y);
  }

  const alphaMode = transparentBorder / borderCount >= 0.85 || rs.length < 8;
  const borderR = median(rs);
  const borderG = median(gs);
  const borderB = median(bs);
  const borderLuma = alphaMode ? 255 : lumaOf(borderR, borderG, borderB);
  const borderChroma = alphaMode ? 0 : chromaOf(borderR, borderG, borderB);
  if (!alphaMode) {
    if (borderChroma > 32 || borderLuma < 168) return null;
    let similar = 0;
    const countSimilar = (x: number, y: number) => {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] < 20) {
        similar++;
        return;
      }
      const chroma = chromaOf(pixels[i], pixels[i + 1], pixels[i + 2]);
      const luma = lumaOf(pixels[i], pixels[i + 1], pixels[i + 2]);
      if (chroma <= MAX_CHROMA + 8 && Math.abs(luma - borderLuma) <= 36) similar++;
    };
    for (let x = 0; x < width; x++) {
      countSimilar(x, 0);
      countSimilar(x, height - 1);
    }
    for (let y = 1; y < height - 1; y++) {
      countSimilar(0, y);
      countSimilar(width - 1, y);
    }
    if (similar / borderCount < 0.55) return null;
  }

  const background = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (index: number) => {
    if (background[index]) return;
    background[index] = 1;
    queue[tail++] = index;
  };
  const isCore = (r: number, g: number, b: number, alpha: number) => {
    if (alpha < 20) return true;
    if (alphaMode) return false;
    return chromaOf(r, g, b) <= MAX_CHROMA && Math.abs(lumaOf(r, g, b) - borderLuma) <= CORE_LUMA;
  };
  const canGrow = (r: number, g: number, b: number, alpha: number, fromLuma: number) => {
    if (alpha < 20) return true;
    if (alphaMode) return false;
    if (chromaOf(r, g, b) > MAX_CHROMA) return false;
    const luma = lumaOf(r, g, b);
    if (luma < borderLuma - MAX_DARKER || luma > borderLuma + MAX_LIGHTER) return false;
    return Math.abs(luma - fromLuma) <= GROW_STEP;
  };
  const trySeed = (x: number, y: number) => {
    const index = y * width + x;
    const o = index * 4;
    if (isCore(pixels[o], pixels[o + 1], pixels[o + 2], pixels[o + 3])) push(index);
  };
  for (let x = 0; x < width; x++) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index / width) | 0;
    const o = index * 4;
    const fromLuma = pixels[o + 3] < 20 ? borderLuma : lumaOf(pixels[o], pixels[o + 1], pixels[o + 2]);
    const look = (nx: number, ny: number) => {
      const next = ny * width + nx;
      if (background[next]) return;
      const p = next * 4;
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      const a = pixels[p + 3];
      if (isCore(r, g, b, a) || canGrow(r, g, b, a, fromLuma)) push(next);
    };
    if (x > 0) look(x - 1, y);
    if (x + 1 < width) look(x + 1, y);
    if (y > 0) look(x, y - 1);
    if (y + 1 < height) look(x, y + 1);
  }

  // Keep a 1px halo so anti-aliased edges are not painted white.
  const foreground = new Uint8Array(width * height);
  for (let i = 0; i < background.length; i++) if (!background[i]) foreground[i] = 1;
  const dilated = foreground.slice();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!foreground[y * width + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          dilated[ny * width + nx] = 1;
        }
      }
    }
  }
  for (let i = 0; i < background.length; i++) background[i] = dilated[i] ? 0 : 1;

  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let count = 0;
  let weight = 0;
  let massX = 0;
  let massY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (background[index]) continue;
      const p = index * 4;
      const alpha = pixels[p + 3] < 20 ? 0 : pixels[p + 3];
      const contrast = alphaMode
        ? alpha
        : Math.max(0, borderLuma - lumaOf(pixels[p], pixels[p + 1], pixels[p + 2]));
      const sampleWeight = Math.max(1, contrast * (alpha / 255));
      count++;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      weight += sampleWeight;
      massX += (x + 0.5) * sampleWeight;
      massY += (y + 0.5) * sampleWeight;
    }
  }
  if (count < 24 || right - left < 3 || bottom - top < 3 || weight <= 0) return null;
  massX /= weight;
  massY /= weight;
  const subject = { left, top, right: right + 1, bottom: bottom + 1, massX, massY };
  return {
    bounds: boundsFromSubject(subject, width, height),
    background,
    massX,
    massY,
    left,
    top,
    right: right + 1,
    bottom: bottom + 1,
  };
}

/** Find a product on a plain light or transparent background, without changing its file. */
export function findPhotoBounds(pixels: ArrayLike<number>, width: number, height: number): PhotoBounds | null {
  return analyzePhotoSubject(pixels, width, height)?.bounds ?? null;
}

function boundsFromSubject(
  subject: { left: number; top: number; right: number; bottom: number; massX: number; massY: number },
  width: number,
  height: number,
): PhotoBounds {
  const pad = 2;
  const halfW = Math.max(subject.massX - subject.left, subject.right - 1 - subject.massX) + pad;
  const halfH = Math.max(subject.massY - subject.top, subject.bottom - 1 - subject.massY) + pad;
  let winW = Math.max(1, Math.round(halfW * 2));
  let winH = Math.max(1, Math.round(halfH * 2));
  let left = Math.round(subject.massX - halfW);
  let top = Math.round(subject.massY - halfH);
  if (winW >= width) {
    left = 0;
    winW = width;
  } else {
    if (left < 0) left = 0;
    if (left + winW > width) left = width - winW;
  }
  if (winH >= height) {
    top = 0;
    winH = height;
  } else {
    if (top < 0) top = 0;
    if (top + winH > height) top = height - winH;
  }
  return { left: left / width, top: top / height, width: winW / width, height: winH / height };
}

/** Symmetric window around the visual mass. Negative origin means white padding. */
export function subjectContentWindow(
  analysis: Pick<SubjectAnalysis, "left" | "top" | "right" | "bottom" | "massX" | "massY">,
  width: number,
  height: number,
): ContentWindow {
  const pad = 2;
  const halfW = Math.max(analysis.massX - analysis.left, analysis.right - 1 - analysis.massX) + pad;
  const halfH = Math.max(analysis.massY - analysis.top, analysis.bottom - 1 - analysis.massY) + pad;
  const winW = Math.max(1, Math.round(halfW * 2));
  const winH = Math.max(1, Math.round(halfH * 2));
  const left = Math.round(analysis.massX - halfW);
  const top = Math.round(analysis.massY - halfH);
  return {
    left,
    top,
    width: winW,
    height: winH,
    padLeft: Math.max(0, -left),
    padTop: Math.max(0, -top),
    padRight: Math.max(0, left + winW - width),
    padBottom: Math.max(0, top + winH - height),
  };
}

/** Alpha bounds of a browser cut-out. Weight is opacity, so a faint fringe does not move the part. */
export function analyzeAlphaSubject(pixels: ArrayLike<number>, width: number, height: number, alphaMin = 16): AlphaSubject | null {
  if (width < 2 || height < 2 || pixels.length !== width * height * 4) return null;
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let count = 0;
  let transparent = 0;
  let weight = 0;
  let massX = 0;
  let massY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha < alphaMin) {
        transparent++;
        continue;
      }
      count++;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      weight += alpha;
      massX += (x + 0.5) * alpha;
      massY += (y + 0.5) * alpha;
    }
  }
  if (count < 24 || right - left < 3 || bottom - top < 3 || weight <= 0) return null;
  return {
    left,
    top,
    right: right + 1,
    bottom: bottom + 1,
    massX: massX / weight,
    massY: massY / weight,
    transparentRatio: transparent / (width * height),
  };
}

const FAINT_ALPHA = 48;
const SOLID_ALPHA = 160;
const EDGE_RADIUS = 2;
/** Longest side of the part, as a fraction of the catalog square. */
const CUTOUT_FILL = 0.725;

/**
 * Drop faint alpha and detached specks. A second solid object that is not a
 * speck means the cut-out is not one part, so the caller falls back to server framing.
 * Returns null when the background was not really separated.
 */
export function cleanCutoutAlpha(pixels: ArrayLike<number>, width: number, height: number): Uint8ClampedArray | null {
  if (width < 2 || height < 2 || pixels.length !== width * height * 4) return null;
  const out = new Uint8ClampedArray(pixels.length);
  out.set(pixels);
  const count = width * height;
  const solid = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const alpha = out[i * 4 + 3];
    if (alpha < FAINT_ALPHA) out[i * 4 + 3] = 0;
    else if (alpha >= SOLID_ALPHA) solid[i] = 1;
  }

  const labels = new Int32Array(count);
  const areas = [0];
  const stack = new Int32Array(count);
  let stackTop = 0;
  let currentLabel = 0;
  const push = (next: number) => {
    if (!solid[next] || labels[next]) return;
    labels[next] = currentLabel;
    stack[stackTop++] = next;
  };
  for (let start = 0; start < count; start++) {
    if (!solid[start] || labels[start]) continue;
    currentLabel++;
    let area = 0;
    stackTop = 0;
    push(start);
    while (stackTop > 0) {
      const cur = stack[--stackTop];
      area++;
      const x = cur % width;
      const y = (cur - x) / width;
      if (x > 0) push(cur - 1);
      if (x + 1 < width) push(cur + 1);
      if (y > 0) push(cur - width);
      if (y + 1 < height) push(cur + width);
    }
    areas.push(area);
  }

  let main = 0;
  let mainArea = 0;
  for (let label = 1; label < areas.length; label++) {
    if (areas[label] > mainArea) {
      mainArea = areas[label];
      main = label;
    }
  }
  if (mainArea < 24) return null;
  const noiseArea = Math.max(24, Math.floor(mainArea * 0.08));
  for (let label = 1; label < areas.length; label++) {
    if (label !== main && areas[label] >= noiseArea) return null;
  }

  const near = new Uint8Array(count);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (labels[y * width + x] !== main) continue;
      const y0 = Math.max(0, y - EDGE_RADIUS);
      const y1 = Math.min(height - 1, y + EDGE_RADIUS);
      const x0 = Math.max(0, x - EDGE_RADIUS);
      const x1 = Math.min(width - 1, x + EDGE_RADIUS);
      for (let yy = y0; yy <= y1; yy++) {
        const row = yy * width;
        for (let xx = x0; xx <= x1; xx++) near[row + xx] = 1;
      }
    }
  }

  let transparent = 0;
  for (let i = 0; i < count; i++) {
    const alpha = out[i * 4 + 3];
    const keep = labels[i] === main || (near[i] && labels[i] === 0 && alpha >= FAINT_ALPHA);
    if (!keep) out[i * 4 + 3] = 0;
    if (out[i * 4 + 3] < 16) transparent++;
  }
  if (transparent / count < 0.05) return null;
  return out;
}

/** Place a cut-out on the catalog square. Visual mass stays centred; the long side stays near 72% of the square. */
export function placeAlphaCutout(subject: AlphaSubject, side = 1200): CutoutPlacement {
  const sidePx = Math.max(32, Math.round(side));
  const bboxW = Math.max(1, subject.right - subject.left);
  const bboxH = Math.max(1, subject.bottom - subject.top);
  const longest = Math.max(bboxW, bboxH);
  const extentW = Math.max(subject.massX - subject.left, subject.right - subject.massX);
  const extentH = Math.max(subject.massY - subject.top, subject.bottom - subject.massY);
  let scale = (CUTOUT_FILL * sidePx) / longest;
  if (extentW > 0) scale = Math.min(scale, (sidePx / 2) / extentW);
  if (extentH > 0) scale = Math.min(scale, (sidePx / 2) / extentH);
  const half = sidePx / (2 * scale);
  return {
    sx: subject.massX - half,
    sy: subject.massY - half,
    sw: half * 2,
    sh: half * 2,
    side: sidePx,
    dx: 0,
    dy: 0,
    dw: sidePx,
    dh: sidePx,
  };
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
