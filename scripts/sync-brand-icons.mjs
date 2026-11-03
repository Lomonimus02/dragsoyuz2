import { cpSync, rmSync } from "node:fs";

/**
 * Runs at the start of `next build`. RadioKlad (the default) keeps the files
 * committed in public/. A DragSoyuz image must keep serving the previous mark
 * at /icon.svg and /logo.svg and must not publish the Rk favicon.
 * Keep this list in sync with RADIOKLAD_RASTER_ICONS in src/lib/brand-mark.ts.
 */
const RADIOKLAD_RASTER_ICONS = [
  "public/favicon.ico",
  "public/apple-touch-icon.png",
  "public/icons/icon-32.png",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
];

const theme = (process.env.NEXT_PUBLIC_SITE_THEME || "radioklad").trim();
if (theme !== "dragsoyuz") {
  process.exit(0);
}

cpSync("public/brand/dragsoyuz/icon.svg", "public/icon.svg");
cpSync("public/brand/dragsoyuz/logo.svg", "public/logo.svg");
for (const file of RADIOKLAD_RASTER_ICONS) {
  rmSync(file, { force: true });
}
