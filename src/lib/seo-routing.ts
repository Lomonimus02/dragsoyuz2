export function normalizePublicPath(path: string) {
  return path.replace(/\/{2,}/g, "/").replace(/\/+$/, "") || "/";
}

export function isPublicPageRequest(method: string, path: string) {
  return ["GET", "HEAD"].includes(method) &&
    !/^\/(admin|api|_next|uploads)(?:\/|$)/.test(path) &&
    !path.startsWith("/.well-known/") && !/\.[^/]+\/?$/.test(path);
}

export function productCatalogPath(product: { categorySlug: string; slug: string }) {
  return `/catalog/${encodeURIComponent(product.categorySlug)}/${encodeURIComponent(product.slug)}`;
}

export function canonicalPageUrl(path: string, base: string) {
  const url = new URL(path, base);
  url.search = "";
  url.hash = "";
  url.pathname = normalizePublicPath(url.pathname);
  return url.pathname === "/" ? url.origin : url.toString();
}
