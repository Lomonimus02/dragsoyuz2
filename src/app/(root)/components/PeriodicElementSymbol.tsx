import type { MetalSymbol } from "@/lib/price-calculator";
import { getMetalDisplaySymbol } from "@/lib/precious-metals";

interface PeriodicElementSymbolProps {
  metal: MetalSymbol;
  className?: string;
}

/** Тикер металла (биржевое обозначение: платина — Pl) */
export function PeriodicElementSymbol({
  metal,
  className = "",
}: PeriodicElementSymbolProps) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      {getMetalDisplaySymbol(metal)}
    </span>
  );
}
