import { analyzePhotoSubject, subjectContentWindow } from "./catalog-photo-framing";
import { extendPhotoToSquare } from "./catalog-photo-square";
import { CATALOG_OUTPUT_EDGE, SHARP_DECODE, SHARP_WORKING_EDGE, sharp } from "./sharp-runtime";

function whitenBackground(pixels: Buffer, width: number, height: number, background: Uint8Array) {
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    if (background[i]) {
      out[offset] = 255;
      out[offset + 1] = 255;
      out[offset + 2] = 255;
      out[offset + 3] = 255;
    } else {
      out[offset] = pixels[offset];
      out[offset + 1] = pixels[offset + 1];
      out[offset + 2] = pixels[offset + 2];
      out[offset + 3] = 255;
    }
  }
  return out;
}

/** Trim the background in memory, centre by mass, and return a white square. */
export async function createCatalogPhotoPreview(input: Buffer): Promise<Buffer | null> {
  const metadata = await sharp(input, SHARP_DECODE).metadata();
  if ((metadata.pages ?? 1) > 1) return null;
  const framed = await (async () => {
    const raster = await sharp(input, SHARP_DECODE)
      .rotate()
      .resize({
        width: SHARP_WORKING_EDGE,
        height: SHARP_WORKING_EDGE,
        fit: "inside",
        withoutEnlargement: true,
        fastShrinkOnLoad: true,
      })
      .toColourspace("srgb")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const width = raster.info.width;
    const height = raster.info.height;
    const analysis = analyzePhotoSubject(raster.data, width, height);
    if (!analysis) return null;
    const whitened = whitenBackground(raster.data, width, height, analysis.background);
    const window = subjectContentWindow(analysis, width, height);
    let pipeline = sharp(whitened, { raw: { width, height, channels: 4 } });
    if (window.padLeft || window.padTop || window.padRight || window.padBottom) {
      pipeline = pipeline.extend({
        left: window.padLeft,
        top: window.padTop,
        right: window.padRight,
        bottom: window.padBottom,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });
    }
    return pipeline
      .extract({
        left: window.left + window.padLeft,
        top: window.top + window.padTop,
        width: window.width,
        height: window.height,
      })
      .resize(CATALOG_OUTPUT_EDGE, CATALOG_OUTPUT_EDGE, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  })();
  if (!framed) return null;
  return extendPhotoToSquare(framed);
}
