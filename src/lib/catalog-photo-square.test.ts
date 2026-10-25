import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { extendPhotoToSquare } from "./catalog-photo-square";
import { createWatermarkedPhoto } from "./catalog-photo-watermark";
import { catalogWatermarkSvg } from "./catalog-watermark-svg";

test("square padding preserves every source pixel, including thin edge leads, without enlargement", async () => {
  for (const [width, height] of [[103, 62], [62, 103], [103, 103]]) {
    const pixels = Buffer.alloc(width * height * 3);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 37) % 256;
    const input = await sharp(pixels, {raw:{width,height,channels:3}}).png().toBuffer();
    const output = await extendPhotoToSquare(input);
    const side = Math.max(width,height);
    const meta = await sharp(output).metadata();
    assert.equal(meta.width,side); assert.equal(meta.height,side);
    const left = Math.floor((side-width)/2), top = Math.floor((side-height)/2);
    const preserved = await sharp(output).extract({left,top,width,height}).removeAlpha().raw().toBuffer();
    assert.deepEqual(preserved,pixels,"padding does not resample or discard any photo pixel");
    if (width !== height) {
      const corner = await sharp(output).extract({left:0,top:0,width:1,height:1}).removeAlpha().raw().toBuffer();
      assert.deepEqual(corner,Buffer.from([255,255,255]));
    }
  }
});

test("watermark covers added margins with the same pattern regardless of photo proportions", async () => {
  const samples: Buffer[] = [];
  for (const height of [100,180]) {
    const input = await sharp({create:{width:300,height,channels:3,background:'#31465c'}}).png().toBuffer();
    const output = await createWatermarkedPhoto(input,"png");
    const meta = await sharp(output).metadata();
    assert.equal(meta.width,300); assert.equal(meta.height,300);
    const topMargin = await sharp(output).extract({left:0,top:0,width:300,height:55}).removeAlpha().raw().toBuffer();
    assert.ok(topMargin.some(value=>value<250),"new white margin is watermarked too");
    samples.push(topMargin);
  }
  assert.deepEqual(samples[0],samples[1],"watermark size and origin depend on the final square");
});

test("catalog watermark stays a light repeat instead of a dense curtain", async () => {
  const side = 1200;
  const output = await sharp({ create: { width: side, height: side, channels: 3, background: "white" } })
    .composite([{ input: Buffer.from(catalogWatermarkSvg(side, side)) }])
    .removeAlpha()
    .raw()
    .toBuffer();
  let dark = 0;
  let min = 255;
  for (let i = 0; i < output.length; i += 3) {
    if (output[i] < min) min = output[i];
    if (output[i] < 250) dark++;
  }
  const ratio = dark / (side * side);
  assert.ok(ratio > 0.02, "mark is still visible");
  assert.ok(ratio < 0.09, "mark does not cover the card");
  assert.ok(min >= 240, "mark stays light grey");
});

test("small photos keep their dimensions; only oversized photos are reduced before padding", async () => {
  for (const [width,height,side] of [[160,90,160],[1800,900,1200]]) {
    const input = await sharp({create:{width,height,channels:3,background:'#31465c'}}).png().toBuffer();
    const output = await createWatermarkedPhoto(input);
    const meta = await sharp(output).metadata();
    assert.equal(meta.width,side); assert.equal(meta.height,side);
  }
});
