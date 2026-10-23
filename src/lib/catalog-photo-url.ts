export const CATALOG_PHOTO_VERSION = "3-square-watermark";

export function isCatalogPhotoName(name: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:jpe?g|png|webp|gif)$/i.test(name);
}

/** Uploaded photos use the same server-prepared image in every browser. */
export function catalogPhotoUrl(src: string) {
  const name = src.startsWith("/uploads/") ? src.slice("/uploads/".length) : "";
  return isCatalogPhotoName(name)
    ? `/api/catalog-photo?file=${encodeURIComponent(name)}&v=${CATALOG_PHOTO_VERSION}`
    : src;
}
