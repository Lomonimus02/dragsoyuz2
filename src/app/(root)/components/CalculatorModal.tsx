"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardList, Minus, Plus, X } from "lucide-react";
import type { ProductWithPrice, UnitType } from "@/app/actions";
import {
  useCartStore,
  type InventoryLine,
  type ItemCondition,
} from "@/store";
import {
  useIsAdmin,
  useYearPeriodDiscounts,
} from "./YearDiscountsProvider";
import {
  YEAR_PERIODS,
  clampDiscountPercent,
  getDiscountPercent,
  getYearPeriodLabel,
  resolveLineDiscountPercent,
  resolveLineUnitPrice,
  shouldShowCalculator,
  type YearPeriodId,
} from "@/lib/year-discount";
import {
  computeLineTotal,
  formatInventoryQuantity,
  formatQuantityDraft,
  getInventoryPriceUnitSuffix,
  isQuantityDraft,
  parseQuantityInput,
  usesGramQuantity,
} from "@/lib/gram-quantity";
import {
  shouldApplyYearDiscount,
  shouldShowYearPicker,
} from "@/lib/inventory-print-groups";

interface CalculatorModalProps {
  product: ProductWithPrice;
  editLine?: InventoryLine;
  onClose?: () => void;
}

interface AddedSummary {
  id: number;
  quantity: number;
  condition: ItemCondition;
  yearPeriodId: YearPeriodId;
  customDiscountPercent: number | null;
  modificationName: string | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function parseMarkdownPercent(raw: string): number {
  if (raw.trim() === "" || raw === "." || raw === ",") return 0;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? clampDiscountPercent(value) : 0;
}

function isMarkdownPercentDraft(raw: string): boolean {
  return raw === "" || /^\d{0,3}([.,]\d{0,2})?$/.test(raw);
}

function formatQuantityLabel(
  quantity: number,
  unitType: UnitType,
  gramMode: boolean,
): string {
  if (gramMode) return formatInventoryQuantity(quantity, true);
  switch (unitType) {
    case "GRAM":
      return `${quantity} г.`;
    case "KG":
      return `${quantity} кг.`;
    default:
      return `${quantity} шт.`;
  }
}

function defaultCondition(product: ProductWithPrice): ItemCondition {
  if (product.isSingleType) return "new";
  if (product.isNewAvailable) return "new";
  return "used";
}

function defaultModificationId(product: ProductWithPrice): string | null {
  if (product.hasModifications && product.modifications.length === 1) {
    return product.modifications[0].id;
  }
  return null;
}

function formatAddedSummary(
  summary: AddedSummary,
  product: ProductWithPrice,
  index: number,
): string {
  const parts = [
    formatQuantityLabel(
      summary.quantity,
      product.unitType,
      usesGramQuantity(product),
    ),
  ];
  if (summary.modificationName) {
    parts.push(summary.modificationName);
  }
  if (!product.isSingleType) {
    parts.push(summary.condition === "new" ? "новые" : "б/у");
  }
  if (summary.customDiscountPercent !== null) {
    parts.push(`уценка ${summary.customDiscountPercent}%`);
  }
  if (shouldShowYearPicker(product)) {
    parts.push(getYearPeriodLabel(summary.yearPeriodId));
  }
  return `Добавлено ${index + 1}: ${parts.join(", ")}`;
}

function stepQuantityInput(
  raw: string,
  gramMode: boolean,
  delta: number,
): string {
  const parsed = parseQuantityInput(raw, gramMode);
  if (parsed === null) {
    if (delta <= 0) return raw;
    return "1";
  }
  const min = gramMode ? 0.1 : 1;
  const next = parsed + delta;
  if (next < min) {
    return formatQuantityDraft(min, gramMode);
  }
  return formatQuantityDraft(
    gramMode ? Math.round(next * 10) / 10 : next,
    gramMode,
  );
}

export function CalculatorModal({
  product,
  editLine,
  onClose,
}: CalculatorModalProps) {
  const addLine = useCartStore((state) => state.addLine);
  const replaceLine = useCartStore((state) => state.replaceLine);
  const isEditing = Boolean(editLine);
  const showConditionPicker =
    !product.isSingleType && product.isNewAvailable && product.isUsedAvailable;
  const gramMode = usesGramQuantity(product);
  const showYearPicker = shouldShowYearPicker(product);
  const applyYearDiscount = shouldApplyYearDiscount(product);

  const [isOpen, setIsOpen] = useState(
    isEditing && shouldShowCalculator(product),
  );
  const [condition, setCondition] = useState<ItemCondition | null>(() => {
    if (editLine) return editLine.condition;
    return showConditionPicker ? null : defaultCondition(product);
  });
  const [yearPeriodId, setYearPeriodId] = useState<YearPeriodId | null>(() => {
    if (editLine) return editLine.yearPeriodId;
    return showYearPicker ? null : "until1990";
  });
  const [customMarkdownEnabled, setCustomMarkdownEnabled] = useState(() =>
    Boolean(
      editLine &&
        typeof editLine.customDiscountPercent === "number" &&
        Number.isFinite(editLine.customDiscountPercent),
    ),
  );
  const [customDiscountInput, setCustomDiscountInput] = useState(() => {
    if (
      editLine &&
      typeof editLine.customDiscountPercent === "number" &&
      Number.isFinite(editLine.customDiscountPercent)
    ) {
      return String(editLine.customDiscountPercent).replace(".", ",");
    }
    return "";
  });
  const customDiscountPercent = parseMarkdownPercent(customDiscountInput);
  const [quantityInput, setQuantityInput] = useState(() =>
    editLine ? formatQuantityDraft(editLine.quantity, gramMode) : "",
  );
  const [modificationId, setModificationId] = useState<string | null>(() =>
    editLine ? editLine.modificationId : defaultModificationId(product),
  );
  const [conditionError, setConditionError] = useState(false);
  const [yearError, setYearError] = useState(false);
  const [quantityError, setQuantityError] = useState(false);
  const discounts = useYearPeriodDiscounts();
  const isAdmin = useIsAdmin();
  const canSetCustomMarkdown = isAdmin && customMarkdownEnabled;
  const [addedLines, setAddedLines] = useState<AddedSummary[]>([]);
  const addedIdRef = useRef(0);
  const addedListEndRef = useRef<HTMLDivElement | null>(null);
  const pushedRef = useRef(false);
  const closingFromPopRef = useRef(false);

  const needsMod =
    product.hasModifications && product.modifications.length > 0;
  const suffix = getInventoryPriceUnitSuffix(product.unitType, gramMode);
  const gatesReady =
    (!showConditionPicker || condition !== null) &&
    (!showYearPicker || yearPeriodId !== null);
  const canSubmit = !needsMod || Boolean(modificationId);
  const showPrice =
    canSubmit && gatesReady && condition !== null && yearPeriodId !== null;
  const discountPercent = showPrice
    ? resolveLineDiscountPercent(
        {
          yearPeriodId,
          customDiscountPercent: canSetCustomMarkdown
            ? customDiscountPercent
            : null,
        },
        discounts,
        applyYearDiscount,
      )
    : 0;
  const unitPrice = showPrice
    ? resolveLineUnitPrice(
        product,
        modificationId,
        condition,
        discountPercent,
        yearPeriodId,
        applyYearDiscount,
        canSetCustomMarkdown,
      )
    : 0;
  const previewQuantity = parseQuantityInput(quantityInput, gramMode) ?? 0;
  const lineTotal = computeLineTotal(unitPrice, previewQuantity, product);

  const close = useCallback(
    (fromPopState = false) => {
      setIsOpen(false);
      setAddedLines([]);
      if (fromPopState) {
        pushedRef.current = false;
        closingFromPopRef.current = false;
        onClose?.();
        return;
      }
      if (pushedRef.current && !closingFromPopRef.current) {
        pushedRef.current = false;
        window.history.back();
        onClose?.();
        return;
      }
      pushedRef.current = false;
      onClose?.();
    },
    [onClose],
  );

  const open = () => {
    setCondition(showConditionPicker ? null : defaultCondition(product));
    setYearPeriodId(showYearPicker ? null : "until1990");
    setCustomMarkdownEnabled(false);
    setCustomDiscountInput("");
    setQuantityInput("");
    setModificationId(defaultModificationId(product));
    setAddedLines([]);
    setConditionError(false);
    setYearError(false);
    setQuantityError(false);
    setIsOpen(true);
    window.history.pushState({ calcModal: true }, "");
    pushedRef.current = true;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!pushedRef.current) {
      window.history.pushState({ calcModal: true }, "");
      pushedRef.current = true;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const handlePopState = () => {
      closingFromPopRef.current = true;
      close(true);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (addedLines.length === 0) return;
    addedListEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [addedLines.length]);

  if (!shouldShowCalculator(product)) {
    return null;
  }

  const requireGates = (): boolean => {
    if (showConditionPicker && condition === null) {
      setConditionError(true);
      setYearError(false);
      setQuantityError(false);
      return false;
    }
    if (showYearPicker && yearPeriodId === null) {
      setYearError(true);
      setConditionError(false);
      setQuantityError(false);
      return false;
    }
    return true;
  };

  const resetAfterAdd = () => {
    setCondition(showConditionPicker ? null : defaultCondition(product));
    setYearPeriodId(showYearPicker ? null : "until1990");
    setQuantityInput("");
    setConditionError(false);
    setYearError(false);
    setQuantityError(false);
  };

  const handlePlus = () => {
    if (!requireGates()) return;
    setQuantityError(false);
    setQuantityInput((raw) => stepQuantityInput(raw, gramMode, 1));
  };

  const handleMinus = () => {
    if (!requireGates()) return;
    setQuantityInput((raw) => stepQuantityInput(raw, gramMode, -1));
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    if (!requireGates()) return;

    const quantity = parseQuantityInput(quantityInput, gramMode);
    if (quantity === null) {
      setQuantityError(true);
      return;
    }

    const resolvedCondition = condition ?? defaultCondition(product);
    const resolvedYear = yearPeriodId ?? "until1990";

    const modificationName =
      product.modifications.find((mod) => mod.id === modificationId)?.name ??
      null;

    let lineCustomDiscount: number | null;
    if (isAdmin) {
      lineCustomDiscount = canSetCustomMarkdown
        ? clampDiscountPercent(customDiscountPercent)
        : null;
    } else if (editLine) {
      lineCustomDiscount = editLine.customDiscountPercent;
    } else {
      lineCustomDiscount = null;
    }

    const payload = {
      productId: product.id,
      modificationId,
      condition: resolvedCondition,
      yearPeriodId: resolvedYear,
      quantity,
      customDiscountPercent: lineCustomDiscount,
    };

    if (editLine) {
      replaceLine(editLine.lineId, payload);
      close();
      return;
    }

    addLine(payload);

    addedIdRef.current += 1;
    setAddedLines((prev) => [
      ...prev,
      {
        id: addedIdRef.current,
        quantity,
        condition: resolvedCondition,
        yearPeriodId: resolvedYear,
        customDiscountPercent: lineCustomDiscount,
        modificationName,
      },
    ]);
    resetAfterAdd();
  };

  return (
    <>
      {isEditing ? null : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            open();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[var(--accent-500)] text-[var(--accent-700)] bg-white hover:bg-[var(--accent-50)] rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <ClipboardList className="w-4 h-4" />
          Добавить в опись
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => close()}
          />

          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-[fadeIn_0.2s_ease-out] font-semibold">
            <button
              type="button"
              onClick={() => close()}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-[var(--gray-500)]" />
            </button>

            <div className="p-6">
              <h2 className="text-xl font-extrabold text-[var(--gray-900)] mb-1 pr-8">
                {isEditing ? "Изменить позицию" : "В опись"}
              </h2>
              <p className="text-sm font-bold text-[var(--gray-800)] mb-1">
                {product.name}
              </p>
              <p className="text-xs font-semibold text-[var(--gray-600)] mb-5">
                {isEditing
                  ? "Изменения сохранятся в этой строке описи."
                  : "Каждый год и состояние — отдельная строка. Можно добавить несколько вариантов этой детали."}
              </p>

              {needsMod && (
                <fieldset className="mb-4">
                  <legend className="text-sm font-bold text-[var(--gray-800)] mb-2">
                    {product.modLabel || "Модификация"}
                  </legend>
                  <select
                    value={modificationId ?? ""}
                    onChange={(e) =>
                      setModificationId(e.target.value || null)
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--gray-300)] bg-white text-[var(--gray-900)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                  >
                    <option value="">
                      Выберите {product.modLabel.toLowerCase()}
                    </option>
                    {product.modifications.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              {showConditionPicker && (
                <fieldset className="mb-4">
                  <legend className="text-sm font-bold text-[var(--gray-800)] mb-2">
                    Состояние
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCondition("new");
                        setConditionError(false);
                      }}
                      className={`px-3 py-2.5 rounded-lg font-bold border transition-colors ${
                        condition === "new"
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      Новые
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCondition("used");
                        setConditionError(false);
                      }}
                      className={`px-3 py-2.5 rounded-lg font-bold border transition-colors ${
                        condition === "used"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      Б/У
                    </button>
                  </div>
                  {conditionError ? (
                    <p
                      className="mt-2 text-sm font-semibold text-red-600"
                      aria-live="polite"
                    >
                      Выберите состояние детали
                    </p>
                  ) : null}
                </fieldset>
              )}

              {showYearPicker ? (
                <fieldset className="mb-4">
                  <legend className="text-sm font-bold text-[var(--gray-800)] mb-2">
                    Год выпуска
                  </legend>
                  {!applyYearDiscount ? (
                    <p className="text-xs font-semibold text-[var(--gray-600)] mb-2">
                      Для проверки по паспорту, на цену не влияет
                    </p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2">
                    {YEAR_PERIODS.map((period) => {
                      const percent = getDiscountPercent(discounts, period.id);
                      const selected = yearPeriodId === period.id;
                      return (
                        <button
                          key={period.id}
                          type="button"
                          onClick={() => {
                            if (showConditionPicker && condition === null) {
                              setConditionError(true);
                              setYearError(false);
                              return;
                            }
                            setYearPeriodId(period.id);
                            setYearError(false);
                          }}
                          className={`px-3 py-2.5 rounded-lg font-bold border text-sm transition-colors ${
                            selected
                              ? "bg-[var(--primary-600)] border-[var(--primary-600)] text-white"
                              : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                          }`}
                        >
                          <span className="block">{period.label}</span>
                          {applyYearDiscount ? (
                            <span
                              className={`block text-xs font-semibold mt-0.5 ${
                                selected
                                  ? "text-white/80"
                                  : "text-[var(--gray-500)]"
                              }`}
                            >
                              {percent > 0 ? `−${percent}%` : "Без уценки"}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {yearError ? (
                    <p
                      className="mt-2 text-sm font-semibold text-red-600"
                      aria-live="polite"
                    >
                      Выберите год выпуска
                    </p>
                  ) : null}
                </fieldset>
              ) : null}

              {isAdmin ? (
                <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (customMarkdownEnabled) {
                          setCustomMarkdownEnabled(false);
                          return;
                        }
                        setCustomDiscountInput("");
                        setCustomMarkdownEnabled(true);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg font-bold border text-sm transition-colors ${
                        customMarkdownEnabled
                          ? "bg-[var(--primary-600)] border-[var(--primary-600)] text-white"
                          : "bg-white border-[var(--gray-300)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                      }`}
                    >
                      <span className="block">Уценка</span>
                      <span
                        className={`block text-xs font-semibold mt-0.5 ${
                          customMarkdownEnabled
                            ? "text-white/80"
                            : "text-[var(--gray-500)]"
                        }`}
                      >
                        {customMarkdownEnabled
                          ? `−${clampDiscountPercent(customDiscountPercent)}%`
                          : "свой процент"}
                      </span>
                    </button>
                    {customMarkdownEnabled ? (
                      <label className="mt-2 block">
                        <span className="sr-only">Процент уценки</span>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            enterKeyHint="done"
                            autoComplete="off"
                            value={customDiscountInput}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setCustomDiscountInput("");
                                return;
                              }
                              if (!isMarkdownPercentDraft(raw)) return;
                              const value = Number(raw.replace(",", "."));
                              if (
                                raw !== "." &&
                                raw !== "," &&
                                Number.isFinite(value) &&
                                value > 100
                              ) {
                                setCustomDiscountInput("100");
                                return;
                              }
                              setCustomDiscountInput(raw);
                            }}
                            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[var(--gray-300)] bg-white text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-600)]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--gray-500)]">
                            %
                          </span>
                        </div>
                      </label>
                    ) : null}
                </div>
              ) : null}

              <fieldset className="mb-5">
                <legend className="text-sm font-bold text-[var(--gray-800)] mb-2">
                  {gramMode ? "Количество, г" : "Количество"}
                </legend>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMinus}
                    disabled={!gatesReady}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Уменьшить"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={!gatesReady}
                    value={quantityInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!isQuantityDraft(raw, gramMode)) return;
                      setQuantityInput(raw);
                      setQuantityError(false);
                    }}
                    className="flex-1 h-10 text-center font-bold rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] disabled:bg-[var(--gray-100)] disabled:text-[var(--gray-400)] disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handlePlus}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)]"
                    aria-label="Увеличить"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {quantityError ? (
                  <p
                    className="mt-2 text-sm font-semibold text-red-600"
                    aria-live="polite"
                  >
                    Укажите количество
                  </p>
                ) : null}
              </fieldset>

              <div className="mb-5 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-200)] px-4 py-3">
                {showPrice ? (
                  <>
                    <div className="flex justify-between text-sm font-semibold text-[var(--gray-700)]">
                      <span>Цена за ед.</span>
                      <span className="font-bold text-[var(--gray-900)] tabular-nums">
                        {formatPrice(unitPrice)}
                        {suffix}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-bold text-[var(--gray-800)]">
                        Сумма позиции
                      </span>
                      <span className="text-lg font-extrabold text-[var(--accent-600)] tabular-nums">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--gray-500)]">
                    {!canSubmit
                      ? `Выберите ${product.modLabel.toLowerCase()}, чтобы увидеть цену`
                      : "Укажите параметры позиции, чтобы увидеть цену"}
                  </p>
                )}
              </div>

              {!isEditing && addedLines.length > 0 && (
                <div className="mb-3 space-y-2" aria-live="polite">
                  {addedLines.map((item, index) => (
                    <p
                      key={item.id}
                      className="text-sm font-semibold text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                    >
                      {formatAddedSummary(item, product, index)}
                    </p>
                  ))}
                  <div ref={addedListEndRef} />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:bg-[var(--gray-300)] disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
                >
                  {isEditing
                    ? "Сохранить"
                    : addedLines.length > 0
                      ? "Добавить ещё вариант этой детали"
                      : "Добавить в опись"}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => close()}
                    className="w-full px-4 py-2.5 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-800)] rounded-lg font-bold transition-colors"
                  >
                    Назад
                  </button>
                ) : addedLines.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => close()}
                      className="w-full px-4 py-2.5 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-800)] rounded-lg font-bold transition-colors"
                    >
                      Готово
                    </button>
                    <Link
                      href="/cart"
                      onClick={() => {
                        pushedRef.current = false;
                        setIsOpen(false);
                        setAddedLines([]);
                      }}
                      className="w-full text-center text-sm font-bold text-[var(--primary-700)] hover:text-[var(--primary-800)] py-1"
                    >
                      Открыть опись
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => close()}
                    className="w-full px-4 py-2.5 border border-[var(--gray-300)] hover:bg-[var(--gray-50)] text-[var(--gray-800)] rounded-lg font-bold transition-colors"
                  >
                    Назад
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
