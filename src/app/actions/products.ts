"use server";

import { prisma } from "@/lib/prisma";
import { calculateProductPrices, calculateModificationPrices } from "@/lib/price-calculator";
import { applyHundredPrice } from "@/lib/hundred-price";
import type { ModificationPrices } from "@/lib/price-calculator";
import { revalidatePath } from "next/cache";
import Fuse from "fuse.js";

// ============================================================================
// ТИПЫ
// ============================================================================

/**
 * Фильтры для получения списка товаров
 */
export interface ProductFilters {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Единица измерения товара
 */
export type UnitType = "PIECE" | "GRAM" | "KG";

/**
 * Ручной флаг учёта золота в описи (AUTO = логика по категории)
 */
export type InventoryMetalsMode = "AUTO" | "INCLUDE" | "EXCLUDE";

/**
 * Модификация товара с рассчитанными ценами
 */
export interface ModificationWithPrice {
  id: string;
  name: string;
  contentAu: number;
  contentAg: number;
  contentPt: number;
  contentPd: number;
  contentTa: number;
  contentAuUsed: number;
  contentAgUsed: number;
  contentPtUsed: number;
  contentPdUsed: number;
  contentTaUsed: number;
  priceNew: number;
  priceUsed: number;
}

/**
 * Входные данные для модификации (создание/обновление)
 */
export interface ModificationInput {
  name: string;
  contentAu?: number;
  contentAg?: number;
  contentPt?: number;
  contentPd?: number;
  contentTa?: number;
  contentAuUsed?: number;
  contentAgUsed?: number;
  contentPtUsed?: number;
  contentPdUsed?: number;
  contentTaUsed?: number;
}

/**
 * Товар с рассчитанными ценами для API
 */
export interface ProductWithPrice {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pageDescription: string | null;
  image: string | null;
  seoH1: string | null;
  seoDescription: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  sortOrder: number;
  // Единица измерения (PIECE = шт, GRAM = г, KG = кг)
  unitType: UnitType;
  // Наценка на товар (коэффициент) для НОВОГО
  priceMarkup: number;
  // Наценка для Б/У товаров
  priceMarkupUsed: number;
  // Тип товара: true = одна цена (без разделения Новое/Б/У)
  isSingleType: boolean;
  // Цена по запросу
  isPriceOnRequest: boolean;
  // Лицо категории на Главной
  isShowcaseFace: boolean;
  // Учёт Au в описи (не влияет на цену)
  inventoryMetalsMode: InventoryMetalsMode;
  // Модификации
  hasModifications: boolean;
  modLabel: string;
  modifications: ModificationWithPrice[];
  // Содержание металлов для НОВЫХ
  contentGold: number;
  contentSilver: number;
  contentPlatinum: number;
  contentPalladium: number;
  contentTantalum: number;
  // Содержание металлов для Б/У
  contentGoldUsed: number;
  contentSilverUsed: number;
  contentPlatinumUsed: number;
  contentPalladiumUsed: number;
  contentTantalumUsed: number;
  // Содержание для отображения на странице товара (не влияет на цену)
  displayContentGold: number;
  displayContentSilver: number;
  displayContentPlatinum: number;
  displayContentPalladium: number;
  displayContentTantalum: number;
  displayContentCustomized: boolean;
  showDisplayContent: boolean;
  // Настройки доступности по состоянию
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  // Ручные цены
  manualPriceNew: number | null;
  manualPriceUsed: number | null;
  // Рассчитанные актуальные цены
  priceNew: number | null; // null если isNewAvailable = false
  priceUsed: number | null; // null если isUsedAvailable = false или isSingleType = true
  // Название совпавшей модификации (заполняется только при поиске)
  matchedModificationName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Входные данные для создания товара
 */
export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string | null;
  pageDescription?: string | null;
  image?: string | null;
  seoH1?: string | null;
  seoDescription?: string | null;
  categoryId: string;
  sortOrder?: number;
  // Единица измерения
  unitType?: UnitType;
  // Наценка и тип товара
  priceMarkup?: number;
  priceMarkupUsed?: number;
  isSingleType?: boolean;
  isPriceOnRequest?: boolean;
  isShowcaseFace?: boolean;
  inventoryMetalsMode?: InventoryMetalsMode;
  // Модификации
  hasModifications?: boolean;
  modLabel?: string;
  modifications?: ModificationInput[];
  // Содержание металлов для НОВЫХ
  contentGold?: number;
  contentSilver?: number;
  contentPlatinum?: number;
  contentPalladium?: number;
  contentTantalum?: number;
  // Содержание металлов для Б/У
  contentGoldUsed?: number;
  contentSilverUsed?: number;
  contentPlatinumUsed?: number;
  contentPalladiumUsed?: number;
  contentTantalumUsed?: number;
  // Содержание для отображения на странице
  displayContentGold?: number;
  displayContentSilver?: number;
  displayContentPlatinum?: number;
  displayContentPalladium?: number;
  displayContentTantalum?: number;
  displayContentCustomized?: boolean;
  showDisplayContent?: boolean;
  isNewAvailable?: boolean;
  isUsedAvailable?: boolean;
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}

/**
 * Входные данные для обновления товара
 */
export interface UpdateProductInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  pageDescription?: string | null;
  image?: string | null;
  seoH1?: string | null;
  seoDescription?: string | null;
  categoryId?: string;
  sortOrder?: number;
  // Единица измерения
  unitType?: UnitType;
  // Наценка и тип товара
  priceMarkup?: number;
  priceMarkupUsed?: number;
  isSingleType?: boolean;
  isPriceOnRequest?: boolean;
  isShowcaseFace?: boolean;
  inventoryMetalsMode?: InventoryMetalsMode;
  // Модификации
  hasModifications?: boolean;
  modLabel?: string;
  modifications?: ModificationInput[];
  // Содержание металлов для НОВЫХ
  contentGold?: number;
  contentSilver?: number;
  contentPlatinum?: number;
  contentPalladium?: number;
  contentTantalum?: number;
  // Содержание металлов для Б/У
  contentGoldUsed?: number;
  contentSilverUsed?: number;
  contentPlatinumUsed?: number;
  contentPalladiumUsed?: number;
  contentTantalumUsed?: number;
  // Содержание для отображения на странице
  displayContentGold?: number;
  displayContentSilver?: number;
  displayContentPlatinum?: number;
  displayContentPalladium?: number;
  displayContentTantalum?: number;
  displayContentCustomized?: boolean;
  showDisplayContent?: boolean;
  isNewAvailable?: boolean;
  isUsedAvailable?: boolean;
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}

