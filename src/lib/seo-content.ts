import pageCopy from "./seo-pages.json";
import { SITE_BRAND, SITE_THEME } from "./site";

export function seoPageCopy(path: string) {
  const copy = (pageCopy as Record<string, { title: string; description: string; h1: string }>)[path];
  if (path === "/" && SITE_THEME === "radioklad") {
    return {
      ...copy,
      title: `${SITE_BRAND} — скупка радиодеталей и плат в Санкт-Петербурге`,
      h1: `${SITE_BRAND} — скупка радиодеталей в Санкт-Петербурге`,
    };
  }
  return copy;
}

export function productSeoCopy(product: { name: string; seoTitle?: string | null; seoH1?: string | null; seoDescription?: string | null }, brand: string) {
  const name = product.name.replace(/\s+/g, " ").replace(/[ ;]+$/, "").trim();
  return {
    title: product.seoTitle?.trim() || `${name} — скупка в СПб | ${brand}`,
    h1: product.seoH1?.trim() || `Скупка: ${name}`,
    description: product.seoDescription?.trim() || `${name}. Цены скупки в ${brand}, Санкт-Петербург. Уточните оценку по фото и условия приёмки. Возможна отправка деталей из регионов России.`,
  };
}
