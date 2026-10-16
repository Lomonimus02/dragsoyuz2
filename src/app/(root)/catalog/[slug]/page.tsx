export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts } from "@/app/actions";
import { ProductGridSkeleton } from "../../components";
import { CategoryPageClient } from "./CategoryPageClient";
import { bannerConfigFromCategory } from "@/lib/category-banner";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug);

  if (!result.success) {
    return {
      title: "Категория не найдена",
    };
  }

  const category = result.data;
  const canonicalUrl = `${BASE_URL}/catalog/${slug}`;

  return {
    title: { absolute: `Скупка ${category.name} в Санкт-Петербурге по высоким ценам | Покупаем в любом объеме, оплата сразу | ${SITE_BRAND}` },
    description: `Скупаем ${category.name} по высоким ценам в Санкт-Петербурге. Оценка по фото, скупаем в любом объеме, оплата сразу, честное взвешивание. Компания ${SITE_BRAND} в СПб.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Скупка ${category.name} в Санкт-Петербурге | ${SITE_BRAND}`,
      description: `Скупаем ${category.name} по высоким ценам. Оплата сразу, оценка по фото.`,
      type: "website",
      url: canonicalUrl,
    },
  };
}

// JSON-LD Schema.org BreadcrumbList
function BreadcrumbSchema({ categoryName, categorySlug }: { categoryName: string; categorySlug: string }) {
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  const categoryResult = await getCategoryBySlug(slug);
  
  if (!categoryResult.success) {
    notFound();
  }
  
  const category = categoryResult.data;
  
  const productsResult = await getProducts({
    categoryId: category.id,
    limit: 200, // Load more products for dense grid
  });
  
  if (!productsResult.success) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD BreadcrumbList */}
      <BreadcrumbSchema categoryName={category.name} categorySlug={category.slug} />
      
      <Suspense fallback={<ProductGridSkeleton count={24} />}>
        <CategoryPageClient
          category={{
            id: category.id,
            name: category.name,
            slug: category.slug,
            warningMessage: category.warningMessage,
            bannerText: category.bannerText,
            banner: bannerConfigFromCategory(category),
            infoPageEnabled: category.infoPageEnabled,
            infoPageButtonLabel: category.infoPageButtonLabel,
            infoPageButtonColor: category.infoPageButtonColor,
            infoPageButtonTextColor: category.infoPageButtonTextColor,
          }}
          products={productsResult.data}
          total={productsResult.total}
        />
      </Suspense>
    </>
  );
}
