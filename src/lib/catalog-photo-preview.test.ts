import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { GET } from "../app/api/catalog-photo/route";
import { GET as directPhoto } from "../app/uploads/[...path]/route";
import { createCatalogPhotoPreview } from "./catalog-photo-preview";
import { createWatermarkedPhoto } from "./catalog-photo-watermark";
import { saveWatermarkedPhoto } from "./catalog-photo-storage";
import { catalogPhotoUrl } from "./catalog-photo-url";

test("uploads save only the framed watermarked image; both public routes return those exact bytes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "radioklad-watermark-test-"));
  const previous = process.cwd();
  try {
    await mkdir(path.join(directory, "public/uploads"), { recursive: true });
    process.chdir(directory);
    const input = await sharp({ create: { width: 800, height: 1000, channels: 3, background: "white" } })
      .composite([
        { input: await sharp({ create: { width: 120, height: 100, channels: 3, background: "#34485b" } }).png().toBuffer(), left: 200, top: 400 },
        { input: await sharp({ create: { width: 100, height: 120, channels: 3, background: "#7b8658" } }).png().toBuffer(), left: 420, top: 390 },
        { input: await sharp({ create: { width: 6, height: 80, channels: 3, background: "#a99423" } }).png().toBuffer(), left: 510, top: 500 },
      ]).jpeg().toBuffer();
    const unmarked = (await createCatalogPhotoPreview(input))!;
    const marked = await createWatermarkedPhoto(input);
    const meta = await sharp(marked).metadata();
    const framedMeta = await sharp(unmarked).metadata();
    assert.equal(meta.height, meta.width, "final photo is square");
    assert.equal(framedMeta.width, meta.width);
    assert.equal(framedMeta.height, meta.height);
    assert.ok(meta.width! > 280 && meta.width! < 520, `unexpected square ${meta.width}`);
    const before = await sharp(unmarked).removeAlpha().raw().toBuffer();
    const after = await sharp(marked).removeAlpha().raw().toBuffer();
    let changesInsideParts = 0;
    let leadPixels = 0;
    for (let i = 0; i < before.length; i += 3) {
      const dark = Math.min(before[i], before[i + 1], before[i + 2]) < 160;
      if (dark && Math.max(Math.abs(before[i] - after[i]), Math.abs(before[i + 1] - after[i + 1]), Math.abs(before[i + 2] - after[i + 2])) > 4) changesInsideParts++;
      if (before[i] > 140 && before[i + 1] > 110 && before[i + 2] < 90) leadPixels++;
    }
    assert.ok(leadPixels > 20, "thin lead retained");
    assert.ok(changesInsideParts > 100, "watermark modifies the parts themselves, not just outer margins");
    const uploads = path.join(directory, "public/uploads");
    const name = await saveWatermarkedPhoto(input, uploads);
    assert.deepEqual(await readdir(uploads), [name], "only one watermarked file saved");
    assert.deepEqual(await readFile(path.join(uploads,name)), marked);
    assert.notDeepEqual(marked, input);
    const url = `https://radio-klad.ru${catalogPhotoUrl(`/uploads/${name}`)}`;
    const response = await GET(new Request(url));
    assert.equal(response.status,200);
    assert.equal(response.headers.get("content-type"),"image/webp");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), marked);
    const direct = await directPhoto(new Request(`https://radio-klad.ru/uploads/${name}`), { params: Promise.resolve({path:[name]}) });
    assert.deepEqual(Buffer.from(await direct.arrayBuffer()), marked);
    const repeated = await GET(new Request(url));
    assert.deepEqual(Buffer.from(await repeated.arrayBuffer()), marked, "no repeated watermarking");
    assert.equal((await GET(new Request(url,{headers:{"if-none-match":response.headers.get("etag")!}}))).status,304);
    await assert.rejects(saveWatermarkedPhoto(Buffer.from("invalid image"), uploads));
    assert.deepEqual(await readdir(uploads),[name], "invalid upload leaves no original or partial file");
    for (const invalid of ["missing.jpg", "../secret.png", "https://example.com/photo.jpg", "test.svg"]) {
      assert.equal((await GET(new Request(`https://radio-klad.ru/api/catalog-photo?file=${encodeURIComponent(invalid)}`))).status,404);
    }
  } finally {
    process.chdir(previous);
    assert.ok(path.resolve(directory).startsWith(path.join(os.tmpdir(),"radioklad-watermark-test-")));
    await rm(directory,{recursive:true,force:true});
  }
});