/**
 * Результат операции со списком товаров
 */
export type ProductsResult =
  | { success: true; data: ProductWithPrice[]; total: number }
  | { success: false; error: string };

/**
 * Результат операции с одним товаром
 */
export type ProductResult =
  | { success: true; data: ProductWithPrice }
  | { success: false; error: string };

/**
 * Результат операции удаления
 */
export type DeleteResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================================
// ВНУТРЕННИЕ ТИПЫ
// ============================================================================

/** Товар из БД с включённой категорией */
interface DbProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pageDescription: string | null;
  image: string | null;
  categoryId: string;
  category: {
    name: string;
    slug: string;
    sortOrder: number; // Для сортировки по категории
    // Кастомные курсы категории
    customRateAu: number | null;
    customRateAg: number | null;
    customRatePt: number | null;
    customRatePd: number | null;
    customRateTa: number | null;
  };
  sortOrder: number;
  // Единица измерения
  unitType: UnitType;
  // Наценка и тип товара
  priceMarkup: number;
  priceMarkupUsed: number;
  isSingleType: boolean;
  isPriceOnRequest: boolean;
  isShowcaseFace: boolean;
  inventoryMetalsMode: InventoryMetalsMode;
  // Модификации
  hasModifications: boolean;
  modLabel?: string;
  modifications: {
    id: string;
    name: string;
    contentAu: number;
    contentAg: number;
    contentPt: number;
    contentPd: number;
    contentTa: number;
    contentAuUsed: number;
    contentAgUsed: number;
    contentPtUsed: number;
    contentPdUsed: number;
    contentTaUsed: number;
  }[];
  // Содержание металлов для НОВЫХ
  contentGold: unknown; // Prisma Decimal
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  contentTantalum: unknown;
  // Содержание металлов для Б/У
  contentGoldUsed: unknown;
  contentSilverUsed: unknown;
  contentPlatinumUsed: unknown;
  contentPalladiumUsed: unknown;
  contentTantalumUsed: unknown;
  displayContentGold: unknown;
  displayContentSilver: unknown;
  displayContentPlatinum: unknown;
  displayContentPalladium: unknown;
  displayContentTantalum: unknown;
  displayContentCustomized: boolean;
  showDisplayContent: boolean;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  manualPriceNew: unknown | null;
  manualPriceUsed: unknown | null;
  seoH1: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Курсы для расчёта цены */
interface RatesForCalculation {
  gold: unknown;
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
  tantalum?: unknown;
}

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

/**
 * Конвертирует Decimal-подобное значение в number
 */
function toNumber(value: unknown): number {
  return Number(value);
}

/**
 * Конвертирует Decimal-подобное значение в number или null
 */
function toNumberOrNull(value: unknown): number | null {
  return value !== null && value !== undefined ? Number(value) : null;
}

function normalizeMetalInput(value: number | null | undefined): number {
  return value == null || Number.isNaN(value) ? 0 : value;
}

function hasAnyMetalContent(
  gold: number,
  silver: number,
  platinum: number,
  palladium: number,
  tantalum: number = 0,
): boolean {
  return gold > 0 || silver > 0 || platinum > 0 || palladium > 0 || tantalum > 0;
}

function hasFixedManualPrice(input: {
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}): boolean {
  const priceNew = input.manualPriceNew;
  const priceUsed = input.manualPriceUsed;
  return (
    (priceNew != null && !Number.isNaN(priceNew) && priceNew > 0) ||
    (priceUsed != null && !Number.isNaN(priceUsed) && priceUsed > 0)
  );
}

/**
 * Содержание для отображения на сайте.
 * Если не кастомизировано и в БД пусто — подставляем расчётное (для цен).
 */
function resolveDisplayMetalContent(product: {
  contentGold: unknown;
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  contentTantalum: unknown;
  displayContentGold: unknown;
  displayContentSilver: unknown;
  displayContentPlatinum: unknown;
  displayContentPalladium: unknown;
  displayContentTantalum: unknown;
  displayContentCustomized: boolean;
  manualPriceNew: unknown | null;
  manualPriceUsed: unknown | null;
}) {
  const pricing = {
    gold: toNumber(product.contentGold),
    silver: toNumber(product.contentSilver),
    platinum: toNumber(product.contentPlatinum),
    palladium: toNumber(product.contentPalladium),
    tantalum: toNumber(product.contentTantalum),
  };
  const stored = {
    gold: toNumber(product.displayContentGold),
    silver: toNumber(product.displayContentSilver),
    platinum: toNumber(product.displayContentPlatinum),
    palladium: toNumber(product.displayContentPalladium),
    tantalum: toNumber(product.displayContentTantalum),
  };

  if (product.displayContentCustomized) {
    return stored;
  }

  if (hasAnyMetalContent(stored.gold, stored.silver, stored.platinum, stored.palladium, stored.tantalum)) {
    return stored;
  }

  // Фиксированная цена: расчётное содержание может быть пустым — не затираем отображение
  if (
    hasFixedManualPrice({
      manualPriceNew: toNumberOrNull(product.manualPriceNew),
      manualPriceUsed: toNumberOrNull(product.manualPriceUsed),
    })
  ) {
    return stored;
  }

  return pricing;
}

