import test from "node:test";
import assert from "node:assert/strict";
import { findPhotoBounds, photoTransform } from "./catalog-photo-framing";

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
