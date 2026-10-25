import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAlphaSubject, cleanCutoutAlpha, findPhotoBounds, photoTransform, placeAlphaCutout } from "./catalog-photo-framing";

function photo(width: number, height: number, background = 255) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i + 1] = pixels[i + 2] = background;
    pixels[i + 3] = 255;
  }
  const part = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
      const i = (row * width + col) * 4;
      pixels[i] = 80; pixels[i + 1] = 100; pixels[i + 2] = 130;
    }
  };
  return { pixels, part };
}

test("centres an off-centre group and preserves the furthest fine leads", () => {
  const { pixels, part } = photo(160, 240);
  part(50, 140, 20, 20); part(100, 150, 20, 20); part(118, 168, 1, 12);
  const b = findPhotoBounds(pixels, 160, 240)!;
  assert.ok(b.left < 50 / 160 && b.top < 140 / 240);
  assert.ok(b.left + b.width > 120 / 160 && b.top + b.height > 179 / 240);
  assert.match(photoTransform(b, 1600, 2400, 190, 190), /scale\([23]/);
});
test("does not zoom blank, dark-background or edge-to-edge images", () => {
  assert.equal(findPhotoBounds(photo(160, 240).pixels, 160, 240), null);
  const dark = photo(160, 240, 125); dark.part(40, 50, 80, 100);
  assert.equal(findPhotoBounds(dark.pixels, 160, 240), null);
  const full = photo(160, 240); full.part(1, 1, 158, 238);
  const b = findPhotoBounds(full.pixels, 160, 240)!;
  assert.equal(photoTransform(b, 160, 240, 200, 200), "none");
});
test("adapts framing to landscape and portrait viewports with a safe zoom cap", () => {
  const b = { left: 0.495, top: 0.495, width: 0.01, height: 0.01 };
  assert.match(photoTransform(b, 1000, 1500, 400, 400), /scale\(8.0000\)/);
  assert.equal(photoTransform(b, 0, 1500, 400, 400), "none");
});

test("fits an off-centre object tightly without clipping any edge at phone and desktop sizes", () => {
  const b = { left: 0.21, top: 0.44, width: 0.6, height: 0.23 };
  for (const [w, h] of [[140,140],[176,176],[400,400],[351,760]]) {
    const transform = photoTransform(b, 1512, 2016, w, h);
    const [,x,y,zoom] = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([\d.]+)\)/)!.map(Number);
    const fit = Math.min(w / 1512, h / 2016);
    const left = w / 2 + x + (b.left - 0.5) * 1512 * fit * zoom;
    const right = left + b.width * 1512 * fit * zoom;
    const top = h / 2 + y + (b.top - 0.5) * 2016 * fit * zoom;
    const bottom = top + b.height * 2016 * fit * zoom;
    assert.ok(left >= 3 && right <= w - 3 && top >= 3 && bottom <= h - 3);
    assert.ok(Math.max((right-left)/w, (bottom-top)/h) >= 0.94);
  }
});

test("centres a nearly full-size object even when magnification is unnecessary", () => {
  assert.notEqual(photoTransform({ left: 0.1, top: 0, width: 0.9, height: 1 }, 400,400,200,200), "none");
});

test("ignores a soft grey shadow on the left and centres on the part", () => {
  const width = 180;
  const height = 80;
  const { pixels } = photo(width, height, 255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 70; x++) {
      const luma = 255 - Math.round(x * 0.7);
      const i = (y * width + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = luma;
    }
  }
  for (let y = 20; y < 60; y++) for (let x = 110; x < 160; x++) {
    const i = (y * width + x) * 4;
    pixels[i] = 30; pixels[i + 1] = 40; pixels[i + 2] = 50;
  }
  const bounds = findPhotoBounds(pixels, width, height);
  assert.ok(bounds);
  const center = bounds.left + bounds.width / 2;
  assert.ok(bounds.left > 90 / width, `left ${bounds.left} still includes the shadow`);
  assert.ok(center > 120 / width && center < 155 / width, `center ${center}`);
});

test("keeps a hard-edged grey part and frames a light-grey seamless background", () => {
  const greyPart = photo(160, 100, 255);
  for (let y = 25; y < 75; y++) for (let x = 30; x < 110; x++) {
    const i = (y * 160 + x) * 4;
    greyPart.pixels[i] = greyPart.pixels[i + 1] = greyPart.pixels[i + 2] = 150;
  }
  const kept = findPhotoBounds(greyPart.pixels, 160, 100);
  assert.ok(kept && kept.left < 40 / 160 && kept.left + kept.width > 100 / 160);

  const seamless = photo(160, 120, 198);
  seamless.part(50, 30, 40, 50);
  const framed = findPhotoBounds(seamless.pixels, 160, 120);
  assert.ok(framed && framed.width < 0.55 && framed.height < 0.7);

  const orange = photo(160, 120, 180);
  for (let i = 0; i < orange.pixels.length; i += 4) {
    orange.pixels[i] = 210; orange.pixels[i + 1] = 120; orange.pixels[i + 2] = 40;
  }
  orange.part(40, 30, 50, 40);
  assert.equal(findPhotoBounds(orange.pixels, 160, 120), null);
});

