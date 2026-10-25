import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createWatermarkedPhoto } from "./catalog-photo-watermark";
import path from "node:path";

export async function saveWatermarkedPhoto(input: Buffer, uploadsDirectory: string, purpose: "catalog" | "store" | "client-framed" = "catalog") {
  // No file is written until validation, framing and watermarking succeed.
  const marked = await createWatermarkedPhoto(input, "webp", purpose);
  await mkdir(uploadsDirectory, { recursive: true });
  const name = `${Date.now()}-${randomUUID()}-wm2.webp`;
  await writeFile(path.join(uploadsDirectory, name), marked, { flag: "wx" });
  return name;
}
