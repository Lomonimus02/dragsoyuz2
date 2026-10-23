import sharp from "sharp";

/** Add only white pixels; the photo is neither resampled nor cropped here. */
export async function extendPhotoToSquare(input: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) throw new Error("Missing photo dimensions");
  const side = Math.max(width, height);
  const left = Math.floor((side - width) / 2);
  const top = Math.floor((side - height) / 2);
  return sharp(input).flatten({ background: "white" }).extend({
    left, right: side - width - left,
    top, bottom: side - height - top,
    background: "white",
  }).png().toBuffer();
}
