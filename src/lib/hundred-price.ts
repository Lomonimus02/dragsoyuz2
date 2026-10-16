import { classifyPrintGroup } from "@/lib/inventory-print-groups";

type PriceGroupHint = {
  categorySlug?: string | null;
  categoryName?: string | null;
  productSlug?: string | null;
  productName?: string | null;
  slug?: string | null;
  name?: string | null;
  unitType?: "PIECE" | "GRAM" | "KG" | null;
};

/**
 * До сотен рублей округляется только весовая цена КМ и технического серебра
 * (₽/кг и ₽/г). Штучные позиции остаются как есть, иначе 1,3 и 1,35
 * сходятся в одну цену, а мелочь вроде МЛЗ превращается в 0 ₽.
 */
export function shouldRoundPriceToHundred(input: PriceGroupHint): boolean {
  if (input.unitType !== "KG" && input.unitType !== "GRAM") return false;
  const group = classifyPrintGroup(input);
  return group === "km" || group === "silver";
}

/**
 * Последние две цифры: меньше 50 — вниз, 50 и больше — вверх.
 * 118141 → 118100, 118150 → 118200.
 */
export function roundRublesToHundred(price: number): number {
  if (!Number.isFinite(price)) return 0;
  const sign = price < 0 ? -1 : 1;
  const whole = Math.round(Math.abs(price));
  const tail = whole % 100;
  const base = whole - tail;
  const rounded = tail < 50 ? base : base + 100;
  return sign * rounded;
}

export function applyHundredPrice(
  price: number | null,
  input: PriceGroupHint,
): number | null {
  if (price == null || !Number.isFinite(price)) return price;
  if (!shouldRoundPriceToHundred(input)) return price;
  return roundRublesToHundred(price);
}
