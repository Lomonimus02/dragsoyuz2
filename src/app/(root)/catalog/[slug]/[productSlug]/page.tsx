export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "@/app/(root)/components/icons";
import {
  getProductBySlug,
  getProducts,
  getCategoryBySlug,
  getGlobalSettings,
} from "@/app/actions";
import { ProductCard, ProductGridSkeleton } from "../../../components";
import { ProductDetailView } from "../../../components/ProductDetailView";
import { buildSellContactInfo, SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { catalogPurchaseCopy, productCatalogPath, productCatalogSchema } from "@/lib/catalog-content";
import type { ProductWithPrice } from "@/app/actions";

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const result = await getProductBySlug(productSlug);

  if (!result.success) {
    return {
      title: "Товар не найден",
    };
  }

  const product = result.data;
  const canonicalUrl = BASE_URL + productCatalogPath(product);
  const copyCategory = await getCategoryBySlug(product.categorySlug);
  const purchaseCopy = catalogPurchaseCopy(product, SITE_BRAND, copyCategory.success ? copyCategory.data.purchaseCopySettings : undefined);

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${BASE_URL}${product.image}`
    : undefined;

  return pageMetadata({
    title: purchaseCopy.title,
    description: purchaseCopy.metaDescription,
    path: canonicalUrl,
    image: imageUrl ? { url: imageUrl, alt: product.name } : undefined,
  });
}

function ProductSchema({ product, description }: { product: ProductWithPrice; description: string }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productCatalogSchema(product, BASE_URL, description)).replace(/</g, "\\u003c") }} />;
}

interface BreadcrumbSchemaProps {
  categoryName: string;
  categorySlug: string;
  productName: string;
  productSlug: string;
}

function BreadcrumbSchema({
  categoryName,
  categorySlug,
  productName,
  productSlug,
}: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: `${BASE_URL}/catalog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${BASE_URL}/catalog/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productName,
        item: `${BASE_URL}/catalog/${categorySlug}/${productSlug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function RelatedProducts({
  categoryId,
  currentId,
}: {
  categoryId: string;
  currentId: string;
}) {
  const result = await getProducts({ categoryId, limit: 5 });

  if (!result.success) {
    return null;
  }

  const relatedProducts = result.data.filter((p) => p.id !== currentId);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 lg:mt-14 pt-8 border-t border-[var(--gray-200)]">
      <h2 className="text-xl md:text-2xl font-bold text-[var(--gray-900)] mb-6">
        Похожие товары
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {relatedProducts.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categorySlug={product.categorySlug}
          />
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug: categorySlug, productSlug } = await params;

  const result = await getProductBySlug(productSlug);
  if (!result.success) notFound();
  const product = result.data;
  if (categorySlug !== product.categorySlug) {
    permanentRedirect(productCatalogPath(product));
  }
  const categoryResult = await getCategoryBySlug(product.categorySlug);
  if (!categoryResult.success) notFound();
  const category = categoryResult.data;
  const purchaseCopy = catalogPurchaseCopy(product, SITE_BRAND, category.purchaseCopySettings);

  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;
  const sellContactInfo = buildSellContactInfo(settings);

  return (
    <>
      <ProductSchema product={product} description={[purchaseCopy.schemaDescription, product.pageDescription].filter(Boolean).join("\n\n")} />
      <BreadcrumbSchema
        categoryName={category.name}
        categorySlug={categorySlug}
        productName={product.name}
        productSlug={productSlug}
      />

      <div className="min-h-screen bg-[var(--gray-50)]">
        <div className="bg-white border-b border-[var(--gray-200)]">
          <div className="container mx-auto px-4 py-3">
            <nav
              className="flex items-center gap-2 text-sm text-[var(--gray-500)] overflow-x-auto"
              aria-label="Хлебные крошки"
            >
              <Link
                href="/"
                className="hover:text-[var(--primary-600)] whitespace-nowrap"
              >
                Главная
              </Link>
              <ChevronRight className="w-4 h-4 shrink-0" />
              <Link
                href="/catalog"
                className="hover:text-[var(--primary-600)] whitespace-nowrap"
              >
                Каталог
              </Link>
              <ChevronRight className="w-4 h-4 shrink-0" />
              <Link
                href={`/catalog/${categorySlug}`}
                className="hover:text-[var(--primary-600)] whitespace-nowrap"
              >
                {category.name}
              </Link>
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span className="text-[var(--gray-900)] font-medium truncate max-w-[12rem] sm:max-w-none">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
          <ProductDetailView
            purchaseCopy={purchaseCopy}
            product={product}
            categoryName={category.name}
            categorySlug={categorySlug}
            sellContactInfo={sellContactInfo}
          />

          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <RelatedProducts
              categoryId={product.categoryId}
              currentId={product.id}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