test("alpha cut-out is centred on its visual mass with padding", () => {
  const width = 120;
  const height = 80;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 20; y < 60; y++) for (let x = 70; x < 110; x++) {
    const i = (y * width + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 20;
    pixels[i + 3] = 255;
  }
  const subject = analyzeAlphaSubject(pixels, width, height);
  assert.ok(subject && subject.transparentRatio > 0.5);
  const place = placeAlphaCutout(subject!);
  const scale = place.dw / place.sw;
  const mappedX = place.dx - place.sx * scale + subject!.massX * scale;
  const mappedY = place.dy - place.sy * scale + subject!.massY * scale;
  assert.equal(place.side, 1200);
  assert.ok(Math.abs(mappedX - place.side / 2) < 0.6);
  assert.ok(Math.abs(mappedY - place.side / 2) < 0.6);
  const longest = Math.max(
    (subject!.right - subject!.left) * scale,
    (subject!.bottom - subject!.top) * scale,
  );
  assert.ok(longest / place.side >= 0.7 && longest / place.side <= 0.75);
});

test("a small cut-out is scaled up to the catalog square without clipping an off-centre mass", () => {
  const width = 1440;
  const height = 2560;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 400; y < 860; y++) for (let x = 200; x < 420; x++) {
    const i = (y * width + x) * 4;
    pixels[i + 3] = x < 260 ? 255 : 40;
  }
  const subject = analyzeAlphaSubject(pixels, width, height)!;
  const place = placeAlphaCutout(subject);
  const scale = place.dw / place.sw;
  for (const [x, y] of [[subject.left, subject.top], [subject.right, subject.bottom]]) {
    const dx = place.dx - place.sx * scale + x * scale;
    const dy = place.dy - place.sy * scale + y * scale;
    assert.ok(dx >= -0.6 && dx <= place.side + 0.6);
    assert.ok(dy >= -0.6 && dy <= place.side + 0.6);
  }
  const longest = Math.max((subject.right - subject.left) * scale, (subject.bottom - subject.top) * scale);
  assert.equal(place.side, 1200);
  assert.ok(longest / place.side <= 0.75);
});

function paint(pixels: Uint8ClampedArray, width: number, x: number, y: number, w: number, h: number, alpha: number) {
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) {
    const i = (row * width + col) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 180;
    pixels[i + 3] = alpha;
  }
}

test("faint and disconnected shadow noise is removed; several solid parts are all kept", () => {
  const width = 120;
  const height = 80;
  const pixels = new Uint8ClampedArray(width * height * 4);
  paint(pixels, width, 20, 20, 40, 30, 255);
  paint(pixels, width, 70, 10, 12, 8, 30);
  paint(pixels, width, 90, 50, 6, 6, 110);
  const cleaned = cleanCutoutAlpha(pixels, width, height);
  assert.ok(cleaned);
  const opaque = (x: number, y: number) => cleaned![(y * width + x) * 4 + 3];
  assert.equal(opaque(30, 30), 255);
  assert.equal(opaque(75, 14), 0);
  assert.equal(opaque(92, 52), 0);

  const rival = new Uint8ClampedArray(pixels);
  paint(rival, width, 80, 40, 20, 16, 255);
  paint(rival, width, 5, 70, 3, 3, 255);
  const several = cleanCutoutAlpha(rival, width, height);
  assert.ok(several);
  assert.equal(several![(30 * width + 30) * 4 + 3], 255);
  assert.equal(several![(48 * width + 90) * 4 + 3], 255);
  assert.equal(several![(71 * width + 6) * 4 + 3], 0, "a tiny solid speck is still dropped");
  const group = analyzeAlphaSubject(several!, width, height);
  assert.ok(group);
  assert.equal(group!.left, 20);
  assert.equal(group!.right, 100);
  assert.equal(group!.top, 20);
  assert.equal(group!.bottom, 56);

  const cloud = new Uint8ClampedArray(width * height * 4);
  paint(cloud, width, 10, 10, 80, 50, 100);
  assert.equal(cleanCutoutAlpha(cloud, width, height), null);

  const solid = new Uint8ClampedArray(width * height * 4);
  solid.fill(255);
  assert.equal(cleanCutoutAlpha(solid, width, height), null);

  const blotchy = new Uint8ClampedArray(width * height * 4);
  paint(blotchy, width, 0, 0, width, height, 90);
  paint(blotchy, width, 20, 20, 40, 30, 255);
  paint(blotchy, width, 18, 20, 2, 30, 120);
  const cleanedBlotch = cleanCutoutAlpha(blotchy, width, height);
  assert.ok(cleanedBlotch);
  assert.equal(cleanedBlotch![(30 * width + 30) * 4 + 3], 255);
  assert.equal(cleanedBlotch![(25 * width + 18) * 4 + 3], 120);
  assert.equal(cleanedBlotch![(10 * width + 5) * 4 + 3], 0);

  const opaqueNoise = new Uint8ClampedArray(width * height * 4);
  paint(opaqueNoise, width, 20, 20, 40, 30, 255);
  paint(opaqueNoise, width, 70, 15, 30, 25, 220);
  assert.equal(cleanCutoutAlpha(opaqueNoise, width, height)![(20 * width + 80) * 4 + 3], 220);
});

test("fits a part on a slightly grey white background without mistaking the gradient for the part", () => {
  const { pixels, part } = photo(160, 240, 233);
  for (let y = 20; y < 220; y++) for (let x = 10; x < 150; x++) {
    const i = (y * 160 + x) * 4;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 250;
  }
  part(60, 80, 35, 70); part(94, 140, 1, 18);
  const b = findPhotoBounds(pixels, 160, 240)!;
  assert.ok(b && b.width < 0.3 && b.height < 0.4);
  assert.ok(b.left + b.width > 95 / 160 && b.top + b.height > 158 / 240);
});
