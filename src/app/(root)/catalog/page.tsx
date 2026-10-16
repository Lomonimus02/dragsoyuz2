import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight } from "lucide-react";
import { ProductGridSkeleton } from "../components";
import { prisma } from "@/lib/prisma";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Каталог скупаемых в Санкт-Петербурге радиодеталей с ценами и фото | ${SITE_BRAND}` },
  description:
    "Полный каталог радиодеталей с актуальными ценами скупки. Транзисторы, конденсаторы, микросхемы, реле и другие детали. Покупаем дорого, в любых объемах. Оплата сразу.",
  alternates: {
    canonical: `${BASE_URL}/catalog`,
  },
};

// Categories List
async function CategoriesList() {
  // Получаем корневые категории с фото витрины (isShowcaseFace товар)
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        select: { _count: { select: { products: true } } },
      },
      // Ищем товар-лицо категории для фото
      products: {
        where: { isShowcaseFace: true, image: { not: null } },
        select: { image: true },
        take: 1,
      },
    },
  });

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
      {categories.map((category) => {
        const showcaseImage = category.products[0]?.image ?? null;
        // Приоритет: собственная картинка категории > витринный товар > заглушка
        const displayImage = category.imageUrl || showcaseImage;
        const childrenProducts = category.children?.reduce(
          (sum, child) => sum + child._count.products, 0
        ) ?? 0;
        const totalProducts = category._count.products + childrenProducts;

        return (
          <Link
            key={category.id}
            href={`/catalog/${category.slug}`}
            className="group flex items-center bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg hover:translate-x-1 transition-all duration-300 overflow-hidden"
          >
            {/* Квадратное фото слева */}
            <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-[var(--gray-100)] overflow-hidden shadow-sm">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={category.name}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-[var(--gray-300)]" />
                </div>
              )}
            </div>

            {/* Название категории */}
            <div className="flex-1 min-w-0 px-4">
              <h3 className="font-semibold text-lg md:text-xl text-[var(--gray-900)] group-hover:text-[var(--primary-600)] transition-colors">
                {category.name}
              </h3>
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
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Page header */}
      <div className="bg-[var(--primary-900)] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Каталог радиодеталей
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
