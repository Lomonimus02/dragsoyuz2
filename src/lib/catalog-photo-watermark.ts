import sharp from "sharp";
import { createCatalogPhotoPreview } from "./catalog-photo-preview";
import { extendPhotoToSquare } from "./catalog-photo-square";
import lettering from "./catalog-watermark-lettering.json";

export class PhotoProcessingError extends Error {}
export type WatermarkFormat = "webp" | "jpeg" | "png";
let queue: Promise<unknown> = Promise.resolve();

/** Approved grey pattern; bundled Roboto Condensed outlines avoid server font differences. */
export function catalogWatermarkSvg(width: number, height: number) {
  const fontSize = Math.max(1, Math.round(Math.min(width, height) * 0.072));
  const scale = fontSize / lettering.units;
  const cellWidth = Math.max(1, Math.round(lettering.width * scale + fontSize * 1.2));
  const cellHeight = Math.max(1, Math.round(fontSize * 2.65));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><pattern id="mark" patternUnits="userSpaceOnUse" width="${cellWidth}" height="${cellHeight}" patternTransform="rotate(-24)">
      <path d="${lettering.path}" transform="translate(${fontSize * 0.3},${fontSize * 1.35}) scale(${scale},${-scale})" fill="#989898" fill-opacity="0.14"/>
    </pattern></defs><rect width="100%" height="100%" fill="url(#mark)"/>
  </svg>`;
}

async function prepare(input: Buffer, format: WatermarkFormat, purpose: "catalog" | "store") {
  try {
    const options = { limitInputPixels: 24_000_000 };
    const metadata = await sharp(input, options).metadata();
    if ((metadata.pages ?? 1) > 1) throw new PhotoProcessingError("Загрузите неподвижную фотографию: JPG, PNG, WebP или GIF без анимации.");
    if (!["jpeg", "png", "webp", "gif"].includes(metadata.format ?? "")) {
      throw new PhotoProcessingError("Поддерживаются фотографии JPG, PNG, WebP и GIF без анимации.");
    }
    // Crop, extend without rescaling, then mark the entire square. All unmarked
    // intermediate pixels stay in memory only.
    const framed = (purpose === "catalog" ? await createCatalogPhotoPreview(input) : null) ?? await sharp(input, options).autoOrient()
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
    const square = purpose === "catalog" ? await extendPhotoToSquare(framed) : framed;
    const { width, height } = await sharp(square).metadata();
    const marked = sharp(square).composite([{ input: Buffer.from(catalogWatermarkSvg(width!, height!)) }]);
    if (format === "jpeg") return await marked.flatten({ background: "white" }).jpeg({ quality: 95 }).toBuffer();
    if (format === "png") return await marked.png().toBuffer();
    return await marked.webp({ quality: 94 }).toBuffer();
  } catch (error) {
    if (error instanceof PhotoProcessingError) throw error;
    throw new PhotoProcessingError("Не удалось обработать фотографию. Проверьте файл: до 24 мегапикселей, JPG, PNG, WebP или GIF без анимации.");
  }
}

/** Serial processing bounds memory during concurrent uploads. */
export function createWatermarkedPhoto(input: Buffer, format: WatermarkFormat = "webp", purpose: "catalog" | "store" = "catalog") {
  const result = queue.then(() => prepare(input, format, purpose));
  queue = result.then(() => undefined, () => undefined);
  return result;
}