test("a soft shadow is painted white and the part stays near the centre", async () => {
  const width = 240;
  const height = 120;
  const raw = Buffer.alloc(width * height * 3, 255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 90; x++) {
      const luma = 255 - Math.round(x * 0.55);
      const offset = (y * width + x) * 3;
      raw[offset] = raw[offset + 1] = raw[offset + 2] = luma;
    }
  }
  for (let y = 35; y < 85; y++) {
    for (let x = 140; x < 210; x++) {
      const offset = (y * width + x) * 3;
      raw[offset] = 20; raw[offset + 1] = 30; raw[offset + 2] = 40;
    }
  }
  const input = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
  const framed = (await createCatalogPhotoPreview(input))!;
  const meta = await sharp(framed).metadata();
  assert.equal(meta.width, meta.height);
  const pixels = await sharp(framed).removeAlpha().raw().toBuffer();
  const side = meta.width!;
  let weight = 0;
  let mass = 0;
  let grey = 0;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const offset = (y * side + x) * 3;
      const luma = (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3;
      if (luma < 80) {
        weight++;
        mass += x + 0.5;
      } else if (luma < 230) grey++;
    }
  }
  assert.ok(weight > 100, "part survived framing");
  assert.ok(Math.abs(mass / weight - side / 2) < side * 0.12, "part mass is near the centre");
  assert.ok(grey < side * side * 0.02, "residual grey shadow was filled with white");
});

test("coloured backgrounds still receive a watermark; EXIF orientation is respected", async () => {
  const input = await sharp({create:{width:240,height:140,channels:3,background:"#876543"}}).withMetadata({orientation:6}).jpeg().toBuffer();
  const result = await createWatermarkedPhoto(input);
  const meta = await sharp(result).metadata();
  assert.equal(meta.width,240); assert.equal(meta.height,240);
  const pixels = await sharp(result).removeAlpha().raw().toBuffer();
  assert.ok(new Set(pixels).size > 12,"watermark appears on a background that cannot be cropped");
});

test("client-framed photos are watermarked without another crop", async () => {
  const width = 100;
  const height = 100;
  const raw = Buffer.alloc(width * height * 3, 255);
  for (let y = 40; y < 56; y++) {
    for (let x = 4; x < 20; x++) {
      const offset = (y * width + x) * 3;
      raw[offset] = raw[offset + 1] = raw[offset + 2] = 12;
    }
  }
  const input = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
  const output = await createWatermarkedPhoto(input, "png", "client-framed");
  const meta = await sharp(output).metadata();
  assert.equal(meta.width, width);
  assert.equal(meta.height, height);
  const pixel = await sharp(output).extract({ left: 8, top: 48, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  assert.ok(pixel[0] < 80, "subject stays where the browser placed it");
  const catalog = await createWatermarkedPhoto(input, "png", "catalog");
  const catalogMeta = await sharp(catalog).metadata();
  assert.ok(catalogMeta.width! < 70, "the same off-centre part is cropped by the server pipeline");
});

test("animated GIF is rejected instead of retaining an unprotected original", async () => {
  const header=Buffer.from("47494638396101000100800000000000ffffff","hex");
  const frame=Buffer.from("21f904000a0000002c0000000001000100000202440100","hex");
  const gif=Buffer.concat([header,frame,frame,Buffer.from([0x3b])]);
  assert.equal((await sharp(gif).metadata()).pages,2);
  await assert.rejects(createWatermarkedPhoto(gif),/без анимации/);
});
