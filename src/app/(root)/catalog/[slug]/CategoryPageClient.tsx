"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Package, ArrowLeft } from "@/app/(root)/components/icons";
import { ProductCardCompact } from "../../components";
import { CategoryBanners } from "../../components/CategoryBanner";
import type { CategoryBannerConfig } from "@/lib/category-banner";
import { CategoryPurchaseGuide } from "../../components/CategoryPurchaseGuide";
import type { ProductWithPrice } from "@/app/actions";

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
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
    <div className="rk-category-page min-h-screen bg-[var(--gray-50)]">
      <section className="rk-category-hero">
        <div className="container mx-auto">
          <nav className="rk-category-breadcrumb" aria-label="Хлебные крошки">
            <Link href="/" className="hover:text-white whitespace-nowrap">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link href="/catalog" className="hover:text-white whitespace-nowrap">
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span aria-current="page">{category.name}</span>
          </nav>
          <div className="rk-category-hero-grid">
            <div className="rk-category-hero-copy">
              <h1>{category.name}</h1>
              <p>Скупка в Санкт-Петербурге. Позиций в каталоге: {total}</p>
              <Link href="/catalog" className="rk-category-back">
                <ArrowLeft className="w-4 h-4" /> Все категории
              </Link>
            </div>
            <div className={`rk-category-hero-art${category.imageUrl ? " rk-category-hero-photo" : ""}`}>
              <Image
                src={category.imageUrl || "/images/radioklad-real-parts-mobile-v2.png"}
                alt=""
                fill
                priority
                sizes="(max-width: 639px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="rk-category-list container mx-auto px-4 py-6">
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
          categoryTitleInHeading
        />

        <div className="rk-category-list-heading">
          <h2>Цены приёма</h2>
          <p>Выберите деталь, чтобы посмотреть описание или добавить её в опись.</p>
        </div>
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
          <div className="rk-product-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const isHighlighted =
                highlightSlug === product.slug && isHighlightVisible;
              return (
                <div
                  key={product.id}
                  ref={highlightSlug === product.slug ? highlightedRef : null}
                  className={`rk-product-grid-item transition-all duration-500 rounded-lg ${
                    isHighlighted
                      ? "ring-4 ring-yellow-400 ring-offset-2 animate-pulse-highlight"
                      : ""
                  }`}
                >
                  <ProductCardCompact
                    product={product}
                    categorySlug={product.categorySlug}
                  />
                </div>
              );
            })}
          </div>
        )}
        <CategoryPurchaseGuide name={category.name} slug={category.slug} hasGuide={category.infoPageEnabled} />
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
