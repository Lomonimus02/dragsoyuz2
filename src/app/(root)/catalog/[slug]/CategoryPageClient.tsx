"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Package, ArrowLeft } from "lucide-react";
import { ProductCardCompact } from "../../components";
import { CategoryBanners } from "../../components/CategoryBanner";
import type { CategoryBannerConfig } from "@/lib/category-banner";
import type { ProductWithPrice } from "@/app/actions";

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
    warningMessage?: string | null;
    bannerText?: string | null;
    banner: CategoryBannerConfig;
    infoPageEnabled: boolean;
    infoPageButtonLabel: string | null;
    infoPageButtonColor: string | null;
    infoPageButtonTextColor: string | null;
  };
  products: ProductWithPrice[];
  total: number;
}

export function CategoryPageClient({
  category,
  products,
  total,
}: CategoryPageClientProps) {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get("highlight");
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [isHighlightVisible, setIsHighlightVisible] = useState(true);

  useEffect(() => {
    if (highlightSlug && highlightedRef.current) {
      const scrollTimer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      const fadeTimer = setTimeout(() => {
        setIsHighlightVisible(false);
      }, 5000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    }
  }, [highlightSlug]);

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="bg-[var(--primary-900)] text-white py-6 md:py-8">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <Link href="/" className="hover:text-white whitespace-nowrap">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link href="/catalog" className="hover:text-white whitespace-nowrap">
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-white font-medium">{category.name}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
          <p className="text-white/70 mt-1">Товаров в разделе: {total}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Все категории
        </Link>

        <CategoryBanners
          categoryName={category.name}
          categorySlug={category.slug}
          warningMessage={category.warningMessage}
          bannerTextLegacy={category.bannerText}
          banner={category.banner}
          infoPageEnabled={category.infoPageEnabled}
          infoPageButtonLabel={category.infoPageButtonLabel}
          infoPageButtonColor={category.infoPageButtonColor}
          infoPageButtonTextColor={category.infoPageButtonTextColor}
        />

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--gray-700)] mb-2">
              Товары не найдены
            </h3>
            <p className="text-[var(--gray-500)]">
              В данной категории пока нет товаров
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const isHighlighted =
                highlightSlug === product.slug && isHighlightVisible;
              return (
                <div
                  key={product.id}
                  ref={highlightSlug === product.slug ? highlightedRef : null}
                  className={`transition-all duration-500 rounded-lg ${
                    isHighlighted
                      ? "ring-4 ring-yellow-400 ring-offset-2 animate-pulse-highlight"
                      : ""
                  }`}
                >
                  <ProductCardCompact
                    product={product}
                    categorySlug={category.slug}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-highlight {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(250, 204, 21, 0.2);
          }
        }
        .animate-pulse-highlight {
          animation: pulse-highlight 1.5s ease-in-out 3;
        }
      `}</style>
    </div>
  );
}
