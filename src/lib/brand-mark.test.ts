import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { brandIconPath, brandIcons, brandLogoPath, RADIOKLAD_RASTER_ICONS } from "./brand-mark";

test("RadioKlad serves the Rk monogram and DragSoyuz keeps the antenna mark", () => {
  assert.equal(brandIconPath("radioklad"), "/icon.svg");
  assert.equal(brandLogoPath("radioklad"), "/logo.svg");
  assert.equal(brandIconPath("dragsoyuz"), "/brand/dragsoyuz/icon.svg");
  assert.equal(brandLogoPath("dragsoyuz"), "/brand/dragsoyuz/logo.svg");
  assert.equal(brandIconPath(""), "/icon.svg");

  const radioklad = readFileSync("public/icon.svg", "utf8");
  const logo = readFileSync("public/logo.svg", "utf8");
  const dragsoyuz = readFileSync("public/brand/dragsoyuz/icon.svg", "utf8");
  assert.match(radioklad, /M308 136v240/);
  assert.match(radioklad, /#c88c63/);
  assert.doesNotMatch(radioklad, /M30 12l-5 5/);
  assert.match(logo, /<title>РадиоКлад<\/title>/);
  assert.match(logo, /M308 136v240/);
  assert.match(dragsoyuz, /M30 12l-5 5/);
  assert.match(dragsoyuz, /#214c3c/);
  assert.doesNotMatch(dragsoyuz, /M308 136v240/);
});

test("favicon links follow the theme and the DragSoyuz build drops RadioKlad rasters", () => {
  const radioklad = brandIcons("radioklad");
  const urls = [
    ...radioklad.icon.map((icon) => icon.url),
    ...(radioklad.apple ?? []).map((icon) => icon.url),
  ];
  assert.deepEqual(urls, [
    "/icon.svg",
    "/icons/icon-32.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/favicon.ico",
    "/apple-touch-icon.png",
  ]);

  const dragsoyuz = brandIcons("dragsoyuz");
  assert.deepEqual(dragsoyuz.icon.map((icon) => icon.url), ["/brand/dragsoyuz/icon.svg"]);
  assert.equal(dragsoyuz.apple, undefined);

  const script = readFileSync("scripts/sync-brand-icons.mjs", "utf8");
  for (const file of RADIOKLAD_RASTER_ICONS) {
    assert.match(script, new RegExp(file.replaceAll(".", "\\.")));
  }
});
