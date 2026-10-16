export const PRINT_GROUP_IDS = [
  "km",
  "silver",
  "chips",
  "connectors",
  "other",
] as const;

export type PrintGroupId = (typeof PRINT_GROUP_IDS)[number];

export const GOLD_BEARING_GROUP_IDS = ["chips", "connectors"] as const;

export type GoldBearingGroupId = (typeof GOLD_BEARING_GROUP_IDS)[number];

export const PRINT_GROUP_LABELS: Record<PrintGroupId, string> = {
  km: "КМ-конденсаторы",
  silver: "Техническое серебро",
  chips: "Транзисторы, микросхемы и диоды",
  connectors: "Разъёмы",
  other: "Прочее",
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е");
}

function slugEqualsOrPrefixed(slug: string, prefix: string): boolean {
  return slug === prefix || slug.startsWith(`${prefix}-`);
}

export function isGoldBearingGroup(id: PrintGroupId): id is GoldBearingGroupId {
  return id === "chips" || id === "connectors";
}

type CatalogHint = {
  categorySlug?: string | null;
  categoryName?: string | null;
  productName?: string | null;
  productSlug?: string | null;
  name?: string | null;
  slug?: string | null;
};

function catalogFields(input: CatalogHint): {
  categorySlug: string;
  productSlug: string;
  categoryName: string;
  productName: string;
} {
  return {
    categorySlug: (input.categorySlug ?? "").toLowerCase(),
    productSlug: (input.productSlug ?? input.slug ?? "").toLowerCase(),
    categoryName: normalizeText(input.categoryName ?? ""),
    productName: normalizeText(input.productName ?? input.name ?? ""),
  };
}

export function isRelay(input: CatalogHint): boolean {
  const { categorySlug, productSlug, categoryName, productName } =
    catalogFields(input);
  const slugMatch = [categorySlug, productSlug]
    .filter(Boolean)
    .some((part) => slugEqualsOrPrefixed(part, "rele"));
  return slugMatch || `${categoryName} ${productName}`.includes("реле");
}

export function shouldShowYearPicker(input: CatalogHint): boolean {
  const group = classifyPrintGroup(input);
  return group === "chips" || group === "connectors" || isRelay(input);
}

/** Year overlay on price: only transistors, ICs, diodes, connectors. */
export function shouldApplyYearDiscount(input: CatalogHint): boolean {
  const group = classifyPrintGroup(input);
  return group === "chips" || group === "connectors";
}

export function isGoldBearing(input: CatalogHint): boolean {
  return isGoldBearingGroup(classifyPrintGroup(input));
}

export type InventoryMetalsMode = "AUTO" | "INCLUDE" | "EXCLUDE";

export type InventoryMetalsHint = CatalogHint & {
  inventoryMetalsMode?: InventoryMetalsMode | null;
};

function resolveInventoryMetalsMode(
  product: InventoryMetalsHint,
): InventoryMetalsMode {
  const mode = product.inventoryMetalsMode;
  if (mode === "INCLUDE" || mode === "EXCLUDE") return mode;
  return "AUTO";
}

/** Au внутреннего отчёта: AUTO = только chips (разъёмы skip). */
export function shouldCountInventoryAu(product: InventoryMetalsHint): boolean {
  const mode = resolveInventoryMetalsMode(product);
  if (mode === "EXCLUDE") return false;
  if (mode === "INCLUDE") return true;
  return classifyPrintGroup(product) === "chips";
}

/** Строка «Итого золотосодержащие»: AUTO = chips + connectors. */
export function shouldCountGoldBearingSum(
  product: InventoryMetalsHint,
): boolean {
  const mode = resolveInventoryMetalsMode(product);
  if (mode === "EXCLUDE") return false;
  if (mode === "INCLUDE") return true;
  return isGoldBearing(product);
}

export function classifyPrintGroup(input: CatalogHint): PrintGroupId {
  const { categorySlug, productSlug, categoryName, productName } =
    catalogFields(input);

  const slugOrCatHasKm =
    categorySlug.includes("km") ||
    categoryName.includes("km") ||
    categoryName.includes("км");
  const isCapacitorCategory =
    categorySlug.includes("kondensator") ||
    categoryName.includes("конденсатор");

  if (
    slugEqualsOrPrefixed(categorySlug, "kondensatory-km") ||
    productSlug === "km" ||
    productSlug.startsWith("km-") ||
    (slugOrCatHasKm && isCapacitorCategory) ||
    /км[\s\-]/.test(productName) ||
    (productName.includes("конденсатор") && productName.includes("км"))
  ) {
    return "km";
  }

  if (
    categorySlug.includes("serebro") ||
    productSlug.includes("serebro") ||
    categoryName.includes("серебр") ||
    productName.includes("серебр")
  ) {
    return "silver";
  }

  const isConnectorSlug =
    slugEqualsOrPrefixed(categorySlug, "razemy") ||
    slugEqualsOrPrefixed(productSlug, "razemy");
  const isConnectorName =
    /разъем/.test(categoryName) || /разъем/.test(productName);

  if (isConnectorSlug || isConnectorName) {
    return "connectors";
  }

  const chipSlugPrefixes = ["tranzistory", "mikroshemy", "diody", "diod"];
  const isChipSlug = chipSlugPrefixes.some(
    (prefix) =>
      slugEqualsOrPrefixed(categorySlug, prefix) ||
      slugEqualsOrPrefixed(productSlug, prefix),
  );
  const isChipName =
    /транзистор/.test(categoryName) ||
    /транзистор/.test(productName) ||
    /микросхем/.test(categoryName) ||
    /микросхем/.test(productName) ||
    /диод/.test(categoryName) ||
    /диод/.test(productName);

  if (isChipSlug || isChipName) {
    return "chips";
  }

  return "other";
}

export function sortNewThenUsed<T>(
  rows: T[],
  getMeta: (row: T) => { isSingleType: boolean; condition: "new" | "used" },
): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const metaA = getMeta(a.row);
      const metaB = getMeta(b.row);
      const keyA = metaA.isSingleType || metaA.condition === "new" ? 0 : 1;
      const keyB = metaB.isSingleType || metaB.condition === "new" ? 0 : 1;
      if (keyA !== keyB) return keyA - keyB;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

export function groupRowsForPrint<T>(
  rows: T[],
  classify: (row: T) => PrintGroupId,
  getMeta?: (row: T) => { isSingleType: boolean; condition: "new" | "used" },
): { id: PrintGroupId; label: string; rows: T[] }[] {
  const buckets: Record<PrintGroupId, T[]> = {
    km: [],
    silver: [],
    chips: [],
    connectors: [],
    other: [],
  };

  for (const row of rows) {
    buckets[classify(row)].push(row);
  }

  return PRINT_GROUP_IDS.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: PRINT_GROUP_LABELS[id],
    rows:
      getMeta && id === "chips"
        ? sortNewThenUsed(buckets[id], getMeta)
        : buckets[id],
  }));
}
