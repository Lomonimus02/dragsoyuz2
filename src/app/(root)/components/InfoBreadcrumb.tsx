import Link from "next/link";
import { ChevronRight } from "./icons";
import { SITE_URL } from "@/lib/site";
import { canonicalPageUrl } from "@/lib/seo-routing";

export function InfoBreadcrumb({ current, path }: { current: string; path?: string }) {
  const schema = path ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: canonicalPageUrl("/", SITE_URL) },
      { "@type": "ListItem", position: 2, name: current, item: canonicalPageUrl(path, SITE_URL) },
    ],
  } : null;

  return (
    <>
      {schema && (
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      )}
      <nav aria-label="Хлебные крошки" className="rk-info-breadcrumb">
        <Link href="/">Главная</Link>
        <ChevronRight className="w-3 h-3" />
        <span aria-current="page">{current}</span>
      </nav>
    </>
  );
}
