import { getMetalRates } from "@/app/actions";
import { TrendingUp } from "lucide-react";
import { PeriodicElementSymbol } from "./PeriodicElementSymbol";

/**
 * Серверный компонент для отображения курсов металлов
 * Статичный на десктопе, бегущая строка на мобильных
 */
export async function MetalRatesBar() {
  const result = await getMetalRates();

  if (!result.success) {
    return null;
  }

  const { gold, silver, platinum, palladium, tantalum } = result.data;

  // Контент курсов (не как компонент, а как JSX элементы)
  const ratesContent = (
    <>
      <span className="flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <span className="text-slate-400 hidden sm:inline">Курсы:</span>
      </span>
      <span className="flex items-center gap-1">
        <PeriodicElementSymbol metal="Au" className="text-amber-400" />
        <span>{gold.toLocaleString("ru-RU")} ₽</span>
      </span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1">
        <PeriodicElementSymbol metal="Ag" className="text-slate-300" />
        <span>{silver.toLocaleString("ru-RU")} ₽</span>
      </span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1">
        <PeriodicElementSymbol metal="Pt" className="text-cyan-300" />
        <span>{platinum.toLocaleString("ru-RU")} ₽</span>
      </span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1">
        <PeriodicElementSymbol metal="Pd" className="text-rose-300" />
        <span>{palladium.toLocaleString("ru-RU")} ₽</span>
      </span>
      {tantalum > 0 && (
        <>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <PeriodicElementSymbol metal="Ta" className="text-stone-300" />
            <span>{tantalum.toLocaleString("ru-RU")} ₽</span>
          </span>
        </>
      )}
    </>
  );

  return (
    <div className="bg-slate-900 border-b border-slate-700 overflow-hidden">
      <div className="py-2 text-sm">
        {/* Desktop: статичный, центрированный */}
        <div className="hidden md:flex justify-center items-center gap-4 text-white">
          {ratesContent}
        </div>

        {/* Mobile: бегущая строка */}
        <div className="md:hidden relative">
          <div 
            className="flex whitespace-nowrap"
            style={{ animation: "scroll 20s linear infinite" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 text-white px-4 shrink-0">
                {ratesContent}
              </div>
            ))}
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `
          }} />
        </div>
      </div>
    </div>
  );
}
