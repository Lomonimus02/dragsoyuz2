import sharp from "sharp";

// libvips memory is native, outside the V8 heap. One thread and a small cache
// keep a product-photo decode inside the 1 GB service limit.
sharp.concurrency(1);
sharp.cache({ memory: 16, files: 0, items: 8 });

export { sharp };

export const SHARP_DECODE = {
  limitInputPixels: 24_000_000,
  sequentialRead: true,
} as const;

/** First decode never keeps a larger bitmap than this. */
export const SHARP_WORKING_EDGE = 2000;
export const CATALOG_OUTPUT_EDGE = 1200;
