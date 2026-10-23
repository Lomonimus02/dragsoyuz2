"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Package,
  Trash2,
  Minus,
  Plus,
  Pencil,
  ArrowLeft,
  Send,
  AlertCircle,
  Printer,
  Calculator,
  WhatsAppIcon,
} from "@/app/(root)/components/icons";
import { useCartStore, type InventoryLine, type ItemCondition } from "@/store";
import { useSiteContacts } from "../components/SiteContactsProvider";
import { useYearPeriodDiscounts } from "../components/YearDiscountsProvider";
import { CalculatorModal } from "../components/CalculatorModal";
import {
  getYearPeriodLabel,
  resolveLineDiscountPercent,
  resolveLineUnitPrice,
  shouldShowCalculator,
} from "@/lib/year-discount";
import {
  shouldApplyYearDiscount,
  shouldShowYearPicker,
} from "@/lib/inventory-print-groups";
import { SITE_BRAND, DEFAULT_SITE_VK_URL } from "@/lib/site";
import { sortInventoryByCatalog, type InventoryCatalogCategory } from "@/lib/inventory-catalog-order";
import {
  computeLineTotal,
  formatInventoryQuantity,
  formatQuantityDraft,
  getInventoryPriceUnitSuffix,
  isQuantityDraft,
  parseQuantityInput,
  usesGramQuantity,
} from "@/lib/gram-quantity";
import type { ProductWithPrice, ProductsResult } from "@/app/actions";
import { AdminMetalReport } from "./AdminMetalReport";
import { ManualInventoryForm } from "./ManualInventoryForm";
import { useAdminInventoryStore } from "@/store/admin-inventory-store";
import { formatManualQuantity, manualInventoryTotal, manualUnitLabel, type ManualInventoryLine } from "@/lib/manual-inventory";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function getConditionLabel(condition: ItemCondition, isSingleType: boolean): string {
  if (isSingleType) return "—";
  return condition === "new" ? "новое" : "б/у";
}

function formatPrintDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("ru-RU", { month: "long" });
  return `«${day}» ${month} ${date.getFullYear()} г.`;
}

function formatLinePeriod(
  line: InventoryLine,
  product: ProductWithPrice | null,
): string {
  if (!product || !shouldShowYearPicker(product)) {
    if (
      typeof line.customDiscountPercent === "number" &&
      Number.isFinite(line.customDiscountPercent)
    ) {
      return `уценка ${line.customDiscountPercent}%`;
    }
    return "—";
  }
  const yearLabel = getYearPeriodLabel(line.yearPeriodId);
  if (
    typeof line.customDiscountPercent === "number" &&
    Number.isFinite(line.customDiscountPercent)
  ) {
    return `${yearLabel}, уценка ${line.customDiscountPercent}%`;
  }
  return yearLabel;
}

function rowGramMode(product: ProductWithPrice | null): boolean {
  return product ? usesGramQuantity(product) : false;
}

function rowPriceSuffix(product: ProductWithPrice | null, manual?: ManualInventoryLine): string {
  if (manual) return `/${manualUnitLabel(manual.unit)}`;
  if (!product) return "";
  return getInventoryPriceUnitSuffix(
    product.unitType,
    usesGramQuantity(product),
  );
}

interface InventoryRow {
  line: InventoryLine;
  product: ProductWithPrice | null;
  unitPrice: number;
  lineTotal: number;
  displayName: string;
  manual?: ManualInventoryLine;
}

function rowQuantity(row: InventoryRow): string {
  return row.manual ? formatManualQuantity(row.manual) : formatInventoryQuantity(row.line.quantity, rowGramMode(row.product));
}

function rowCondition(row: InventoryRow): string {
  if (row.manual?.condition === "unspecified") return "—";
  return getConditionLabel(row.line.condition, row.product?.isSingleType ?? false);
}

function rowPeriod(row: InventoryRow): string {
  return row.manual ? row.manual.year || "—" : formatLinePeriod(row.line, row.product);
}