/** При сохранении: если не кастомизировано — копируем расчётное в отображаемое */
function buildDisplayContentForSave(input: {
  contentGold?: number;
  contentSilver?: number;
  contentPlatinum?: number;
  contentPalladium?: number;
  contentTantalum?: number;
  displayContentGold?: number;
  displayContentSilver?: number;
  displayContentPlatinum?: number;
  displayContentPalladium?: number;
  displayContentTantalum?: number;
  displayContentCustomized?: boolean;
  manualPriceNew?: number | null;
  manualPriceUsed?: number | null;
}) {
  const display = {
    gold: normalizeMetalInput(input.displayContentGold),
    silver: normalizeMetalInput(input.displayContentSilver),
    platinum: normalizeMetalInput(input.displayContentPlatinum),
    palladium: normalizeMetalInput(input.displayContentPalladium),
    tantalum: normalizeMetalInput(input.displayContentTantalum),
  };
  const pricing = {
    gold: normalizeMetalInput(input.contentGold),
    silver: normalizeMetalInput(input.contentSilver),
    platinum: normalizeMetalInput(input.contentPlatinum),
    palladium: normalizeMetalInput(input.contentPalladium),
    tantalum: normalizeMetalInput(input.contentTantalum),
  };

  if (input.displayContentCustomized) {
    return {
      displayContentGold: display.gold,
      displayContentSilver: display.silver,
      displayContentPlatinum: display.platinum,
      displayContentPalladium: display.palladium,
      displayContentTantalum: display.tantalum,
      displayContentCustomized: true as const,
    };
  }

  const fixedPrice = hasFixedManualPrice(input);
  const pricingHasContent = hasAnyMetalContent(
    pricing.gold,
    pricing.silver,
    pricing.platinum,
    pricing.palladium,
    pricing.tantalum,
  );
  const displayHasContent = hasAnyMetalContent(
    display.gold,
    display.silver,
    display.platinum,
    display.palladium,
    display.tantalum,
  );

  // Фиксированная цена без расчётного содержания — сохраняем только отображаемое
  if (fixedPrice && !pricingHasContent) {
    return {
      displayContentGold: display.gold,
      displayContentSilver: display.silver,
      displayContentPlatinum: display.platinum,
      displayContentPalladium: display.palladium,
      displayContentTantalum: display.tantalum,
      displayContentCustomized: displayHasContent,
    };
  }

  return {
    displayContentGold: pricing.gold,
    displayContentSilver: pricing.silver,
    displayContentPlatinum: pricing.platinum,
    displayContentPalladium: pricing.palladium,
    displayContentTantalum: pricing.tantalum,
    displayContentCustomized: false as const,
  };
}

/**
 * Преобразует товар из БД в формат API с рассчитанными ценами
 */
