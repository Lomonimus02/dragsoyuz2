export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Search, Package, ArrowLeft } from "lucide-react";
import { getProducts } from "@/app/actions";
import { ProductCard, ProductGridSkeleton } from "../components";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || "";

  return {
    title: query ? `Поиск: ${query}` : "Поиск радиодеталей",
    description: `Результаты поиска радиодеталей по запросу "${query}"`,
  };
}

// Search Results
async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--gray-700)] mb-2">
          Введите поисковый запрос
        </h2>
        <p className="text-[var(--gray-500)] mb-6">
          Введите название или маркировку детали в строку поиска
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const result = await getProducts({
    search: query,
    limit: 50,
  });

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--gray-500)]">
          Ошибка поиска: {result.error}
        </p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--gray-700)] mb-2">
          Ничего не найдено
        </h2>
        <p className="text-[var(--gray-500)] mb-6">
          По запросу &quot;{query}&quot; товары не найдены
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-lg font-medium transition-colors"
          >
            Открыть каталог
          </Link>
          <Link
            href="#contacts"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--gray-200)] hover:bg-[var(--gray-300)] text-[var(--gray-700)] rounded-lg font-medium transition-colors"
          >
            Связаться с нами
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[var(--gray-600)]">
          По запросу &quot;<span className="font-medium">{query}</span>&quot;
          найдено: <span className="font-semibold">{result.total}</span>{" "}
          {result.total === 1
            ? "товар"
            : result.total < 5
            ? "товара"
            : "товаров"}
        </p>
        <Link
          href="/catalog"
          className="text-[var(--primary-600)] hover:text-[var(--primary-700)] text-sm font-medium"
        >
          Весь каталог →
        </Link>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {result.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Page header */}
      <div className="bg-[var(--primary-900)] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-[var(--accent-400)]" />
            <h1 className="text-2xl md:text-3xl font-bold">Поиск</h1>
          </div>
          {query && (
            <p className="text-white/70">
              Результаты поиска по запросу: &quot;{query}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <SearchResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}
