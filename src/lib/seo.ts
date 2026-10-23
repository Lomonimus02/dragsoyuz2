import type { Metadata } from "next";
import { SITE_BRAND, SITE_URL } from "./site";
import { seoPageCopy } from "./seo-content";
import { canonicalPageUrl } from "./seo-routing";

// Next.js replaces nested metadata rather than merging it between layouts.
// Supply the brand, URL and share text together for every public page.
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt: string };
  type?: "website" | "article";
}): Metadata {
  const url = canonicalPageUrl(path, SITE_URL);
  const copy = seoPageCopy(new URL(url).pathname);
  if (copy) { title = copy.title; description = copy.description; }
  const images = image ? [image] : [{
    url: `${SITE_URL}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${SITE_BRAND} — скупка радиодеталей`,
  }];

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: "ru_RU",
      siteName: SITE_BRAND,
      title,
      description,
      url,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
