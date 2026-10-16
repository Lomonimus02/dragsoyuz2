/**
 * Price Calculator — расчёт цен на товары по содержанию драгоценных металлов
 * 
 * Система единиц измерения:
 * - Золото (Au), Платина (Pl), Палладий (Pd) — в миллиграммах (мг), курсы за 1 мг
 * - Серебро (Ag), Тантал (Ta) — в граммах (г), курс за 1 г
 * - Формула: Price = Content * Rate (универсальная, единицы должны совпадать)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Глобальные курсы металлов (из таблицы MetalRate)
 * - Au, Pt, Pd — цена за 1 мг
 * - Ag, Ta — цена за 1 г
 */
export interface MetalRates {
  gold: unknown;      // Prisma Decimal | number
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
  tantalum?: unknown;
}

/**
 * Кастомные курсы категории
 * Если курс задан (не null) — используется вместо глобального
 */
export interface CategoryCustomRates {
  customRateAu?: number | null;
  customRateAg?: number | null;
  customRatePt?: number | null;
  customRatePd?: number | null;
  customRateTa?: number | null;
}

/**
 * Содержание металлов в товаре
 * - Au, Pt, Pd — в мг
 * - Ag, Ta — в г
 */
export interface MetalContent {
  // Содержание для НОВЫХ товаров (мг)
  contentGold: unknown;
  contentSilver: unknown;
  contentPlatinum: unknown;
  contentPalladium: unknown;
  contentTantalum?: unknown;
  
  // Содержание для Б/У товаров (мг)
  contentGoldUsed: unknown;
  contentSilverUsed: unknown;
  contentPlatinumUsed: unknown;
  contentPalladiumUsed: unknown;
  contentTantalumUsed?: unknown;
  
  // Флаги доступности
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  
  // Ручные цены (перебивают расчётные)
  manualPriceNew?: unknown | null;
  manualPriceUsed?: unknown | null;
  
  // Наценка товара для НОВОГО (коэффициент: 0.9 = -10%, 1.0 = без наценки, 1.15 = +15%)
  priceMarkup?: number;
  // Наценка товара для Б/У
  priceMarkupUsed?: number;
  
  // Тип товара: true = одна цена (без разделения Новое/Б/У)
  isSingleType?: boolean;
}

/**
 * Содержание металлов в модификации товара
 */
export interface ModificationContent {
  contentAu: number;
  contentAg: number;
  contentPt: number;
  contentPd: number;
  contentTa?: number;
  contentAuUsed: number;
  contentAgUsed: number;
  contentPtUsed: number;
  contentPdUsed: number;
  contentTaUsed?: number;
}

/**
 * Результат расчёта цены модификации
 */
export interface ModificationPrices {
  priceNew: number;
  priceUsed: number;
}

/**
 * Результат расчёта цены товара
 */
export interface ProductPrices {
  priceNew: number | null;   // null если isNewAvailable = false
  priceUsed: number | null;  // Для isSingleType = true: равен priceNew
  isSingleType: boolean;
}

/**
 * Разрешённые курсы металлов (после применения кастомных курсов категории)
 * - Au, Pt, Pd — цена за 1 мг
 * - Ag, Ta — цена за 1 г
 */
export interface ResolvedRates {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  tantalum: number;
}

// ============================================================================
// RATE RESOLUTION
// ============================================================================

/**
 * Определяет итоговые курсы металлов для расчёта
 * 
 * Приоритет:
 * 1. Кастомный курс категории (customRateXx)
 * 2. Глобальный курс из MetalRate
 * 
 * @param globalRates - Глобальные курсы металлов
 * @param categoryRates - Кастомные курсы категории (опционально)
 * @returns Итоговые курсы для расчёта (цена за 1 мг)
 */
export function resolveRates(
  globalRates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): ResolvedRates {
  return {
    gold: categoryRates?.customRateAu ?? Number(globalRates.gold),
    silver: categoryRates?.customRateAg ?? Number(globalRates.silver),
    platinum: categoryRates?.customRatePt ?? Number(globalRates.platinum),
    palladium: categoryRates?.customRatePd ?? Number(globalRates.palladium),
    tantalum: categoryRates?.customRateTa ?? Number(globalRates.tantalum ?? 0),
  };
}