function serializeProduct(
  product: DbProductWithCategory,
  rates: RatesForCalculation,
  globalPriceMarkup: number,
  matchedModificationName?: string | null,
): ProductWithPrice {
  // Наценка товара умножается на глобальную наценку (внутри priceMarkup товара)
  const effectiveMarkup = product.priceMarkup * globalPriceMarkup;
  const effectiveMarkupUsed = product.priceMarkupUsed * globalPriceMarkup;
  
  // Получаем кастомные курсы категории
  const categoryRates = {
    customRateAu: product.category.customRateAu,
    customRateAg: product.category.customRateAg,
    customRatePt: product.category.customRatePt,
    customRatePd: product.category.customRatePd,
    customRateTa: product.category.customRateTa,
  };
  
  const priceHint = {
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    productSlug: product.slug,
    productName: product.name,
    unitType: product.unitType,
  };

  const { priceNew, priceUsed } = calculateProductPrices(
    {
      contentGold: product.contentGold,
      contentSilver: product.contentSilver,
      contentPlatinum: product.contentPlatinum,
      contentPalladium: product.contentPalladium,
      contentTantalum: product.contentTantalum,
      contentGoldUsed: product.contentGoldUsed,
      contentSilverUsed: product.contentSilverUsed,
      contentPlatinumUsed: product.contentPlatinumUsed,
      contentPalladiumUsed: product.contentPalladiumUsed,
      contentTantalumUsed: product.contentTantalumUsed,
      isNewAvailable: product.isNewAvailable,
      isUsedAvailable: product.isUsedAvailable,
      manualPriceNew: product.manualPriceNew,
      manualPriceUsed: product.manualPriceUsed,
      priceMarkup: effectiveMarkup, // Используем эффективную наценку
      priceMarkupUsed: effectiveMarkupUsed, // Наценка для Б/У
      isSingleType: product.isSingleType,
    },
    rates,
    categoryRates // Передаём кастомные курсы категории
  );

  // Рассчитываем цены модификаций
  const modificationsWithPrices: ModificationWithPrice[] = (product.modifications ?? []).map((mod) => {
    const modPrices: ModificationPrices = calculateModificationPrices(
      {
        contentAu: mod.contentAu,
        contentAg: mod.contentAg,
        contentPt: mod.contentPt,
        contentPd: mod.contentPd,
        contentTa: mod.contentTa,
        contentAuUsed: mod.contentAuUsed,
        contentAgUsed: mod.contentAgUsed,
        contentPtUsed: mod.contentPtUsed,
        contentPdUsed: mod.contentPdUsed,
        contentTaUsed: mod.contentTaUsed,
      },
      rates,
      categoryRates,
      effectiveMarkup,
      effectiveMarkupUsed,
    );
    return {
      id: mod.id,
      name: mod.name,
      contentAu: mod.contentAu,
      contentAg: mod.contentAg,
      contentPt: mod.contentPt,
      contentPd: mod.contentPd,
      contentTa: mod.contentTa,
      contentAuUsed: mod.contentAuUsed,
      contentAgUsed: mod.contentAgUsed,
      contentPtUsed: mod.contentPtUsed,
      contentPdUsed: mod.contentPdUsed,
      contentTaUsed: mod.contentTaUsed,
      priceNew: applyHundredPrice(modPrices.priceNew, priceHint) ?? modPrices.priceNew,
      priceUsed: applyHundredPrice(modPrices.priceUsed, priceHint) ?? modPrices.priceUsed,
    };
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    pageDescription: product.pageDescription ?? null,
    image: product.image,
    seoH1: product.seoH1 ?? null,
    seoDescription: product.seoDescription ?? null,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    sortOrder: product.sortOrder,
    unitType: product.unitType,
    priceMarkup: product.priceMarkup,
    priceMarkupUsed: product.priceMarkupUsed,
    isSingleType: product.isSingleType,
    isPriceOnRequest: product.isPriceOnRequest,
    isShowcaseFace: product.isShowcaseFace,
    inventoryMetalsMode: product.inventoryMetalsMode ?? "AUTO",
    hasModifications: product.hasModifications,
    modLabel: product.modLabel ?? "Модификация",
    modifications: modificationsWithPrices,
    contentGold: toNumber(product.contentGold),
    contentSilver: toNumber(product.contentSilver),
    contentPlatinum: toNumber(product.contentPlatinum),
    contentPalladium: toNumber(product.contentPalladium),
    contentTantalum: toNumber(product.contentTantalum),
    contentGoldUsed: toNumber(product.contentGoldUsed),
    contentSilverUsed: toNumber(product.contentSilverUsed),
    contentPlatinumUsed: toNumber(product.contentPlatinumUsed),
    contentPalladiumUsed: toNumber(product.contentPalladiumUsed),
    contentTantalumUsed: toNumber(product.contentTantalumUsed),
    ...(() => {
      const display = resolveDisplayMetalContent(product);
      return {
        displayContentGold: display.gold,
        displayContentSilver: display.silver,
        displayContentPlatinum: display.platinum,
        displayContentPalladium: display.palladium,
        displayContentTantalum: display.tantalum,
      };
    })(),
    displayContentCustomized: product.displayContentCustomized,
    showDisplayContent: product.showDisplayContent,
    isNewAvailable: product.isNewAvailable,
    isUsedAvailable: product.isUsedAvailable,
    manualPriceNew: toNumberOrNull(product.manualPriceNew),
    manualPriceUsed: toNumberOrNull(product.manualPriceUsed),
    priceNew: applyHundredPrice(priceNew, priceHint),
    priceUsed: product.isSingleType ? null : applyHundredPrice(priceUsed, priceHint), // Для единого типа Б/У цена не нужна
    matchedModificationName: matchedModificationName ?? null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/** Дефолтные курсы металлов */
const DEFAULT_RATES: RatesForCalculation = {
  gold: 6500,
  silver: 85,
  platinum: 3200,
  palladium: 3800,
  tantalum: 0,
};

/** Дефолтный коэффициент наценки */
const DEFAULT_MARKUP = 1.0;

/**
 * Получить текущие курсы или дефолтные
 */
async function getCurrentRates(): Promise<RatesForCalculation> {
  const rates = await prisma.metalRate.findUnique({
    where: { id: "current" },
  });

  if (!rates) {
    // Возвращаем дефолтные курсы, если запись не найдена
    return DEFAULT_RATES;
  }

  return rates;
}

/**
 * Получить текущий коэффициент наценки
 */
async function getPriceMarkup(): Promise<number> {
  const settings = await prisma.globalSettings.findUnique({
    where: { id: "global" },
  });
  return settings?.priceMarkup ?? DEFAULT_MARKUP;
}

/**
 * Пересчитать sortOrder для всех товаров в категории после изменения позиции одного товара
 * @param categoryId - ID категории
 * @param movedProductId - ID перемещённого товара
 * @param newPosition - новая позиция (1-based)
 */
async function reorderProductsInCategory(
  categoryId: string,
  movedProductId: string,
  newPosition: number
): Promise<void> {
  // Получаем все товары категории, отсортированные по sortOrder
  const products = await prisma.product.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  // Удаляем перемещаемый товар из списка
  const otherProducts = products.filter(p => p.id !== movedProductId);
  
  // Вставляем его на новую позицию
  const movedProduct = products.find(p => p.id === movedProductId);
  if (!movedProduct) return;

  // Корректируем позицию в допустимых границах
  const clampedPosition = Math.max(1, Math.min(newPosition, products.length));
  
  // Вставляем на нужную позицию
  otherProducts.splice(clampedPosition - 1, 0, movedProduct);

  // Обновляем sortOrder для всех
  const updates = otherProducts.map((product, index) => 
    prisma.product.update({
      where: { id: product.id },
      data: { sortOrder: index + 1 },
    })
  );

  await Promise.all(updates);
}

/**
 * Сбросить isShowcaseFace у всех товаров корневой категории (и подкатегорий),
 * кроме указанного товара. Витрина на главной работает по корневым категориям,
 * поэтому "лицо" должно быть только одно на всю корневую категорию.
 */
async function resetShowcaseFaceInRootCategory(
  categoryId: string,
  excludeProductId: string
): Promise<void> {
  // Определяем корневую категорию
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, parentId: true },
  });
  if (!category) return;

  const rootCategoryId = category.parentId ?? category.id;

  // Собираем ID всех категорий внутри корневой (сама корневая + подкатегории)
  const subcategories = await prisma.category.findMany({
    where: { parentId: rootCategoryId },
    select: { id: true },
  });
  const allCategoryIds = [rootCategoryId, ...subcategories.map(c => c.id)];

  // Сбрасываем флаг у всех товаров этих категорий, кроме текущего
  await prisma.product.updateMany({
    where: {
      categoryId: { in: allCategoryIds },
      id: { not: excludeProductId },
      isShowcaseFace: true,
    },
    data: { isShowcaseFace: false },
  });
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Получить имя текущего товара-образца витрины для корневой категории.
 * Возвращает null, если образец не назначен.
 */
export async function getShowcaseFaceForCategory(
  categoryId: string
): Promise<{ productName: string; productId: string } | null> {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true },
    });
    if (!category) return null;

    const rootCategoryId = category.parentId ?? category.id;

    const subcategories = await prisma.category.findMany({
      where: { parentId: rootCategoryId },
      select: { id: true },
    });
    const allCategoryIds = [rootCategoryId, ...subcategories.map(c => c.id)];

    const showcaseProduct = await prisma.product.findFirst({
      where: {
        categoryId: { in: allCategoryIds },
        isShowcaseFace: true,
      },
      select: { id: true, name: true },
    });

    return showcaseProduct
      ? { productName: showcaseProduct.name, productId: showcaseProduct.id }
      : null;
  } catch {
    return null;
  }
}

/**
 * Получить список товаров с рассчитанными ценами
 */
/**
 * Нормализует строку для поиска: убирает лишние пробелы, приводит к нижнему регистру
 */
function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Заменяем множественные пробелы на один
    .trim();
}

/**
 * Создаёт «склеенную» строку: только буквы (вкл. кириллицу) и цифры, нижний регистр.
 * Убирает пробелы, дефисы, точки, запятые и любые спецсимволы.
 * "КМ-6б 04.07" → "км6б0407"
 */
function stripToAlphanumeric(str: string): string {
  return str.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '').toLowerCase();
}

