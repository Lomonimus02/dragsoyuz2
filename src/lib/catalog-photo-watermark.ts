import { createCatalogPhotoPreview } from "./catalog-photo-preview";
import { extendPhotoToSquare } from "./catalog-photo-square";
import { catalogWatermarkSvg } from "./catalog-watermark-svg";
import { CATALOG_OUTPUT_EDGE, SHARP_DECODE, SHARP_WORKING_EDGE, sharp } from "./sharp-runtime";

export class PhotoProcessingError extends Error {}
export type WatermarkFormat = "webp" | "jpeg" | "png";
export type PhotoPurpose = "catalog" | "store" | "client-framed";
let queue: Promise<unknown> = Promise.resolve();

async function downscale(input: Buffer, edge: number) {
  // PNG keeps the shrunk pixels lossless. A lossy intermediate was shifting
  // the crop by a pixel and held no benefit once the bitmap was already small.
  return sharp(input, SHARP_DECODE)
    .rotate()
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true, fastShrinkOnLoad: true })
    .toColourspace("srgb")
    .png({ compressionLevel: 6 })
    .toBuffer();
}

async function prepare(input: Buffer, format: WatermarkFormat, purpose: PhotoPurpose) {
  try {
    const metadata = await sharp(input, SHARP_DECODE).metadata();
    if ((metadata.pages ?? 1) > 1) throw new PhotoProcessingError("Загрузите неподвижную фотографию: JPG, PNG, WebP или GIF без анимации.");
    if (!["jpeg", "png", "webp", "gif"].includes(metadata.format ?? "")) {
      throw new PhotoProcessingError("Поддерживаются фотографии JPG, PNG, WebP и GIF без анимации.");
    }
    // One shrunk decode. The original buffer is not decoded again at full resolution.
    const master = await downscale(input, purpose === "store" ? CATALOG_OUTPUT_EDGE : SHARP_WORKING_EDGE);
    let working: Buffer;
    if (purpose === "client-framed") {
      const fitted = await sharp(master)
        .resize(CATALOG_OUTPUT_EDGE, CATALOG_OUTPUT_EDGE, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      const size = await sharp(fitted).metadata();
      working = size.width === size.height ? fitted : await extendPhotoToSquare(fitted);
    } else if (purpose === "catalog") {
      const framed = await createCatalogPhotoPreview(master);
      working = framed ?? await extendPhotoToSquare(
        await sharp(master).resize(CATALOG_OUTPUT_EDGE, CATALOG_OUTPUT_EDGE, { fit: "inside", withoutEnlargement: true }).png().toBuffer(),
      );
    } else {
      working = master;
    }
    const { width, height } = await sharp(working).metadata();
    const marked = sharp(working).composite([{ input: Buffer.from(catalogWatermarkSvg(width!, height!)) }]);
    if (format === "jpeg") return await marked.flatten({ background: "white" }).jpeg({ quality: 95 }).toBuffer();
    if (format === "png") return await marked.png().toBuffer();
    return await marked.webp({ quality: 94, effort: 3 }).toBuffer();
  } catch (error) {
    if (error instanceof PhotoProcessingError) throw error;
    throw new PhotoProcessingError("Не удалось обработать фотографию. Проверьте файл: до 24 мегапикселей, JPG, PNG, WebP или GIF без анимации.");
  }
}

/** Serial processing bounds memory during concurrent uploads. */
export function createWatermarkedPhoto(input: Buffer, format: WatermarkFormat = "webp", purpose: PhotoPurpose = "catalog") {
  const result = queue.then(() => prepare(input, format, purpose));
  queue = result.then(() => undefined, () => undefined);
  return result;
}