// ============================================================================
// PRICE CALCULATION
// ============================================================================

/**
 * Рассчитывает базовую стоимость по содержанию металлов
 * 
 * Формула: Price = (Content_Au * Rate_Au) + (Content_Ag * Rate_Ag) + 
 *                  (Content_Pt * Rate_Pt) + (Content_Pd * Rate_Pd) +
 *                  (Content_Ta * Rate_Ta)
 * 
 * @param contentAu - Содержание золота (мг)
 * @param contentAg - Содержание серебра (г)
 * @param contentPt - Содержание платины (мг)
 * @param contentPd - Содержание палладия (мг)
 * @param rates - Разрешённые курсы (Au/Pt/Pd — за 1 мг, Ag/Ta — за 1 г)
 * @param contentTa - Содержание тантала (г)
 * @returns Базовая стоимость в рублях
 */
export function calculateBasePrice(
  contentAu: unknown,
  contentAg: unknown,
  contentPt: unknown,
  contentPd: unknown,
  rates: ResolvedRates,
  contentTa: unknown = 0,
): number {
  const au = Number(contentAu) || 0;
  const ag = Number(contentAg) || 0;
  const pt = Number(contentPt) || 0;
  const pd = Number(contentPd) || 0;
  const ta = Number(contentTa) || 0;

  // Формула: Content * Rate (универсальная)
  const price =
    au * rates.gold +
    ag * rates.silver +
    pt * rates.platinum +
    pd * rates.palladium +
    ta * rates.tantalum;

  return Math.round(price * 100) / 100;
}

/**
 * Рассчитывает цены товара
 * 
 * Алгоритм:
 * 1. Определяем курсы (customRate категории > глобальный курс)
 * 2. Рассчитываем базовую цену: Content * Rate
 * 3. Применяем наценку товара: Base * priceMarkup
 * 4. Для isSingleType: считаем только по полям New, возвращаем одинаковую цену
 * 
 * @param product - Товар с содержанием металлов
 * @param globalRates - Глобальные курсы из MetalRate
 * @param categoryRates - Кастомные курсы категории
 * @returns Объект с ценами
 */
export function calculateProductPrices(
  product: MetalContent,
  globalRates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): ProductPrices {
  const rates = resolveRates(globalRates, categoryRates);
  const markup = product.priceMarkup ?? 1.0;
  const markupUsed = product.priceMarkupUsed ?? 1.0; // Наценка для Б/У
  const isSingleType = product.isSingleType ?? false;

  // ========================================
  // Расчёт цены для "Новых"
  // ========================================
  let priceNew: number | null = null;
  
  // Для isSingleType всегда рассчитываем цену (игнорируем isNewAvailable)
  if (isSingleType || product.isNewAvailable) {
    if (product.manualPriceNew != null) {
      priceNew = Number(product.manualPriceNew);
    } else {
      const basePrice = calculateBasePrice(
        product.contentGold,
        product.contentSilver,
        product.contentPlatinum,
        product.contentPalladium,
        rates,
        product.contentTantalum,
      );
      priceNew = Math.round(basePrice * markup * 100) / 100;
    }
  }

  // ========================================
  // Расчёт цены для "Б/У"
  // ========================================
  let priceUsed: number | null = null;

  if (isSingleType) {
    // Для isSingleType: цена одинаковая (используем поля New)
    priceUsed = priceNew;
  } else if (product.isUsedAvailable) {
    if (product.manualPriceUsed != null) {
      priceUsed = Number(product.manualPriceUsed);
    } else {
      const basePrice = calculateBasePrice(
        product.contentGoldUsed,
        product.contentSilverUsed,
        product.contentPlatinumUsed,
        product.contentPalladiumUsed,
        rates,
        product.contentTantalumUsed,
      );
      // Используем markupUsed для Б/У товаров
      priceUsed = Math.round(basePrice * markupUsed * 100) / 100;
    }
  }

  // Округляем итоговые цены до целых чисел
  return { 
    priceNew: priceNew !== null ? Math.round(priceNew) : null, 
    priceUsed: priceUsed !== null ? Math.round(priceUsed) : null, 
    isSingleType 
  };
}

