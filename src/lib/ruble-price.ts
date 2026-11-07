import type { UnitType } from "@/app/actions/products";

const rubleOptions = { style: "currency", currency: "RUB" } as const;
const wholeRubles = new Intl.NumberFormat("ru-RU", { ...rubleOptions, maximumFractionDigits: 0, minimumFractionDigits: 0 });
const optionalKopecks = new Intl.NumberFormat("ru-RU", { ...rubleOptions, minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fixedKopecks = new Intl.NumberFormat("ru-RU", { ...rubleOptions, minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function toKopecks(price: number): number {
  const scaled = price * 100;
  // Compensate for a half-kopeck represented just below the boundary in binary.
  return Math.round(scaled + Math.abs(scaled) * Number.EPSILON);
}

export function formatCatalogPrice(price: number, unitType?: UnitType | null): string {
  return (unitType === "CONTACT" ? fixedKopecks : wholeRubles).format(price);
}

export function formatRubles(price: number | null, unitType?: UnitType | null): string {
  if (price === null) return "—";
  return (unitType === "CONTACT" ? fixedKopecks : optionalKopecks).format(price);
}
