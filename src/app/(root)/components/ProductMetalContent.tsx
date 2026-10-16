import {
  formatPreciousMetalContent,
  type MetalSymbol,
} from "@/lib/price-calculator";
import { PRECIOUS_METAL_LIST } from "@/lib/precious-metals";
import { PeriodicElementSymbol } from "./PeriodicElementSymbol";

interface ProductMetalContentProps {
  categoryName: string;
  productName: string;
  contentGold: number;
  contentSilver: number;
  contentPlatinum: number;
  contentPalladium: number;
  contentTantalum: number;
  variant?: "standalone" | "embedded";
}

const METAL_FIELDS: Record<
  MetalSymbol,
  "contentGold" | "contentSilver" | "contentPlatinum" | "contentPalladium" | "contentTantalum"
> = {
  Au: "contentGold",
  Ag: "contentSilver",
  Pt: "contentPlatinum",
  Pd: "contentPalladium",
  Ta: "contentTantalum",
};

const METAL_BADGES: Record<MetalSymbol, string> = {
  Au: "bg-amber-200 text-amber-900",
  Ag: "bg-slate-300 text-slate-800",
  Pt: "bg-sky-200 text-sky-900",
  Pd: "bg-violet-200 text-violet-900",
  Ta: "bg-stone-300 text-stone-900",
};

export function ProductMetalContent({
  categoryName,
  productName,
  contentGold,
  contentSilver,
  contentPlatinum,
  contentPalladium,
  contentTantalum,
  variant = "standalone",
}: ProductMetalContentProps) {
  const values = {
    contentGold,
    contentSilver,
    contentPlatinum,
    contentPalladium,
    contentTantalum,
  };

  const items = PRECIOUS_METAL_LIST.filter(
    (metal) => values[METAL_FIELDS[metal.id]] > 0,
  );

  if (items.length === 0) {
    return null;
  }

  const isEmbedded = variant === "embedded";
  const gridCols =
    items.length === 1
      ? "grid-cols-1"
      : items.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <section
      className={
        isEmbedded
          ? ""
          : "mb-8 rounded-xl border border-[var(--gray-200)] bg-white p-5 md:p-6 shadow-sm"
      }
    >
      <div className="mb-3">
        <h2
          className={`font-semibold text-[var(--gray-900)] ${
            isEmbedded ? "text-base" : "text-lg"
          }`}
        >
          Содержание драгметаллов
        </h2>
        <p className="text-sm text-[var(--gray-500)] mt-0.5">
          {categoryName} · {productName}
        </p>
      </div>

      <ul className={`grid ${gridCols} gap-2 max-w-xl`}>
        {items.map((metal) => (
          <li
            key={metal.id}
            className="rounded-lg border border-[var(--gray-200)] bg-[var(--gray-50)] px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded text-xs leading-none ${METAL_BADGES[metal.id]}`}
              >
                <PeriodicElementSymbol metal={metal.id} />
              </span>
              <span className="text-xs font-medium leading-tight text-[var(--gray-700)]">
                {metal.name}
              </span>
            </div>
            <span className="block text-sm font-semibold tabular-nums text-[var(--gray-900)]">
              {formatPreciousMetalContent(
                metal.id,
                values[METAL_FIELDS[metal.id]],
              )}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-[var(--gray-400)] max-w-xl">
        * Информация о содержании драгметаллов в новых радиодеталях, выпущенных до
        1990 года, взята из открытых источников.
      </p>
    </section>
  );
}
