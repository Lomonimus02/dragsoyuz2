import type { MetalSymbol } from "@/lib/price-calculator";

export type PreciousMetalInfo = {
  /** Внутренний ключ (Pt — платина в коде и БД) */
  id: MetalSymbol;
  /** Тикер для отображения (платина на бирже — Pl, не Pt) */
  displaySymbol: string;
  name: string;
};

export const PRECIOUS_METALS: Record<MetalSymbol, PreciousMetalInfo> = {
  Au: { id: "Au", displaySymbol: "Au", name: "Золото" },
  Ag: { id: "Ag", displaySymbol: "Ag", name: "Серебро" },
  Pt: { id: "Pt", displaySymbol: "Pl", name: "Платина" },
  Pd: { id: "Pd", displaySymbol: "Pd", name: "Палладий" },
  Ta: { id: "Ta", displaySymbol: "Ta", name: "Тантал" },
};

export const PRECIOUS_METAL_LIST: PreciousMetalInfo[] = [
  PRECIOUS_METALS.Au,
  PRECIOUS_METALS.Ag,
  PRECIOUS_METALS.Pt,
  PRECIOUS_METALS.Pd,
  PRECIOUS_METALS.Ta,
];

export function getMetalDisplaySymbol(metal: MetalSymbol): string {
  return PRECIOUS_METALS[metal].displaySymbol;
}

export function getMetalLabel(metal: MetalSymbol): string {
  const info = PRECIOUS_METALS[metal];
  return `${info.displaySymbol} (${info.name})`;
}