function InventoryQtyControl({
  quantity,
  gramMode,
  onQuantityChange,
}: {
  quantity: number;
  gramMode: boolean;
  onQuantityChange: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? formatQuantityDraft(quantity, gramMode);

  return (
    <div className="inline-flex items-center gap-1 print:hidden">
      <button
        type="button"
        onClick={() => {
          setDraft(null);
          onQuantityChange(quantity - 1);
        }}
        className="w-7 h-7 flex items-center justify-center rounded border border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
        aria-label={gramMode ? "Уменьшить на 1 г" : "Уменьшить"}
      >
        <Minus className="w-3 h-3" />
      </button>
      <input
        type="text"
        inputMode={gramMode ? "decimal" : "numeric"}
        autoComplete="off"
        value={display}
        onFocus={(e) => {
          setDraft(formatQuantityDraft(quantity, gramMode));
          e.target.select();
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (!isQuantityDraft(raw, gramMode)) return;
          setDraft(raw);
          const parsed = parseQuantityInput(raw, gramMode);
          if (parsed === null) return;
          onQuantityChange(parsed);
        }}
        onBlur={() => setDraft(null)}
        className="w-14 h-7 text-center font-semibold bg-transparent border-none outline-none tabular-nums"
        aria-label={gramMode ? "Количество, г" : "Количество"}
      />
      {gramMode ? (
        <span className="text-xs text-[var(--gray-500)]">г.</span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setDraft(null);
          onQuantityChange(quantity + 1);
        }}
        className="w-7 h-7 flex items-center justify-center rounded border border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
        aria-label={gramMode ? "Увеличить на 1 г" : "Увеличить"}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

export function CartPageClient({ isAdmin, catalogCategories }: { isAdmin: boolean; catalogCategories: InventoryCatalogCategory[] }) {
  const items = useCartStore((state) => state.items);
  const updateLineQuantity = useCartStore((state) => state.updateLineQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clearCart);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const discounts = useYearPeriodDiscounts();
  const siteContacts = useSiteContacts();
  const vkUrl = siteContacts?.vkHref || DEFAULT_SITE_VK_URL;
  const whatsappUrl = siteContacts?.whatsappHref;

  const manualLines = useAdminInventoryStore((state) => state.lines);
  const manualHydrated = useAdminInventoryStore((state) => state.hasHydrated);
  const removeManualLine = useAdminInventoryStore((state) => state.removeLine);
  const updateManualQuantity = useAdminInventoryStore((state) => state.updateLineQuantity);
  const clearManualLines = useAdminInventoryStore((state) => state.clear);
  const [manualEditor, setManualEditor] = useState<ManualInventoryLine | "new" | null>(null);
  const manualAddRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isAdmin) void useAdminInventoryStore.persist.rehydrate();
  }, [isAdmin]);

  const [productsById, setProductsById] = useState<
    Record<string, ProductWithPrice>
  >({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMetalReport, setShowMetalReport] = useState(false);
  const [editingLine, setEditingLine] = useState<InventoryLine | null>(null);

  const productsByIdRef = useRef(productsById);

  useEffect(() => {
    productsByIdRef.current = productsById;
  }, [productsById]);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function syncCatalog() {
      if (items.length === 0) {
        setInitialLoading(false);
        return;
      }

      const uniqueIds = [...new Set(items.map((item) => item.productId))];
      const missingIds = uniqueIds.filter((id) => !productsByIdRef.current[id]);

      if (missingIds.length === 0) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/products-by-ids?ids=${encodeURIComponent(missingIds.join(","))}`,
        );
        const result = (await response.json()) as ProductsResult;
        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          setInitialLoading(false);
          return;
        }

        setProductsById((prev) => {
          const next = { ...prev };
          for (const product of result.data) {
            next[product.id] = product;
          }
          return next;
        });
        setError(null);
        setInitialLoading(false);
      } catch {
        if (cancelled) return;
        setError("Не удалось загрузить товары описи");
        setInitialLoading(false);
      }
    }

    void syncCatalog();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, items]);

  const rows: InventoryRow[] = useMemo(
    () => {
      const catalogRows: InventoryRow[] = items.map((line) => {
        const product = productsById[line.productId] ?? null;
        const applyYearOverlay = product
          ? shouldApplyYearDiscount(product)
          : false;
        const useCustomMarkdown =
          typeof line.customDiscountPercent === "number" &&
          Number.isFinite(line.customDiscountPercent);
        const unitPrice = product
          ? resolveLineUnitPrice(
              product,
              line.modificationId,
              line.condition,
              resolveLineDiscountPercent(line, discounts, applyYearOverlay),
              line.yearPeriodId,
              applyYearOverlay,
              useCustomMarkdown,
            )
          : 0;
        const modName = product?.modifications.find(
          (mod) => mod.id === line.modificationId,
        )?.name;
        const displayName = product
          ? modName
            ? `${product.name} (${modName})`
            : product.name
          : "Товар больше не в каталоге";

        return {
          line,
          product,
          unitPrice,
          lineTotal: computeLineTotal(unitPrice, line.quantity, product),
          displayName,
        };
      });
      const extraRows: InventoryRow[] = isAdmin ? manualLines.map((manual) => ({
        line: { lineId: `manual:${manual.id}`, productId: "", modificationId: null,
          quantity: manual.quantity, condition: manual.condition === "used" ? "used" : "new",
          yearPeriodId: "until1990", customDiscountPercent: null },
        product: null, unitPrice: manual.unitPrice, lineTotal: manualInventoryTotal(manual),
        displayName: manual.name, manual,
      })) : [];
      return [...catalogRows, ...extraRows];
    },
    [items, productsById, discounts, isAdmin, manualLines],
  );

  const totalSum = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const totalPieces = rows.reduce(
    (sum, row) =>
      (row.manual ? row.manual.unit !== "PIECE" : rowGramMode(row.product)) ? sum : sum + row.line.quantity,
    0,
  );
  const totalGrams = rows.reduce(
    (sum, row) =>
      row.manual
        ? sum + (row.manual.unit === "PIECE" ? 0 : row.manual.quantity * (row.manual.unit === "KG" ? 1000 : 1))
        : rowGramMode(row.product) ? sum + row.line.quantity : sum,
    0,
  );
  const numberedRows = useMemo(
    () => sortInventoryByCatalog(rows, catalogCategories, (row) => row.product)
      .map((row, index) => ({ row, index: index + 1 })),
    [rows, catalogCategories],
  );

  const printDateLabel = formatPrintDate(new Date());

  const handlePrint = () => {
    document.documentElement.classList.remove("print-internal-report");
    window.print();
  };

  const handleSendToVK = () => {
    if (rows.length === 0 || !vkUrl) return;
    window.open(vkUrl, "_blank");
  };

  if (!hasHydrated || initialLoading || (isAdmin && !manualHydrated)) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary-500)] border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)] print:bg-white print:min-h-0">
      <div className="container mx-auto px-4 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:hidden">
          <div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-[var(--gray-600)] hover:text-[var(--gray-900)] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в каталог
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Опись
            </h1>
            <p className="text-[var(--gray-600)] mt-1">
              Позиции для оценки на приёмке
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {isAdmin && <button ref={manualAddRef} type="button" onClick={() => setManualEditor("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-700)] px-4 py-2.5 font-semibold text-white">
            <Plus className="w-4 h-4" />Добавить вручную
          </button>}
          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => { clearCart(); if (isAdmin) clearManualLines(); setManualEditor(null); setEditingLine(null); }}
              aria-label="Очистить опись"
              className="flex items-center gap-2 px-4 py-2 text-[var(--gray-600)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Очистить</span>
            </button>
          )}
          </div>
        </div>

        {isAdmin && manualEditor && <ManualInventoryForm key={manualEditor === "new" ? "new" : manualEditor.id}
          line={manualEditor === "new" ? null : manualEditor} onClose={() => { setManualEditor(null); manualAddRef.current?.focus({ preventScroll: true }); }} />}

        <div className="hidden print:block inventory-print-header mb-4">
          <div>
            {isAdmin ? (
              <p className="internal-report-title text-sm font-semibold text-gray-500 mb-1">
                Внутренний отчёт
              </p>
            ) : null}
            <h1 className="text-xl font-bold">Опись — {SITE_BRAND}</h1>
          </div>
          <div className="text-right">
            <p>Лист № 1</p>
            <p>Дата: {printDateLabel}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 print:hidden">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-12 text-center print:hidden">
            <Calculator className="w-16 h-16 text-[var(--gray-300)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
              Опись пуста
            </h2>
            <p className="text-[var(--gray-600)] mb-6">
              {isAdmin ? "Добавьте детали из каталога или создайте позицию вручную" : "Добавьте детали из каталога кнопкой «Добавить в опись»"}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold rounded-lg transition-colors"
            >
              <Package className="w-5 h-5" />
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:gap-0">
            <div className="lg:col-span-2 print:w-full">
              <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-x-auto print:hidden">
                <table className="inventory-screen w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-[var(--gray-700)]">
                      <th className="col-num px-2 py-2 font-semibold w-12">№ п/п</th>
                      <th className="col-name px-3 py-2 font-semibold text-left">
                        Наименование
                      </th>
                      <th className="px-2 py-2 font-semibold whitespace-nowrap">
                        Год выпуска
                      </th>
                      <th className="px-2 py-2 font-semibold">Состояние</th>
                      <th className="px-2 py-2 font-semibold">Кол-во</th>
                      <th className="px-2 py-2 font-semibold">Цена</th>
                      <th className="px-2 py-2 font-semibold">Сумма</th>
                      <th className="px-2 py-2 w-10 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {numberedRows.map(({ row, index }) => (
                      <tr
                        key={row.line.lineId}
                        className="text-[var(--gray-800)]"
                      >
                        <td className="col-num px-2 py-2 tabular-nums text-[var(--gray-500)]">
                          {index}
                        </td>
                        <td className="col-name px-3 py-2 font-medium text-[var(--gray-900)]">
                          {row.manual ? <span>{row.displayName}<span className="block text-xs font-normal text-[var(--gray-500)] print:hidden">Ручная позиция</span></span> : row.product ? (
                            <Link
                              href={`/catalog/${row.product.categorySlug}/${row.product.slug}`}
                              className="hover:text-[var(--primary-600)] print:text-black print:no-underline"
                            >
                              {row.displayName}
                            </Link>
                          ) : (
                            <span className="text-[var(--gray-500)] italic">
                              {row.displayName}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {rowPeriod(row)}
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          {rowCondition(row)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {row.manual ? row.manual.unit === "PIECE" ? <InventoryQtyControl
                            quantity={row.manual.quantity}
                            gramMode={false}
                            onQuantityChange={(quantity) => {
                              updateManualQuantity(row.manual!.id, quantity);
                              if (quantity <= 0 && manualEditor !== "new" && manualEditor?.id === row.manual!.id) setManualEditor(null);
                            }}
                          /> : <span className="tabular-nums">{rowQuantity(row)}</span> : <InventoryQtyControl
                            quantity={row.line.quantity}
                            gramMode={rowGramMode(row.product)}
                            onQuantityChange={(quantity) =>
                              updateLineQuantity(row.line.lineId, quantity)
                            }
                          />}
                          <span className="hidden print:inline tabular-nums">
                            {rowQuantity(row)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">
                          {formatPrice(row.unitPrice)}
                          {rowPriceSuffix(row.product, row.manual)}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold whitespace-nowrap tabular-nums">
                          {formatPrice(row.lineTotal)}
                        </td>
                        <td className="px-2 py-2 print:hidden">
                          <div className="flex items-center justify-end gap-0.5">
                            {isAdmin && row.manual ? <button type="button" onClick={() => setManualEditor(row.manual!)}
                              className="w-8 h-8 flex items-center justify-center rounded text-[var(--primary-600)] hover:bg-[var(--primary-50)]"
                              title="Изменить ручную позицию" aria-label={`Изменить ${row.displayName}`}><Pencil className="w-4 h-4" /></button> : null}
                            {row.product && shouldShowCalculator(row.product) ? (
                              <button
                                type="button"
                                onClick={() => setEditingLine(row.line)}
                                className="w-8 h-8 flex items-center justify-center text-[var(--gray-400)] hover:text-[var(--primary-600)] hover:bg-[var(--primary-50)] rounded"
                                title="Изменить"
                                aria-label="Изменить строку"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                if (row.manual) { removeManualLine(row.manual.id); if (manualEditor !== "new" && manualEditor?.id === row.manual.id) setManualEditor(null); }
                                else removeLine(row.line.lineId);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[var(--gray-400)] hover:text-red-500 hover:bg-red-50 rounded"
                              title="Удалить строку"
                              aria-label={`Удалить ${row.displayName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              <div className="hidden print:block">
                <table className="inventory-ledger">
                  <thead>
                    <tr>
                      <th className="col-num">№ п/п</th>
                      <th className="col-name">Наименование</th>
                      <th className="col-year">Год выпуска</th>
                      <th className="col-cond">Состояние</th>
                      <th className="col-qty">Кол-во</th>
                      <th className="col-price">Цена</th>
                      <th className="col-sum">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numberedRows.map(({ row, index }) => (
                          <tr key={row.line.lineId}>
                            <td className="col-num tabular-nums">{index}</td>
                            <td className="col-name">{row.displayName}</td>
                            <td className="col-year">
                              {rowPeriod(row)}
                            </td>
                            <td className="col-cond">
                              {rowCondition(row)}
                            </td>
                            <td className="col-qty tabular-nums">
                              {rowQuantity(row)}
                            </td>
                            <td className="col-price tabular-nums">
                              {formatPrice(row.unitPrice)}
                              {rowPriceSuffix(row.product, row.manual)}
                            </td>
                            <td className="col-sum tabular-nums">
                              {formatPrice(row.lineTotal)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                  <tfoot>
                    <tr className="grand-total">
                      <td colSpan={6} className="text-right">
                        Итого
                      </td>
                      <td className="col-sum tabular-nums">
                        {formatPrice(totalSum)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {isAdmin ? (
                <label className="print:hidden mt-4 flex items-center gap-2 text-sm text-[var(--gray-700)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showMetalReport}
                    onChange={(e) => setShowMetalReport(e.target.checked)}
                    className="rounded border-[var(--gray-300)]"
                  />
                  Показать содержание металлов
                </label>
              ) : null}

              {isAdmin && showMetalReport ? (
                <div>
                  {manualLines.length > 0 && <p className="mt-4 text-sm text-[var(--gray-600)] print:hidden">Ручные позиции включены в сумму описи. Содержание металлов рассчитывается только для позиций из каталога.</p>}
                  <AdminMetalReport lines={items} productsById={productsById} />
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-1 print:hidden">
              <div className="bg-white rounded-xl border border-[var(--gray-200)] p-6 sticky top-24">
                <h2 className="text-lg font-bold text-[var(--gray-900)] mb-4">
                  Итого
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-[var(--gray-600)]">
                    <span>Строк:</span>
                    <span>{rows.length}</span>
                  </div>
                  {totalPieces > 0 ? (
                    <div className="flex justify-between text-[var(--gray-600)]">
                      <span>Всего, шт.:</span>
                      <span>{totalPieces}</span>
                    </div>
                  ) : null}
                  {totalGrams > 0 ? (
                    <div className="flex justify-between text-[var(--gray-600)]">
                      <span>Всего, г.:</span>
                      <span>
                        {totalGrams.toLocaleString("ru-RU", { maximumFractionDigits: 3 })} г.
                      </span>
                    </div>
                  ) : null}
                  <div className="pt-3 border-t border-[var(--gray-200)] space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[var(--gray-900)] font-medium">
                        Общая сумма:
                      </span>
                      <span className="text-2xl font-bold text-[var(--accent-600)] tabular-nums">
                        {formatPrice(totalSum)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold rounded-lg transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    Печать / сохранить
                  </button>

                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#128c7e] hover:bg-[#0f7669] text-white font-semibold rounded-lg transition-colors">
                      <WhatsAppIcon className="w-5 h-5" />
                      Написать в WhatsApp
                    </a>
                  )}

                  {vkUrl && (<button
                    type="button"
                    onClick={handleSendToVK}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-semibold rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Написать в VK
                  </button>)}

                  <Link
                    href="/contacts"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-700)] font-medium rounded-lg transition-colors"
                  >
                    Связаться по телефону
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {editingLine &&
      productsById[editingLine.productId] &&
      shouldShowCalculator(productsById[editingLine.productId]) ? (
        <CalculatorModal
          key={editingLine.lineId}
          product={productsById[editingLine.productId]}
          editLine={editingLine}
          onClose={() => setEditingLine(null)}
        />
      ) : null}
    </div>
  );
}
