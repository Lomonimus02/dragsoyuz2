import sharp from "sharp";
import { findPhotoBounds } from "./catalog-photo-framing";

/** Trim the background in memory before square padding and watermarking. */
export async function createCatalogPhotoPreview(input: Buffer): Promise<Buffer | null> {
  const options = { limitInputPixels: 24_000_000 };
  const metadata = await sharp(input, options).metadata();
  if ((metadata.pages ?? 1) > 1) return null; // Preserve animations.
  const width = metadata.autoOrient.width;
  const height = metadata.autoOrient.height;
  const sample = await sharp(input, options).autoOrient()
    .resize(384, 384, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = findPhotoBounds(sample.data, sample.info.width, sample.info.height);
  if (!bounds) return null;
  const left = Math.max(0, Math.floor(bounds.left * width));
  const top = Math.max(0, Math.floor(bounds.top * height));
  const right = Math.min(width, Math.ceil((bounds.left + bounds.width) * width));
  const bottom = Math.min(height, Math.ceil((bounds.top + bounds.height) * height));
  return sharp(input, options).autoOrient()
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 }).toBuffer();
}
