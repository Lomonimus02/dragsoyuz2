import { seoPageCopy } from "@/lib/seo-content";
import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { CatalogImage as Image } from "../components/CatalogImage";
import { Package, ChevronRight } from "@/app/(root)/components/icons";
import { ProductGridSkeleton } from "../components";
import { categoryCoverImages, usableCatalogImage } from "@/lib/category-cover";
import { prisma } from "@/lib/prisma";
import { SITE_BRAND } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Каталог радиодеталей — цены скупки в СПб | ${SITE_BRAND}`,
  description:
    "Полный каталог радиодеталей с актуальными ценами скупки. Транзисторы, конденсаторы, микросхемы, реле и другие детали. Покупаем дорого, в любых объемах. Оплата сразу.",
  path: "/catalog",
});

// Categories List
async function CategoriesList() {
  // Корневые категории. Фото — отдельным узким запросом: id, категория, url, флаг и порядок.
  // Полные карточки товаров сюда не грузятся.
  const [categories, nodes, products] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { products: true } },
        children: {
          select: { _count: { select: { products: true } } },
        },
      },
    }),
    prisma.category.findMany({
      select: { id: true, parentId: true },
    }),
    prisma.product.findMany({
      where: {
        AND: [{ NOT: { image: null } }, { NOT: { image: "" } }],
      },
      select: {
        id: true,
        categoryId: true,
        image: true,
        isShowcaseFace: true,
        sortOrder: true,
      },
    }),
  ]);
  const covers = categoryCoverImages(
    categories.map((category) => category.id),
    nodes,
    products,
  );

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--gray-700)] mb-2">
          Категории не найдены
        </h3>
        <p className="text-[var(--gray-500)]">
          Категории еще не добавлены
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {categories.map((category, index) => {
        // Своё фото категории, иначе товар «на главную», иначе любое фото из дерева категории.
        const displayImage = usableCatalogImage(category.imageUrl) ?? covers.get(category.id) ?? null;
        const childrenProducts = category.children?.reduce(
          (sum, child) => sum + child._count.products, 0
        ) ?? 0;
        const totalProducts = category._count.products + childrenProducts;

        return (
          <Link
            key={category.id}
            href={`/catalog/${category.slug}`}
            className="rk-category-card group flex items-center bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg hover:translate-x-1 transition-all duration-300 overflow-hidden"
          >
            {/* Фото категории на правой части фона карточки */}
            <div className="rk-category-image w-24 h-24 md:w-28 md:h-28 shrink-0 bg-[var(--gray-100)] overflow-hidden shadow-sm">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1023px) 45vw, 25vw"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-[var(--gray-300)]" />
                </div>
              )}
            </div>

            {/* Название категории */}
            <div className="rk-category-copy flex-1 min-w-0 px-4">
              <span className="rk-category-number">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-semibold text-lg md:text-xl text-[var(--gray-900)] group-hover:text-[var(--primary-600)] transition-colors">
                {category.name}
              </h3>
              <p className="rk-category-count">Позиций в каталоге: {totalProducts}</p>
            </div>

            {/* Стрелка справа */}
            <div className="pr-4 shrink-0">
              <ChevronRight className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--primary-600)] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default async function CatalogPage() {
  return (
    <div className="rk-catalog min-h-screen bg-[var(--gray-50)]">
      {/* Page header */}
      <div className="rk-page-heading bg-[var(--primary-900)] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {seoPageCopy("/catalog")?.h1}
          </h1>
          <p className="text-white/70 mt-2">
            Актуальные цены скупки на основе курса драгоценных металлов
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-6">
          Выберите категорию
        </h2>
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <CategoriesList />
        </Suspense>
      </div>
    </div>
  );
}
