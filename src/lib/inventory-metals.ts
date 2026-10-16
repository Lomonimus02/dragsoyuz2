import type { InventoryLine, ItemCondition } from "@/store";
import {
  quantityToPriceMultiplier,
  usesGramQuantity,
} from "@/lib/gram-quantity";
import {
  shouldCountInventoryAu,
  type InventoryMetalsMode,
} from "@/lib/inventory-print-groups";
import {
  applyYearPercentToAmount,
  clampDiscountPercent,
  getDiscountPercent,
  type YearPeriodDiscounts,
} from "@/lib/year-discount";

export type MetalTotals = {
  au: number;
  ag: number;
  pt: number;
  pd: number;
  ta: number;
};

export type InventoryMetalProduct = {
  isSingleType: boolean;
  unitType?: "PIECE" | "GRAM" | "KG" | null;
  inventoryMetalsMode?: InventoryMetalsMode | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  slug?: string | null;
  name?: string | null;
  contentGold: number;
  contentSilver: number;
  contentPlatinum: number;
  contentPalladium: number;
  contentTantalum: number;
  contentGoldUsed: number;
  contentSilverUsed: number;
  contentPlatinumUsed: number;
  contentPalladiumUsed: number;
  contentTantalumUsed: number;
  modifications: Array<{
    id: string;
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
  }>;
};

const EMPTY_TOTALS: MetalTotals = { au: 0, ag: 0, pt: 0, pd: 0, ta: 0 };

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function usesNewContent(
  isSingleType: boolean,
  condition: ItemCondition,
): boolean {
  return isSingleType || condition === "new";
}

function addScaled(
  acc: MetalTotals,
  unit: MetalTotals,
  quantity: number,
): MetalTotals {
  return {
    au: acc.au + unit.au * quantity,
    ag: acc.ag + unit.ag * quantity,
    pt: acc.pt + unit.pt * quantity,
    pd: acc.pd + unit.pd * quantity,
    ta: acc.ta + unit.ta * quantity,
  };
}

/** Per-unit metal content in storage units (Au/Pt/Pd = mg, Ag = g). Year is ignored. */
export function resolveLineMetalContent(
  product: InventoryMetalProduct,
  modificationId: string | null,
  condition: ItemCondition,
): MetalTotals {
  const useNew = usesNewContent(product.isSingleType, condition);
  const mod = modificationId
    ? product.modifications.find((item) => item.id === modificationId)
    : undefined;

  if (mod) {
    if (useNew) {
      return {
        au: toAmount(mod.contentAu),
        ag: toAmount(mod.contentAg),
        pt: toAmount(mod.contentPt),
        pd: toAmount(mod.contentPd),
        ta: toAmount(mod.contentTa),
      };
    }
    return {
      au: toAmount(mod.contentAuUsed),
      ag: toAmount(mod.contentAgUsed),
      pt: toAmount(mod.contentPtUsed),
      pd: toAmount(mod.contentPdUsed),
      ta: toAmount(mod.contentTaUsed),
    };
  }

  if (useNew) {
    return {
      au: toAmount(product.contentGold),
      ag: toAmount(product.contentSilver),
      pt: toAmount(product.contentPlatinum),
      pd: toAmount(product.contentPalladium),
      ta: toAmount(product.contentTantalum),
    };
  }

  return {
    au: toAmount(product.contentGoldUsed),
    ag: toAmount(product.contentSilverUsed),
    pt: toAmount(product.contentPlatinumUsed),
    pd: toAmount(product.contentPalladiumUsed),
    ta: toAmount(product.contentTantalumUsed),
  };
}

export function accumulateInventoryMetals(
  lines: InventoryLine[],
  productsById: Record<string, InventoryMetalProduct | undefined>,
): { new: MetalTotals; used: MetalTotals; all: MetalTotals } {
  let newTotals: MetalTotals = { ...EMPTY_TOTALS };
  let usedTotals: MetalTotals = { ...EMPTY_TOTALS };

  for (const line of lines) {
    const product = productsById[line.productId];
    if (!product) continue;

    const unit = resolveLineMetalContent(
      product,
      line.modificationId,
      line.condition,
    );
    const scale = quantityToPriceMultiplier(
      line.quantity,
      product.unitType,
      usesGramQuantity(product),
    );
    if (usesNewContent(product.isSingleType, line.condition)) {
      newTotals = addScaled(newTotals, unit, scale);
    } else {
      usedTotals = addScaled(usedTotals, unit, scale);
    }
  }

  return {
    new: newTotals,
    used: usedTotals,
    all: {
      au: newTotals.au + usedTotals.au,
      ag: newTotals.ag + usedTotals.ag,
      pt: newTotals.pt + usedTotals.pt,
      pd: newTotals.pd + usedTotals.pd,
      ta: newTotals.ta + usedTotals.ta,
    },
  };
}

export type GoldAuBucket = {
  new: number;
  used: number;
  all: number;
};

function emptyGoldAuBucket(): GoldAuBucket {
  return { new: 0, used: 0, all: 0 };
}

function addAuToBucket(
  bucket: GoldAuBucket,
  au: number,
  isNew: boolean,
): void {
  if (isNew) {
    bucket.new += au;
  } else {
    bucket.used += au;
  }
  bucket.all += au;
}

/** Au (мг) only for transistors, ICs, diodes. Year-period % and manual «Уценка» both scale content (no ruble round). */
export function accumulateGoldAuByGroup(
  lines: InventoryLine[],
  productsById: Record<string, InventoryMetalProduct | undefined>,
  yearDiscounts: YearPeriodDiscounts,
): {
  chips: GoldAuBucket;
  connectors: GoldAuBucket;
  grand: GoldAuBucket;
} {
  const chips = emptyGoldAuBucket();
  const connectors = emptyGoldAuBucket();

  for (const line of lines) {
    const product = productsById[line.productId];
    if (!product) continue;

    if (
      !shouldCountInventoryAu({
        categorySlug: product.categorySlug,
        categoryName: product.categoryName,
        productName: product.name,
        productSlug: product.slug,
        inventoryMetalsMode: product.inventoryMetalsMode,
      })
    ) {
      continue;
    }

    const unit = resolveLineMetalContent(
      product,
      line.modificationId,
      line.condition,
    );
    const scale = quantityToPriceMultiplier(
      line.quantity,
      product.unitType,
      usesGramQuantity(product),
    );
    const yearPercent = getDiscountPercent(yearDiscounts, line.yearPeriodId);
    const customPercent =
      typeof line.customDiscountPercent === "number" &&
      Number.isFinite(line.customDiscountPercent)
        ? clampDiscountPercent(line.customDiscountPercent)
        : 0;
    let au = applyYearPercentToAmount(unit.au * scale, yearPercent);
    au = applyYearPercentToAmount(au, customPercent);
    addAuToBucket(
      chips,
      au,
      usesNewContent(product.isSingleType, line.condition),
    );
  }

  return {
    chips,
    connectors,
    grand: {
      new: chips.new,
      used: chips.used,
      all: chips.all,
    },
  };
}
