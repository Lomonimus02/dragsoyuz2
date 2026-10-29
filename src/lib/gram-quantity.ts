import { roundRublesToHundred, shouldRoundPriceToHundred } from "@/lib/hundred-price";

export type GramUnitType = "PIECE" | "GRAM" | "KG";

export type GramQuantityProduct = {
  unitType?: GramUnitType | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  slug?: string | null;
  name?: string | null;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/ё/g, "е");
}

function slugHaystack(product: GramQuantityProduct): string {
  return `${product.categorySlug ?? ""} ${product.slug ?? ""}`.toLowerCase();
}

function nameHaystack(product: GramQuantityProduct): string {
  return normalizeText(
    `${product.categoryName ?? ""} ${product.name ?? ""}`,
  );
}

function isCapacitorSection(product: GramQuantityProduct): boolean {
  return (
    slugHaystack(product).includes("kondensator") ||
    nameHaystack(product).includes("конденсатор")
  );
}

function isTechSilverSection(product: GramQuantityProduct): boolean {
  if (slugHaystack(product).includes("serebro")) return true;
  return nameHaystack(product).includes("серебр");
}

const PGM_SLUG_RE = /palladi|paladi|platin|iridi|rodii|osmi|ruthen|mpg/;
const PGM_NAME_RE = /паллади|платин|ириди|родий|осми|рутен|платинов/;

function isPgmSection(product: GramQuantityProduct): boolean {
  return (
    PGM_SLUG_RE.test(slugHaystack(product)) ||
    PGM_NAME_RE.test(nameHaystack(product))
  );
}

export function usesGramQuantity(product: GramQuantityProduct): boolean {
  if (product.unitType === "KG" || product.unitType === "GRAM") return true;
  // Товар, который в каталоге явно продаётся «за штуку», считаем поштучно,
  // даже если лежит в разделе конденсаторов, серебра или платиновой группы.
  if (product.unitType === "PIECE") return false;
  // unitType не передан — запасной вариант: определяем по названию раздела.
  return (
    isCapacitorSection(product) ||
    isTechSilverSection(product) ||
    isPgmSection(product)
  );
}

export function quantityToPriceMultiplier(
  quantity: number,
  unitType: GramUnitType | null | undefined,
  gramMode: boolean,
): number {
  const qty = Number.isFinite(quantity) ? quantity : 0;
  if (!gramMode) return qty;
  if (unitType === "GRAM") return qty;
  return qty / 1000;
}

export function lineTotalFromGrams(
  unitPrice: number,
  grams: number,
  unitType?: GramUnitType | null,
): number {
  const price = Number.isFinite(unitPrice) ? unitPrice : 0;
  const multiplier = quantityToPriceMultiplier(grams, unitType, true);
  // Копейки сохраняем: 113 400 ₽/кг × 1 г = 113,4 ₽, а не 113 ₽.
  return Math.round(price * multiplier * 100) / 100;
}

function finishLineTotal(
  total: number,
  product: GramQuantityProduct | null | undefined,
): number {
  if (product && shouldRoundPriceToHundred(product)) {
    return roundRublesToHundred(total);
  }
  return total;
}

export function computeLineTotal(
  unitPrice: number,
  quantity: number,
  product: GramQuantityProduct | null | undefined,
): number {
  if (!product || !usesGramQuantity(product)) {
    return finishLineTotal(unitPrice * quantity, product);
  }
  // В описи КМ, серебро и платиновая группа не округляются до рублей и сотен.
  return lineTotalFromGrams(unitPrice, quantity, product.unitType);
}

export function formatInventoryQuantity(
  quantity: number,
  gramMode: boolean,
): string {
  if (!gramMode) return String(quantity);
  const formatted = quantity.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
  });
  return `${formatted} г.`;
}

export function formatQuantityDraft(
  quantity: number,
  gramMode: boolean,
): string {
  if (!Number.isFinite(quantity)) return "";
  if (!gramMode) return String(quantity);
  const rounded = Math.round(quantity * 10) / 10;
  return String(rounded).replace(".", ",");
}

export function isQuantityDraft(raw: string, gramMode: boolean): boolean {
  if (raw === "") return true;
  if (gramMode) return /^\d*([.,]\d{0,1})?$/.test(raw);
  return /^\d*$/.test(raw);
}

export function parseQuantityInput(
  raw: string,
  gramMode: boolean,
): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "." || trimmed === ",") return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  if (gramMode) return Math.round(value * 10) / 10;
  if (!Number.isInteger(value)) return null;
  return value;
}

export function getInventoryPriceUnitSuffix(
  unitType: GramUnitType | null | undefined,
  gramMode: boolean,
): string {
  if (unitType === "GRAM") return "/г.";
  if (unitType === "KG" || gramMode) return "/кг.";
  return "/шт.";
}