export async function getProducts(
  filters?: ProductFilters
): Promise<ProductsResult> {
  try {
    const { categoryId, search, limit = 50, offset = 0 } = filters ?? {};

    // Формируем условия фильтрации
    const where: {
      categoryId?: string | { in: string[] };
    } = {};

    // Флаг: включены ли подкатегории
    let includesSubcategories = false;
    // childSortOrder родительской категории (для сортировки)
    let parentCategoryChildSortOrder = 0;

    if (categoryId) {
      // Получаем родительскую категорию с childSortOrder
      const parentCategory = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parentCategoryChildSortOrder = (parentCategory as any)?.childSortOrder ?? 0;

      // Находим все подкатегории данной категории
      const subcategories = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      
      // Если есть подкатегории, включаем товары из них тоже
      if (subcategories.length > 0) {
        const categoryIds = [categoryId, ...subcategories.map(c => c.id)];
        where.categoryId = { in: categoryIds };
        includesSubcategories = true;
      } else {
        where.categoryId = categoryId;
      }
    }

    // ========================================================================
    // УМНЫЙ ПОИСК С FUSE.JS
    // ========================================================================
    if (search && search.trim()) {
      const normalizedSearch = normalizeSearchQuery(search);
      const normalizedQuery = stripToAlphanumeric(search);
      
      // Получаем ВСЕ товары для fuzzy-поиска (с учётом фильтра по категории)
      const [allProducts, rates, priceMarkup] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: {
                name: true,
                slug: true,
                sortOrder: true,
                customRateAu: true,
                customRateAg: true,
                customRatePt: true,
                customRatePd: true,
                customRateTa: true,
              },
            },
            modifications: true,
          },
          orderBy: { sortOrder: "asc" },
        }),
        getCurrentRates(),
        getPriceMarkup(),
      ]);

      // Подготавливаем данные для Fuse.js с нормализованными полями
      const productsForSearch = allProducts.map((product) => ({
        ...product,
        // Объединяем Название + Slug (маркировка) без пробелов/спецсимволов
        normalizedSearchString: stripToAlphanumeric(
          product.name +
            ' ' +
            product.slug +
            (product.description ? ' ' + product.description : '') +
            (product.pageDescription ? ' ' + product.pageDescription : '')
        ),
        nameNormalized: stripToAlphanumeric(product.name),
        slugNormalized: stripToAlphanumeric(product.slug),
        descriptionNormalized: stripToAlphanumeric(
          [product.description, product.pageDescription].filter(Boolean).join(' ')
        ),
      }));

      // Настройка Fuse.js
      const fuse = new Fuse(productsForSearch, {
        keys: [
          { name: 'name', weight: 2 },                    // Оригинальное название
          { name: 'nameNormalized', weight: 2 },          // Склеенное название
          { name: 'normalizedSearchString', weight: 1.8 }, // Название+Slug+Описание склеенные
          { name: 'slug', weight: 1.5 },                  // Оригинальный слаг
          { name: 'slugNormalized', weight: 1.5 },        // Склеенный слаг
          { name: 'description', weight: 1 },             // Описание
          { name: 'descriptionNormalized', weight: 1 },   // Склеенное описание
          { name: 'modifications.name', weight: 1.5 },    // Названия модификаций (Deep Search)
        ],
        threshold: 0.3,          // Допуск для опечаток (0 = точное, 1 = любое)
        distance: 100,           // Максимальная дистанция для нечёткого совпадения
        ignoreLocation: true,    // Искать совпадение в любом месте строки
        minMatchCharLength: 2,   // Минимум 2 символа для совпадения
        includeScore: true,      // Включить оценку релевантности
        includeMatches: true,    // Включить информацию о совпадениях
        findAllMatches: true,    // Найти все совпадения в строке
        useExtendedSearch: true, // Расширенный поиск
      });

      // Комбинированный поиск: оригинальный запрос + нормализованный (без спецсимволов)
      const results1 = fuse.search(normalizedSearch);
      const results2 = normalizedQuery !== normalizedSearch
        ? fuse.search(normalizedQuery)
        : [];
      
      // Объединяем результаты и убираем дубликаты
      const seenIds = new Set<string>();
      const combinedResults: typeof results1 = [];
      
      for (const result of [...results1, ...results2]) {
        if (!seenIds.has(result.item.id)) {
          seenIds.add(result.item.id);
          combinedResults.push(result);
        }
      }
      
      // Сортируем по релевантности (меньший score = лучше)
      combinedResults.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
      
      const total = combinedResults.length;
      
      // Применяем пагинацию
      const paginatedResults = combinedResults.slice(offset, offset + limit);
      
      // Преобразуем товары с рассчитанными ценами
      const productsWithPrices = paginatedResults.map(({ item, matches }) => {
        // Убираем временные нормализованные поля
        const { nameNormalized, slugNormalized, descriptionNormalized, normalizedSearchString, ...product } = item;
        // Извлекаем название совпавшей модификации (если совпадение по modifications.name)
        const modMatch = matches?.find((m) => m.key === 'modifications.name');
        const matchedModName = modMatch ? String(modMatch.value ?? '') : null;
        return serializeProduct(product as DbProductWithCategory, rates, priceMarkup, matchedModName);
      });

      return {
        success: true,
        data: productsWithPrices,
        total,
      };
    }

    // ========================================================================
    // ОБЫЧНАЯ ВЫБОРКА БЕЗ ПОИСКА
    // ========================================================================

    // Получаем товары, курсы и наценку параллельно
    const [products, rates, priceMarkup, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              sortOrder: true, // Включаем sortOrder категории для сортировки
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
                customRateTa: true,
            },
          },
          modifications: true,
        },
        orderBy: { sortOrder: "asc" },
        // Если включены подкатегории, загружаем больше для клиентской сортировки
        // (Prisma не поддерживает orderBy по полям связанной модели напрямую)
        take: includesSubcategories ? undefined : limit,
        skip: includesSubcategories ? undefined : offset,
      }),
      getCurrentRates(),
      getPriceMarkup(),
      prisma.product.count({ where }),
    ]);

    // Если включены подкатегории — сортируем:
    // - Для товаров родительской категории используем childSortOrder родителя
    // - Для товаров подкатегорий используем sortOrder подкатегории
    let sortedProducts = products;
    if (includesSubcategories && categoryId) {
      sortedProducts = [...products].sort((a, b) => {
        // Определяем "эффективный sortOrder" для товара:
        // - Если товар из родительской категории -> используем childSortOrder родителя
        // - Если товар из подкатегории -> используем sortOrder подкатегории
        const isFromParentA = a.categoryId === categoryId;
        const isFromParentB = b.categoryId === categoryId;
        
        const effectiveOrderA = isFromParentA 
          ? parentCategoryChildSortOrder 
          : (a.category as { sortOrder: number }).sortOrder ?? 0;
        const effectiveOrderB = isFromParentB 
          ? parentCategoryChildSortOrder 
          : (b.category as { sortOrder: number }).sortOrder ?? 0;
        
        if (effectiveOrderA !== effectiveOrderB) {
          return effectiveOrderA - effectiveOrderB;
        }
        // При равных позициях категорий — сортируем по sortOrder товара
        return a.sortOrder - b.sortOrder;
      });
      // Применяем пагинацию после сортировки
      sortedProducts = sortedProducts.slice(offset, offset + limit);
    }

    // Преобразуем товары с рассчитанными ценами
    const productsWithPrices = sortedProducts.map((product: DbProductWithCategory) =>
      serializeProduct(product, rates, priceMarkup)
    );

    return {
      success: true,
      data: productsWithPrices,
      total,
    };
  } catch (error) {
    console.error("Ошибка при получении товаров:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить один товар по ID
 */
export async function getProductById(id: string): Promise<ProductResult> {
  try {
    const [product, rates, priceMarkup] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              sortOrder: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
                customRateTa: true,
            },
          },
          modifications: true,
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    if (!product) {
      return {
        success: false,
        error: "Товар не найден",
      };
    }

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить товар по slug
 */
export async function getProductBySlug(slug: string): Promise<ProductResult> {
  try {
    const [product, rates, priceMarkup] = await Promise.all([
      prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              sortOrder: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
                customRateTa: true,
            },
          },
          modifications: true,
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    if (!product) {
      return {
        success: false,
        error: "Товар не найден",
      };
    }

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Создать новый товар
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ProductResult> {
  try {
    console.log("=== createProduct input ===", JSON.stringify(input, null, 2));
    // Валидация обязательных полей
    if (!input.name?.trim()) {
      return { success: false, error: "Название товара обязательно" };
    }

    if (!input.slug?.trim()) {
      return { success: false, error: "Slug товара обязателен" };
    }

    if (!input.categoryId) {
      return { success: false, error: "Категория обязательна" };
    }

    // Проверяем уникальность slug
    const existingProduct = await prisma.product.findUnique({
      where: { slug: input.slug },
    });

    if (existingProduct) {
      return { success: false, error: "Товар с таким slug уже существует" };
    }

    // Проверяем существование категории
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      return { success: false, error: "Категория не найдена" };
    }

    // Автоматическое определение sortOrder если не указан или равен 0
    let sortOrder = input.sortOrder;
    if (!sortOrder || sortOrder <= 0) {
      // Находим максимальный sortOrder среди товаров ЭТОЙ ЖЕ категории
      const maxSortOrderResult = await prisma.product.aggregate({
        where: { categoryId: input.categoryId },
        _max: { sortOrder: true },
      });
      // Новый товар получает sortOrder = max + 1 (или 1 если товаров в категории нет)
      sortOrder = (maxSortOrderResult._max.sortOrder ?? 0) + 1;
    }

    // Создаём товар
    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description ?? null,
        pageDescription: input.pageDescription ?? null,
        image: input.image ?? null,
        seoH1: input.seoH1 ?? null,
        seoDescription: input.seoDescription ?? null,
        categoryId: input.categoryId,
        sortOrder,
        // Единица измерения
        unitType: input.unitType ?? "PIECE",
        // Наценка и тип товара
        priceMarkup: input.priceMarkup ?? 1.0,
        priceMarkupUsed: input.priceMarkupUsed ?? 1.0,
        isSingleType: input.isSingleType ?? false,
        isPriceOnRequest: input.isPriceOnRequest ?? false,
        isShowcaseFace: input.isShowcaseFace ?? false,
        inventoryMetalsMode: input.inventoryMetalsMode ?? "AUTO",
        hasModifications: input.hasModifications ?? false,
        modLabel: input.modLabel ?? "Модификация",
        // Модификации — создаём вложенно если переданы
        ...(input.modifications?.length ? {
          modifications: {
            createMany: {
              data: input.modifications.map((m) => ({
                name: m.name,
                contentAu: m.contentAu ?? 0,
                contentAg: m.contentAg ?? 0,
                contentPt: m.contentPt ?? 0,
                contentPd: m.contentPd ?? 0,
                contentTa: m.contentTa ?? 0,
                contentAuUsed: m.contentAuUsed ?? 0,
                contentAgUsed: m.contentAgUsed ?? 0,
                contentPtUsed: m.contentPtUsed ?? 0,
                contentPdUsed: m.contentPdUsed ?? 0,
                contentTaUsed: m.contentTaUsed ?? 0,
              })),
            },
          },
        } : {}),
        // Содержание металлов для НОВЫХ (обрабатываем null и NaN как 0)
        contentGold: (input.contentGold == null || Number.isNaN(input.contentGold)) ? 0 : input.contentGold,
        contentSilver: (input.contentSilver == null || Number.isNaN(input.contentSilver)) ? 0 : input.contentSilver,
        contentPlatinum: (input.contentPlatinum == null || Number.isNaN(input.contentPlatinum)) ? 0 : input.contentPlatinum,
        contentPalladium: (input.contentPalladium == null || Number.isNaN(input.contentPalladium)) ? 0 : input.contentPalladium,
        contentTantalum: (input.contentTantalum == null || Number.isNaN(input.contentTantalum)) ? 0 : input.contentTantalum,
        // Содержание металлов для Б/У (обрабатываем null и NaN как 0)
        contentGoldUsed: (input.contentGoldUsed == null || Number.isNaN(input.contentGoldUsed)) ? 0 : input.contentGoldUsed,
        contentSilverUsed: (input.contentSilverUsed == null || Number.isNaN(input.contentSilverUsed)) ? 0 : input.contentSilverUsed,
        contentPlatinumUsed: (input.contentPlatinumUsed == null || Number.isNaN(input.contentPlatinumUsed)) ? 0 : input.contentPlatinumUsed,
        contentPalladiumUsed: (input.contentPalladiumUsed == null || Number.isNaN(input.contentPalladiumUsed)) ? 0 : input.contentPalladiumUsed,
        contentTantalumUsed: (input.contentTantalumUsed == null || Number.isNaN(input.contentTantalumUsed)) ? 0 : input.contentTantalumUsed,
        ...buildDisplayContentForSave(input),
        showDisplayContent: input.showDisplayContent ?? true,
        isNewAvailable: input.isNewAvailable ?? true,
        isUsedAvailable: input.isUsedAvailable ?? true,
        manualPriceNew: input.manualPriceNew ?? null,
        manualPriceUsed: input.manualPriceUsed ?? null,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            sortOrder: true,
            customRateAu: true,
            customRateAg: true,
            customRatePt: true,
            customRatePd: true,
                customRateTa: true,
          },
        },
        modifications: true,
      },
    });

    // Если этот товар — лицо категории, сбрасываем флаг у остальных
    if (product.isShowcaseFace) {
      await resetShowcaseFaceInRootCategory(product.categoryId, product.id);
    }

    const [rates, priceMarkup] = await Promise.all([
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    // Инвалидируем кеш всего сайта
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: serializeProduct(product, rates, priceMarkup),
    };
  } catch (error) {
    console.error("Ошибка при создании товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить товар
 */
export async function updateProduct(
  input: UpdateProductInput
): Promise<ProductResult> {
  try {
    console.log("=== updateProduct input ===", JSON.stringify(input, null, 2));
    if (!input.id) {
      return { success: false, error: "ID товара обязателен" };
    }

    // Проверяем существование товара
    const existingProduct = await prisma.product.findUnique({
      where: { id: input.id },
    });

    if (!existingProduct) {
      return { success: false, error: "Товар не найден" };
    }

    // Если меняется slug — проверяем уникальность
    if (input.slug && input.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: input.slug },
      });

      if (slugExists) {
        return { success: false, error: "Товар с таким slug уже существует" };
      }
    }

    // Если меняется категория — проверяем её существование
    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        return { success: false, error: "Категория не найдена" };
      }
    }

    // Формируем данные для обновления
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.pageDescription !== undefined) updateData.pageDescription = input.pageDescription;
    if (input.image !== undefined) updateData.image = input.image;
    if (input.seoH1 !== undefined) updateData.seoH1 = input.seoH1 ?? null;
    if (input.seoDescription !== undefined) updateData.seoDescription = input.seoDescription ?? null;
    if (input.categoryId !== undefined) updateData.category = { connect: { id: input.categoryId } };
    // Единица измерения
    if (input.unitType !== undefined) updateData.unitType = input.unitType;
    // Наценка и тип товара
    if (input.priceMarkup !== undefined) updateData.priceMarkup = input.priceMarkup;
    if (input.priceMarkupUsed !== undefined) updateData.priceMarkupUsed = input.priceMarkupUsed;
    if (input.isSingleType !== undefined) updateData.isSingleType = input.isSingleType;
    if (input.isPriceOnRequest !== undefined) updateData.isPriceOnRequest = input.isPriceOnRequest;
    if (input.isShowcaseFace !== undefined) updateData.isShowcaseFace = input.isShowcaseFace;
    if (input.inventoryMetalsMode !== undefined) {
      updateData.inventoryMetalsMode = input.inventoryMetalsMode;
    }
    if (input.hasModifications !== undefined) updateData.hasModifications = input.hasModifications;
    if (input.modLabel !== undefined) updateData.modLabel = input.modLabel;
    // sortOrder обрабатывается отдельно через reorder
    // НОВЫЕ - обрабатываем null и NaN как 0
    if (input.contentGold !== undefined) updateData.contentGold = (input.contentGold == null || Number.isNaN(input.contentGold)) ? 0 : input.contentGold;
    if (input.contentSilver !== undefined) updateData.contentSilver = (input.contentSilver == null || Number.isNaN(input.contentSilver)) ? 0 : input.contentSilver;
    if (input.contentPlatinum !== undefined) updateData.contentPlatinum = (input.contentPlatinum == null || Number.isNaN(input.contentPlatinum)) ? 0 : input.contentPlatinum;
    if (input.contentPalladium !== undefined) updateData.contentPalladium = (input.contentPalladium == null || Number.isNaN(input.contentPalladium)) ? 0 : input.contentPalladium;
    if (input.contentTantalum !== undefined) updateData.contentTantalum = (input.contentTantalum == null || Number.isNaN(input.contentTantalum)) ? 0 : input.contentTantalum;
    // Б/У - обрабатываем null и NaN как 0
    if (input.contentGoldUsed !== undefined) updateData.contentGoldUsed = (input.contentGoldUsed == null || Number.isNaN(input.contentGoldUsed)) ? 0 : input.contentGoldUsed;
    if (input.contentSilverUsed !== undefined) updateData.contentSilverUsed = (input.contentSilverUsed == null || Number.isNaN(input.contentSilverUsed)) ? 0 : input.contentSilverUsed;
    if (input.contentPlatinumUsed !== undefined) updateData.contentPlatinumUsed = (input.contentPlatinumUsed == null || Number.isNaN(input.contentPlatinumUsed)) ? 0 : input.contentPlatinumUsed;
    if (input.contentPalladiumUsed !== undefined) updateData.contentPalladiumUsed = (input.contentPalladiumUsed == null || Number.isNaN(input.contentPalladiumUsed)) ? 0 : input.contentPalladiumUsed;
    if (input.contentTantalumUsed !== undefined) updateData.contentTantalumUsed = (input.contentTantalumUsed == null || Number.isNaN(input.contentTantalumUsed)) ? 0 : input.contentTantalumUsed;

    if (input.showDisplayContent !== undefined) updateData.showDisplayContent = input.showDisplayContent;

    const shouldSyncDisplay =
      input.displayContentCustomized !== undefined ||
      input.displayContentGold !== undefined ||
      input.displayContentSilver !== undefined ||
      input.displayContentPlatinum !== undefined ||
      input.displayContentPalladium !== undefined ||
      input.contentGold !== undefined ||
      input.contentSilver !== undefined ||
      input.contentPlatinum !== undefined ||
      input.contentPalladium !== undefined ||
      input.contentTantalum !== undefined ||
      input.displayContentTantalum !== undefined;

    if (shouldSyncDisplay) {
      Object.assign(
        updateData,
        buildDisplayContentForSave({
          contentGold:
            input.contentGold !== undefined
              ? normalizeMetalInput(input.contentGold)
              : toNumber(existingProduct.contentGold),
          contentSilver:
            input.contentSilver !== undefined
              ? normalizeMetalInput(input.contentSilver)
              : toNumber(existingProduct.contentSilver),
          contentPlatinum:
            input.contentPlatinum !== undefined
              ? normalizeMetalInput(input.contentPlatinum)
              : toNumber(existingProduct.contentPlatinum),
          contentPalladium:
            input.contentPalladium !== undefined
              ? normalizeMetalInput(input.contentPalladium)
              : toNumber(existingProduct.contentPalladium),
          contentTantalum:
            input.contentTantalum !== undefined
              ? normalizeMetalInput(input.contentTantalum)
              : toNumber(existingProduct.contentTantalum),
          displayContentGold:
            input.displayContentGold !== undefined
              ? input.displayContentGold
              : toNumber(existingProduct.displayContentGold),
          displayContentSilver:
            input.displayContentSilver !== undefined
              ? input.displayContentSilver
              : toNumber(existingProduct.displayContentSilver),
          displayContentPlatinum:
            input.displayContentPlatinum !== undefined
              ? input.displayContentPlatinum
              : toNumber(existingProduct.displayContentPlatinum),
          displayContentPalladium:
            input.displayContentPalladium !== undefined
              ? input.displayContentPalladium
              : toNumber(existingProduct.displayContentPalladium),
          displayContentTantalum:
            input.displayContentTantalum !== undefined
              ? input.displayContentTantalum
              : toNumber(existingProduct.displayContentTantalum),
          displayContentCustomized:
            input.displayContentCustomized ?? existingProduct.displayContentCustomized,
          manualPriceNew:
            input.manualPriceNew !== undefined
              ? input.manualPriceNew
              : toNumberOrNull(existingProduct.manualPriceNew),
          manualPriceUsed:
            input.manualPriceUsed !== undefined
              ? input.manualPriceUsed
              : toNumberOrNull(existingProduct.manualPriceUsed),
        }),
      );
    }

    if (input.isNewAvailable !== undefined) updateData.isNewAvailable = input.isNewAvailable;
    if (input.isUsedAvailable !== undefined) updateData.isUsedAvailable = input.isUsedAvailable;
    if (input.manualPriceNew !== undefined) updateData.manualPriceNew = input.manualPriceNew;
    if (input.manualPriceUsed !== undefined) updateData.manualPriceUsed = input.manualPriceUsed;

    // Если переданы модификации — удаляем старые и создаём новые (deleteMany -> createMany)
    if (input.modifications !== undefined) {
      await prisma.productModification.deleteMany({
        where: { productId: input.id },
      });
    }

    // Обновляем товар
    const product = await prisma.product.update({
      where: { id: input.id },
      data: {
        ...updateData,
        // Создаём новые модификации если переданы
        ...(input.modifications?.length ? {
          modifications: {
            createMany: {
              data: input.modifications.map((m) => ({
                name: m.name,
                contentAu: m.contentAu ?? 0,
                contentAg: m.contentAg ?? 0,
                contentPt: m.contentPt ?? 0,
                contentPd: m.contentPd ?? 0,
                contentTa: m.contentTa ?? 0,
                contentAuUsed: m.contentAuUsed ?? 0,
                contentAgUsed: m.contentAgUsed ?? 0,
                contentPtUsed: m.contentPtUsed ?? 0,
                contentPdUsed: m.contentPdUsed ?? 0,
                contentTaUsed: m.contentTaUsed ?? 0,
              })),
            },
          },
        } : {}),
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
            sortOrder: true,
            customRateAu: true,
            customRateAg: true,
            customRatePt: true,
            customRatePd: true,
                customRateTa: true,
          },
        },
        modifications: true,
      },
    });

    // Если изменился sortOrder — пересчитываем порядок всех товаров в категории
    if (input.sortOrder !== undefined && input.sortOrder !== existingProduct.sortOrder) {
      const categoryId = input.categoryId ?? existingProduct.categoryId;
      await reorderProductsInCategory(categoryId, input.id, input.sortOrder);
    }

    // Если этот товар стал лицом категории — сбрасываем флаг у остальных
    if (input.isShowcaseFace === true) {
      await resetShowcaseFaceInRootCategory(product.categoryId, product.id);
    }

    const [rates, priceMarkup] = await Promise.all([
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    const serialized = serializeProduct(product, rates, priceMarkup);
    console.log("=== updateProduct result ===", JSON.stringify({ isSingleType: serialized.isSingleType, priceNew: serialized.priceNew, priceUsed: serialized.priceUsed }, null, 2));

    // Инвалидируем кеш всего сайта
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Удалить товар
 */
export async function deleteProduct(id: string): Promise<DeleteResult> {
  try {
    if (!id) {
      return { success: false, error: "ID товара обязателен" };
    }

    // Проверяем существование товара
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return { success: false, error: "Товар не найден" };
    }

    // Удаляем товар
    await prisma.product.delete({
      where: { id },
    });

    // Инвалидируем кеш всего сайта
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить товары по списку ID (для корзины)
 * Возвращает актуальные цены на момент запроса
 */
export async function getProductsByIds(ids: string[]): Promise<ProductsResult> {
  try {
    if (!ids.length) {
      return { success: true, data: [], total: 0 };
    }

    const [products, rates, priceMarkup] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
              sortOrder: true,
              customRateAu: true,
              customRateAg: true,
              customRatePt: true,
              customRatePd: true,
                customRateTa: true,
            },
          },
          modifications: true,
        },
      }),
      getCurrentRates(),
      getPriceMarkup(),
    ]);

    const productsWithPrices = products.map((product: DbProductWithCategory) =>
      serializeProduct(product, rates, priceMarkup)
    );

    return {
      success: true,
      data: productsWithPrices,
      total: productsWithPrices.length,
    };
  } catch (error) {
    console.error("Ошибка при получении товаров по ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить все slug товаров (для sitemap)
 */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const products = await prisma.product.findMany({
      select: { slug: true },
    });
    return products.map((p: { slug: string }) => p.slug);
  } catch (error) {
    console.error("Ошибка при получении slug товаров:", error);
    return [];
  }
}

