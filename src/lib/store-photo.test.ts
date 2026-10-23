import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { saveWatermarkedPhoto } from "./catalog-photo-storage";
import { createWatermarkedPhoto } from "./catalog-photo-watermark";

test("store photos keep the full portrait and landscape, and store only marked bytes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "store-photo-test-"));
  try {
    for (const [width, height] of [[720, 1280], [1280, 720]]) {
      const source = await sharp({ create: { width, height, channels: 3, background: "#b9b9b9" } }).png().toBuffer();
      const filename = await saveWatermarkedPhoto(source, directory, "store");
      const marked = await readFile(path.join(directory, filename));
      const metadata = await sharp(marked).metadata();
      assert.equal(metadata.width! / metadata.height!, width / height);
      assert.equal(Math.max(metadata.width!, metadata.height!), 1200);
      const stats = await sharp(marked).stats();
      assert.ok(stats.channels[0].stdev > 0.5, "Watermark should alter the otherwise flat image");
      assert.match(filename, /-wm2\.webp$/);
    }
    assert.equal((await readdir(directory)).length, 2, "No original files may be persisted");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("bad upload does not block the processing queue for the next attempt", async () => {
  await assert.rejects(createWatermarkedPhoto(Buffer.from("broken"), "webp", "store"));
  const valid = await sharp({ create: { width: 30, height: 60, channels: 3, background: "white" } }).png().toBuffer();
  const metadata = await sharp(await createWatermarkedPhoto(valid, "webp", "store")).metadata();
  assert.equal(metadata.width, 30);
  assert.equal(metadata.height, 60);
});