/**
 * Рассчитывает цены для модификации товара
 * 
 * Использует ту же логику, что и базовый расчёт:
 * Content * Rate * markup (глобальный * товарный)
 * 
 * @param modification - Содержание металлов модификации
 * @param globalRates - Глобальные курсы из MetalRate
 * @param categoryRates - Кастомные курсы категории
 * @param markup - Эффективная наценка для Нового (product.priceMarkup * globalMarkup)
 * @param markupUsed - Эффективная наценка для Б/У (product.priceMarkupUsed * globalMarkup)
 * @returns Объект { priceNew, priceUsed } — округлённые до целого
 */
export function calculateModificationPrices(
  modification: ModificationContent,
  globalRates: MetalRates,
  categoryRates?: CategoryCustomRates | null,
  markup: number = 1.0,
  markupUsed: number = 1.0,
): ModificationPrices {
  const rates = resolveRates(globalRates, categoryRates);

  const basePriceNew = calculateBasePrice(
    modification.contentAu,
    modification.contentAg,
    modification.contentPt,
    modification.contentPd,
    rates,
    modification.contentTa,
  );

  const basePriceUsed = calculateBasePrice(
    modification.contentAuUsed,
    modification.contentAgUsed,
    modification.contentPtUsed,
    modification.contentPdUsed,
    rates,
    modification.contentTaUsed,
  );

  return {
    priceNew: Math.round(basePriceNew * markup),
    priceUsed: Math.round(basePriceUsed * markupUsed),
  };
}

/**
 * @deprecated Используйте calculateProductPrices
 */
export function calculateProductPrice(
  product: MetalContent,
  rates: MetalRates,
  categoryRates?: CategoryCustomRates | null
): number {
  const { priceNew, priceUsed } = calculateProductPrices(product, rates, categoryRates);
  return priceNew ?? priceUsed ?? 0;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Форматирует цену для отображения
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Число с ограничением знаков после запятой без лишних нулей (0.75, не 0.7500).
 */
function formatTrimmedNumber(value: number, maxDecimals: number): string {
  const str = value.toFixed(maxDecimals);
  if (!str.includes(".")) return str;
  return str.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Форматирует содержание металла для отображения
 * Подходит только для Au, Pt, Pd (в мг). Для Ag используйте formatSilverContent.
 * @param content - Содержание в мг
 * @returns Отформатированная строка
 */
export function formatMetalContent(content: unknown): string {
  const value = Number(content);
  if (value === 0) return "—";
  
  // Форматируем в зависимости от величины
  if (value < 1) {
    return `${formatTrimmedNumber(value, 4)} мг`;
  } else if (value < 10) {
    return `${formatTrimmedNumber(value, 3)} мг`;
  } else if (value < 1000) {
    return `${formatTrimmedNumber(value, 2)} мг`;
  }
  // Для значений >= 1000 мг показываем в граммах
  const grams = value / 1000;
  return `${formatTrimmedNumber(grams, 3)} г`;
}

/**
 * Форматирует содержание серебра (Ag) для отображения
 * @param content - Содержание в граммах
 * @returns Отформатированная строка
 */
export function formatSilverContent(content: unknown): string {
  const value = Number(content);
  if (value === 0) return "—";
  
  if (value < 1) {
    return `${formatTrimmedNumber(value, 4)} г`;
  } else if (value < 10) {
    return `${formatTrimmedNumber(value, 3)} г`;
  } else {
    return `${formatTrimmedNumber(value, 2)} г`;
  }
}

export type MetalSymbol = "Au" | "Ag" | "Pt" | "Pd" | "Ta";

/** Единица хранения содержания: Au/Pt/Pd — мг, Ag/Ta — г */
export const METAL_CONTENT_UNITS: Record<MetalSymbol, "мг" | "г"> = {
  Au: "мг",
  Ag: "г",
  Pt: "мг",
  Pd: "мг",
  Ta: "г",
};

/** Форматирует содержание металла с корректной единицей */
export function formatPreciousMetalContent(
  symbol: MetalSymbol,
  content: unknown
): string {
  if (symbol === "Ag" || symbol === "Ta") {
    return formatSilverContent(content);
  }
  return formatMetalContent(content);
}