/**
 * Результат поиска товара для редиректа
 */
export type SearchRedirectResult =
  | { success: true; categorySlug: string; productSlug: string }
  | { success: false; error: string };

/**
 * Найти наиболее подходящий товар по поисковому запросу
 * Возвращает slug категории и slug товара для редиректа
 */
export async function findBestMatchProduct(query: string): Promise<SearchRedirectResult> {
  try {
    if (!query.trim()) {
      return { success: false, error: "Пустой поисковый запрос" };
    }

    const searchQuery = query.trim();

    // Сначала ищем точное совпадение по slug
    const exactMatch = await prisma.product.findFirst({
      where: {
        slug: { equals: searchQuery, mode: "insensitive" },
      },
      include: {
        category: { select: { slug: true } },
      },
    });

    if (exactMatch) {
      return {
        success: true,
        categorySlug: exactMatch.category.slug,
        productSlug: exactMatch.slug,
      };
    }

    // Затем ищем частичное совпадение (приоритет slug, потом name)
    const partialMatch = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: { contains: searchQuery, mode: "insensitive" } },
          { name: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      include: {
        category: { select: { slug: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (partialMatch) {
      return {
        success: true,
        categorySlug: partialMatch.category.slug,
        productSlug: partialMatch.slug,
      };
    }

    return { success: false, error: "Товар не найден" };
  } catch (error) {
    console.error("Ошибка при поиске товара:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}
