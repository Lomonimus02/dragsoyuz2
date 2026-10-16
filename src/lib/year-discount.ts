type LineCondition = "new" | "used";

interface PricedModification {
  id: string;
  priceNew: number;
  priceUsed: number;
}

interface PricedProduct {
  isPriceOnRequest: boolean;
  hasModifications: boolean;
  modifications: PricedModification[];
  priceNew: number | null;
  priceUsed: number | null;
  isSingleType: boolean;
}

export const YEAR_PERIOD_IDS = [
  "until1990",
  "from1990",
  "from2000",
  "from2010",
] as const;

export type YearPeriodId = (typeof YEAR_PERIOD_IDS)[number];

export type YearPeriodDiscounts = Record<YearPeriodId, number>;

export const YEAR_PERIODS: { id: YearPeriodId; label: string }[] = [
  { id: "until1990", label: "до 1990" },
  { id: "from1990", label: "с 1990" },
  { id: "from2000", label: "с 2000" },
  { id: "from2010", label: "с 2010" },
];

export const DEFAULT_YEAR_PERIOD_DISCOUNTS: YearPeriodDiscounts = {
  until1990: 0,
  from1990: 10,
  from2000: 20,
  from2010: 40,
};

export function getYearPeriodLabel(id: YearPeriodId): string {
  return YEAR_PERIODS.find((period) => period.id === id)?.label ?? id;
}

export function clampDiscountPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function parseYearPeriodDiscounts(raw: unknown): YearPeriodDiscounts {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const result = { ...DEFAULT_YEAR_PERIOD_DISCOUNTS };

  for (const id of YEAR_PERIOD_IDS) {
    const value = source[id];
    if (typeof value === "number" && Number.isFinite(value)) {
      result[id] = clampDiscountPercent(value);
    } else if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        result[id] = clampDiscountPercent(parsed);
      }
    }
  }

  return result;
}

const DECADE_ROUND_PERIODS: ReadonlySet<YearPeriodId> = new Set([
  "from1990",
  "from2000",
  "from2010",
]);

/**
 * Round kopecks to a whole ruble with cutoff 80 kop (not to 10 ₽).
 * 45.6 / 45.7 → 45, 45.8 / 45.9 → 46.
 */
export function roundRublesByKopecksCutoff08(price: number): number {
  if (!Number.isFinite(price) || price < 0) return 0;
  const kopecks = Math.round(price * 100);
  const rubles = Math.floor(kopecks / 100);
  const remainder = kopecks % 100;
  return remainder < 80 ? rubles : rubles + 1;
}

function usesKopeckCutoffRound(
  yearPeriodId: YearPeriodId,
  applyYearOverlay: boolean,
  useCustomMarkdown: boolean,
): boolean {
  if (useCustomMarkdown) return true;
  return applyYearOverlay && DECADE_ROUND_PERIODS.has(yearPeriodId);
}

/**
 * Overlay фактора золота поверх уже посчитанной витринной цены:
 * процент N = меньше золота → цена × (1−N/100).
 * Не использует формулы из price-calculator.ts.
 * Kopeck cutoff 0.8 for from1990|from2000|from2010 (year overlay) and for «Уценка».
 */
export function applyYearDiscount(
  basePrice: number,
  discountPercent: number,
  yearPeriodId: YearPeriodId,
  applyYearOverlay: boolean,
  useCustomMarkdown: boolean,
): number {
  const raw = applyYearPercentToAmount(basePrice, discountPercent);
  if (usesKopeckCutoffRound(yearPeriodId, applyYearOverlay, useCustomMarkdown)) {
    return roundRublesByKopecksCutoff08(raw);
  }
  return Math.round(raw);
}

/** Same overlay as year markdown, without ruble rounding — for metal content. */
export function applyYearPercentToAmount(
  amount: number,
  discountPercent: number,
): number {
  const base = Number.isFinite(amount) ? amount : 0;
  return base * (1 - clampDiscountPercent(discountPercent) / 100);
}

export function getDiscountPercent(
  discounts: YearPeriodDiscounts,
  yearPeriodId: YearPeriodId,
): number {
  return clampDiscountPercent(
    discounts[yearPeriodId] ?? DEFAULT_YEAR_PERIOD_DISCOUNTS[yearPeriodId],
  );
}

/**
 * Combined overlay percent for a line price (one `applyYearDiscount` round).
 * Year factor: reduced gold → price (0 when `applyYearDiscount` is false).
 * Custom percent: extra overlay stacked with year on price; chip Au uses the
 * same year×custom factors via sequential `applyYearPercentToAmount` (no ruble round).
 */
export function resolveLineDiscountPercent(
  line: {
    yearPeriodId: YearPeriodId;
    customDiscountPercent?: number | null;
  },
  discounts: YearPeriodDiscounts,
  applyYearDiscount = true,
): number {
  const yearPct = applyYearDiscount
    ? getDiscountPercent(discounts, line.yearPeriodId)
    : 0;
  const customPct =
    typeof line.customDiscountPercent === "number" &&
    Number.isFinite(line.customDiscountPercent)
      ? clampDiscountPercent(line.customDiscountPercent)
      : 0;

  return clampDiscountPercent(
    100 * (1 - (1 - yearPct / 100) * (1 - customPct / 100)),
  );
}

export function resolveLineBasePrice(
  product: PricedProduct,
  modificationId: string | null,
  condition: LineCondition,
): number {
  const mod = modificationId
    ? product.modifications.find((item) => item.id === modificationId)
    : undefined;

  if (mod) {
    if (product.isSingleType || condition === "new") {
      return mod.priceNew;
    }
    return mod.priceUsed;
  }

  if (product.isSingleType || condition === "new") {
    return product.priceNew ?? 0;
  }

  return product.priceUsed ?? 0;
}

export function resolveLineUnitPrice(
  product: PricedProduct,
  modificationId: string | null,
  condition: LineCondition,
  discountPercent: number,
  yearPeriodId: YearPeriodId,
  applyYearOverlay: boolean,
  useCustomMarkdown: boolean,
): number {
  return applyYearDiscount(
    resolveLineBasePrice(product, modificationId, condition),
    discountPercent,
    yearPeriodId,
    applyYearOverlay,
    useCustomMarkdown,
  );
}

export function shouldShowCalculator(product: PricedProduct): boolean {
  if (product.isPriceOnRequest) return false;

  if (product.hasModifications && product.modifications.length > 0) {
    return true;
  }

  return product.priceNew !== null || product.priceUsed !== null;
}
