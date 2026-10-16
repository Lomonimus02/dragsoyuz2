"use client";

import { useEffect, useMemo } from "react";
import { Printer } from "lucide-react";
import type { InventoryLine } from "@/store";
import {
  accumulateGoldAuByGroup,
  type InventoryMetalProduct,
} from "@/lib/inventory-metals";
import { formatPreciousMetalContent } from "@/lib/price-calculator";
import { useYearPeriodDiscounts } from "../components/YearDiscountsProvider";

const PRINT_INTERNAL_CLASS = "print-internal-report";
const PRINT_CLEANUP_FALLBACK_MS = 2_000;

interface AdminMetalReportProps {
  lines: InventoryLine[];
  productsById: Record<string, InventoryMetalProduct | undefined>;
}

function formatAu(value: number): string {
  return formatPreciousMetalContent("Au", value);
}

function AuRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-lg border border-[var(--gray-200)] bg-[var(--gray-50)]">
      <span className="block text-sm font-medium text-[var(--gray-700)] mb-1">
        {label}
      </span>
      <span className="block text-lg font-bold tabular-nums text-[var(--gray-900)]">
        {formatAu(value)}
      </span>
    </div>
  );
}

export function AdminMetalReport({
  lines,
  productsById,
}: AdminMetalReportProps) {
  const yearDiscounts = useYearPeriodDiscounts();
  const totals = useMemo(
    () => accumulateGoldAuByGroup(lines, productsById, yearDiscounts),
    [lines, productsById, yearDiscounts],
  );

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(PRINT_INTERNAL_CLASS);
    };
  }, []);

  if (lines.length === 0) return null;

  const handleInternalPrint = () => {
    const html = document.documentElement;
    html.classList.add(PRINT_INTERNAL_CLASS);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      html.classList.remove(PRINT_INTERNAL_CLASS);
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, PRINT_CLEANUP_FALLBACK_MS);
  };

  return (
    <section className="admin-metal-report mt-6 rounded-xl border border-[var(--gray-200)] bg-white p-5 print:hidden print:mt-8 print:rounded-none print:border print:border-gray-300 print:p-0 print:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 print:mb-3">
        <div>
          <p className="internal-report-title text-sm font-semibold text-gray-500 mb-1">
            Внутренний отчёт
          </p>
          <h2 className="text-lg font-bold text-[var(--gray-900)]">
            Содержание золота (Au)
          </h2>
        </div>
        <button
          type="button"
          onClick={handleInternalPrint}
          className="print:hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--gray-800)] hover:bg-[var(--gray-900)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Печать внутреннего отчёта
        </button>
      </div>

      <div className="space-y-3">
        <AuRow
          label="Новые микросхемы, транзисторы и диоды"
          value={totals.chips.new}
        />
        <AuRow
          label="Микросхемы, транзисторы и диоды б/у"
          value={totals.chips.used}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--gray-200)]">
        <AuRow
          label="Итого Au по микросхемам, транзисторам и диодам"
          value={totals.chips.all}
        />
      </div>
    </section>
  );
}
