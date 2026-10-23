"use client";

import { useState } from "react";
import { CatalogImage as Image } from "./CatalogImage";
import Link from "next/link";
import { ZoomIn } from "@/app/(root)/components/icons";
import type { ProductWithPrice, ModificationWithPrice, UnitType } from "@/app/actions";
import { ImageModal } from "./ImageModal";
import { SellModal } from "./SellModal";
import { CalculatorModal } from "./CalculatorModal";
import type { SellModalContactInfo } from "./SellModal";

interface ProductCardCompactProps {
  product: ProductWithPrice;
  categorySlug: string;
  contactInfo?: SellModalContactInfo;
}

// Получить суффикс единицы измерения для цены
function getPriceUnitSuffix(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM": return "/г.";
    case "KG": return "/кг.";
    default: return "/шт.";
  }
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Компактная таблица модификаций для карточки в каталоге
function ModificationsTableCompact({
  modifications,
  modLabel,
  isSingleType,
  isNewAvailable,
  isUsedAvailable,
  unitType,
}: {
  modifications: ModificationWithPrice[];
  modLabel: string;
  isSingleType: boolean;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  unitType: UnitType;
}) {
  const suffix = getPriceUnitSuffix(unitType);
  const showBothPrices = !isSingleType && isNewAvailable && isUsedAvailable;

  return (
    <div className="rk-modifications" role="table" aria-label={`Цены по ${modLabel.toLowerCase()}`}>
      {/* Заголовок */}
      <div className="rk-modification-row rk-modification-head" role="row">
        <span role="columnheader">{modLabel}</span>
        {showBothPrices ? (
          <>
            <span role="columnheader">Новые</span>
            <span role="columnheader">Б/У</span>
          </>
        ) : (
          <span role="columnheader">Цена</span>
        )}
      </div>
      {/* Строки */}
      {modifications.map((mod) => {
        const singlePrice = isSingleType || isNewAvailable ? mod.priceNew : mod.priceUsed;
        return (
          <div key={mod.id} className="rk-modification-row" role="row">
            <span className="rk-modification-name" role="cell">
              {mod.name}
            </span>
            {showBothPrices ? (
              <>
                <span className="rk-modification-price" role="cell">
                  <strong>{formatPrice(mod.priceNew).replace(/\s*₽$/, "")}</strong><small>₽{suffix}</small>
                </span>
                <span className="rk-modification-price" role="cell">
                  <strong>{formatPrice(mod.priceUsed).replace(/\s*₽$/, "")}</strong><small>₽{suffix}</small>
                </span>
              </>
            ) : (
              <span className="rk-modification-price" role="cell">
                <strong>{formatPrice(singlePrice).replace(/\s*₽$/, "")}</strong><small>₽{suffix}</small>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProductCardCompact({ product, categorySlug, contactInfo }: ProductCardCompactProps) {
  const hasNewPrice = product.priceNew !== null;
  const hasUsedPrice = product.priceUsed !== null;
  
  // Стейт для модального окна с изображением
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const productUrl = `/catalog/${categorySlug}/${product.slug}`;

  return (
    <>
      {/* Модальное окно для просмотра изображения */}
      {product.image && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={product.image}
          alt={product.name}
        />
      )}
      
      <div className="rk-product-card group bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image - клик открывает модалку */}
        <button
          type="button"
          disabled={!product.image}
          onClick={() => product.image && setIsImageModalOpen(true)}
          className="rk-product-media relative w-full aspect-[3/2] md:aspect-square bg-[var(--gray-100)] overflow-hidden cursor-zoom-in disabled:cursor-default shadow-sm"
          aria-label={product.image ? `Увеличить изображение ${product.name}` : `Фото ${product.name} пока нет`}
        >
          {product.image ? (
            <>
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
              />
              {/* Иконка зума */}
              <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Фото пока нет</span>
            </div>
          )}
        </button>

        {/* Content */}
        <div className="rk-product-content p-2 md:p-4">
          {/* Name - клик ведет на страницу товара */}
          <Link href={productUrl}>
            <h3 className="text-base font-medium text-[var(--gray-900)] hover:text-[var(--primary-600)] transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          {product.description && (
            <p className="rk-product-description text-[15px] leading-snug text-[var(--gray-800)] font-medium mb-5">
              {product.description}
            </p>
          )}

        {/* Prices */}
        <div>
          {/* Цена по запросу */}
          {product.isPriceOnRequest ? (
            <div className="flex items-center justify-center px-2 py-2.5 rounded-md bg-slate-100">
              <span className="text-sm font-medium text-slate-500 italic">
                Цена по запросу
              </span>
            </div>
          ) : product.hasModifications && product.modifications.length > 0 ? (
            /* Товар с модификациями — компактная таблица */
            <ModificationsTableCompact
              modifications={product.modifications}
              modLabel={product.modLabel}
              isSingleType={product.isSingleType}
              isNewAvailable={product.isNewAvailable}
              isUsedAvailable={product.isUsedAvailable}
              unitType={product.unitType}
            />
          ) : (
            /* Обычный товар */
            <div className="space-y-1">
              {hasNewPrice && (
                <div className="rk-price-row flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--gray-900)]">
                    {product.isSingleType ? 'Цена' : 'Новые'}
                  </span>
                  <span className="text-sm font-bold text-[var(--gray-900)]">
                    {formatPrice(product.priceNew!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}
              {hasUsedPrice && !product.isSingleType && (
                <div className="rk-price-row flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--gray-900)]">Б/У</span>
                  <span className="text-sm font-bold text-[var(--gray-900)]">
                    {formatPrice(product.priceUsed!)}{getPriceUnitSuffix(product.unitType)}
                  </span>
                </div>
              )}
              {!hasNewPrice && !hasUsedPrice && (
                <p className="text-xs text-[var(--gray-400)] italic">
                  Не принимается
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rk-product-actions mt-3 space-y-2">
          <CalculatorModal product={product} />
          <SellModal contactInfo={contactInfo} />
        </div>
      </div>
    </div>
    </>
  );
}
