import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import type { ProductWithPrice, ModificationWithPrice, UnitType } from "@/app/actions";
import { SellModal } from "./SellModal";
import type { SellModalContactInfo } from "./SellModal";
import { CalculatorModal } from "./CalculatorModal";
import { ProductMetalContent } from "./ProductMetalContent";

function getPriceUnitSuffix(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM":
      return "/г.";
    case "KG":
      return "/кг.";
    default:
      return "/шт.";
  }
}

function getUnitShort(unitType: UnitType): string {
  switch (unitType) {
    case "GRAM":
      return "1 г";
    case "KG":
      return "1 кг";
    default:
      return "1 шт";
  }
}

function formatDetailPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function PriceFootnote({
  isPriceOnRequest,
}: {
  isPriceOnRequest: boolean;
}) {
  return (
    <p className="text-xs text-[var(--gray-500)] mt-3 flex items-center gap-1.5">
      <Info className="w-3.5 h-3.5 shrink-0" />
      {isPriceOnRequest
        ? "Свяжитесь с нами для уточнения стоимости"
        : "Цены рассчитаны по актуальному курсу драгметаллов"}
    </p>
  );
}

function ModificationsDetailTable({
  modifications,
  isSingleType,
  isNewAvailable,
  isUsedAvailable,
  isPriceOnRequest,
  unitType,
  modLabel,
}: {
  modifications: ModificationWithPrice[];
  isSingleType: boolean;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  isPriceOnRequest: boolean;
  unitType: UnitType;
  modLabel?: string;
}) {
  const suffix = getPriceUnitSuffix(unitType);
  const showBothPrices = !isSingleType && isNewAvailable && isUsedAvailable;

  if (isPriceOnRequest) {
    return (
      <div>
        <p className="text-xl font-medium text-slate-500 italic">Цена по запросу</p>
        <PriceFootnote isPriceOnRequest={true} />
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-[var(--gray-200)] overflow-hidden">
        <div className="flex items-center bg-[var(--gray-100)] text-xs sm:text-sm font-bold text-[var(--gray-900)] border-b border-[var(--gray-200)]">
          <span className="flex-1 px-3 py-2.5">{modLabel || "Модификация"}</span>
          {showBothPrices ? (
            <>
              <span className="w-24 sm:w-28 text-right px-3 py-2.5">Новые</span>
              <span className="w-24 sm:w-28 text-right px-3 py-2.5">Б/У</span>
            </>
          ) : (
            <span className="w-28 sm:w-32 text-right px-3 py-2.5">
              {isSingleType ? "Цена" : isNewAvailable ? "Новые" : "Б/У"}
            </span>
          )}
        </div>
        {modifications.map((mod, idx) => {
          const price =
            isSingleType || isNewAvailable ? mod.priceNew : mod.priceUsed;
          const isLast = idx === modifications.length - 1;
          return (
            <div
              key={mod.id}
              className={`flex items-center bg-white ${!isLast ? "border-b border-[var(--gray-200)]" : ""}`}
            >
              <span className="flex-1 px-3 py-2.5 text-sm sm:text-base text-[var(--gray-800)] tabular-nums">
                {mod.name}
              </span>
              {showBothPrices ? (
                <>
                  <span className="w-24 sm:w-28 text-right px-3 py-2.5 text-sm sm:text-base font-bold text-[var(--gray-900)] whitespace-nowrap tabular-nums">
                    {formatDetailPrice(mod.priceNew)}{suffix}
                  </span>
                  <span className="w-24 sm:w-28 text-right px-3 py-2.5 text-sm sm:text-base font-bold text-[var(--gray-900)] whitespace-nowrap tabular-nums">
                    {formatDetailPrice(mod.priceUsed)}{suffix}
                  </span>
                </>
              ) : (
                <span className="w-28 sm:w-32 text-right px-3 py-2.5 text-sm sm:text-base font-bold text-[var(--gray-900)] whitespace-nowrap tabular-nums">
                  {formatDetailPrice(price)}{suffix}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <PriceFootnote isPriceOnRequest={false} />
    </div>
  );
}

function SimplePriceBlock({
  product,
}: {
  product: ProductWithPrice;
}) {
  if (product.isPriceOnRequest) {
    return (
      <div>
        <p className="text-xl font-medium text-slate-500 italic">Цена по запросу</p>
        <PriceFootnote isPriceOnRequest={true} />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {product.priceNew !== null && (
          <div className="flex items-center justify-between gap-4 bg-[var(--gray-50)] border border-[var(--gray-200)] px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-[var(--gray-700)]">
              {product.isSingleType ? "Цена" : "Новые"}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[var(--gray-900)] tabular-nums">
              {formatDetailPrice(product.priceNew)}
              {getPriceUnitSuffix(product.unitType)}
            </span>
          </div>
        )}
        {product.priceUsed !== null && !product.isSingleType && (
          <div className="flex items-center justify-between gap-4 bg-[var(--gray-50)] border border-[var(--gray-200)] px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-[var(--gray-700)]">Б/У</span>
            <span className="text-xl sm:text-2xl font-bold text-[var(--gray-900)] tabular-nums">
              {formatDetailPrice(product.priceUsed)}
              {getPriceUnitSuffix(product.unitType)}
            </span>
          </div>
        )}
        {product.priceNew === null && product.priceUsed === null && (
          <p className="text-base text-[var(--gray-500)] italic">Не принимается</p>
        )}
      </div>
      <PriceFootnote isPriceOnRequest={false} />
    </div>
  );
}

interface ProductDetailViewProps {
  product: ProductWithPrice;
  categoryName: string;
  categorySlug: string;
  sellContactInfo?: SellModalContactInfo;
}

export function ProductDetailView({
  product,
  categoryName,
  categorySlug,
  sellContactInfo,
}: ProductDetailViewProps) {
  const hasMetalContent =
    product.showDisplayContent &&
    (product.displayContentGold > 0 ||
      product.displayContentSilver > 0 ||
      product.displayContentPlatinum > 0 ||
      product.displayContentPalladium > 0 ||
      product.displayContentTantalum > 0);

  const hasPageDescription = !!product.pageDescription;

  const howToSellSteps = [
    "Соберите все детали данного типа",
    "Свяжитесь с нами по телефону или форме обратной связи",
    "Привезите детали",
    "Получите оплату сразу после оценки",
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <Link
        href={`/catalog/${categorySlug}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в «{categoryName}»
      </Link>

      {/* Hero: фото + ключевая информация */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-10 items-start">
        <div className="lg:sticky lg:top-24">
          <div className="relative aspect-square bg-white rounded-2xl border border-[var(--gray-200)] shadow-sm overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-6 sm:p-8"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--gray-100)] flex items-center justify-center">
                <span className="text-[var(--gray-400)] text-sm font-medium">
                  Загрузка фото
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Link
              href={`/catalog/${categorySlug}`}
              className="inline-flex items-center px-2.5 py-1 mb-3 text-xs font-medium text-[var(--primary-700)] bg-[var(--primary-50)] border border-[var(--primary-100)] rounded-md hover:bg-[var(--primary-100)] transition-colors"
            >
              {categoryName}
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--gray-900)] leading-tight">
              {product.seoH1 || product.name}
            </h1>
          </div>

          <section className="rounded-2xl border border-[var(--gray-200)] bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-sm font-medium text-[var(--gray-500)] mb-4">
              Цены скупки за {getUnitShort(product.unitType)}
            </p>

            {product.hasModifications && product.modifications.length > 0 ? (
              <ModificationsDetailTable
                modifications={product.modifications}
                isSingleType={product.isSingleType}
                isNewAvailable={product.isNewAvailable}
                isUsedAvailable={product.isUsedAvailable}
                isPriceOnRequest={product.isPriceOnRequest}
                unitType={product.unitType}
                modLabel={product.modLabel}
              />
            ) : (
              <SimplePriceBlock product={product} />
            )}
          </section>

          <div className="space-y-2">
            <CalculatorModal product={product} />
            <SellModal contactInfo={sellContactInfo} />
          </div>
        </div>
      </div>

      {/* Детали: описание → содержание → как сдать */}
      <div className="rounded-2xl border border-[var(--gray-200)] bg-white shadow-sm overflow-hidden">
        {hasPageDescription && (
          <section className="p-5 sm:p-6 border-b border-[var(--gray-100)]">
            <h2 className="text-base font-semibold text-[var(--gray-900)] mb-3">
              Описание
            </h2>
            <p className="text-[var(--gray-700)] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {product.pageDescription}
            </p>
          </section>
        )}

        {hasMetalContent && (
          <section
            className={`p-5 sm:p-6 ${hasPageDescription ? "border-b border-[var(--gray-100)]" : ""}`}
          >
            <ProductMetalContent
              variant="embedded"
              categoryName={categoryName}
              productName={product.name}
              contentGold={product.displayContentGold}
              contentSilver={product.displayContentSilver}
              contentPlatinum={product.displayContentPlatinum}
              contentPalladium={product.displayContentPalladium}
              contentTantalum={product.displayContentTantalum}
            />
          </section>
        )}

        <section className="p-5 sm:p-6 bg-[var(--gray-50)]">
          <h2 className="text-base font-semibold text-[var(--gray-900)] mb-3">
            Как сдать эту деталь?
          </h2>
          <ol className="text-sm text-[var(--gray-700)] space-y-2">
            {howToSellSteps.map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--primary-100)] text-[var(--primary-700)] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
