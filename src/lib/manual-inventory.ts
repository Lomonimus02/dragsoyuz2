export type ManualInventoryUnit = "PIECE" | "GRAM" | "KG";
export type ManualInventoryCondition = "new" | "used" | "unspecified";

export interface ManualInventoryInput {
  name: string;
  year: string;
  condition: ManualInventoryCondition;
  unit: ManualInventoryUnit;
  quantity: number;
  unitPrice: number;
}

export interface ManualInventoryLine extends ManualInventoryInput {
  id: string;
}

export function validateManualInventoryInput(input: unknown):
  | { success: true; data: ManualInventoryInput }
  | { success: false; error: string } {
  if (!input || typeof input !== "object") return { success: false, error: "Заполните поля позиции" };
  const data = input as Record<string, unknown>;
  if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 200) {
    return { success: false, error: "Введите наименование — до 200 символов" };
  }
  if (typeof data.year !== "string" || data.year.trim().length > 40) {
    return { success: false, error: "Год выпуска — до 40 символов" };
  }
  if (typeof data.unit !== "string" || !["PIECE", "GRAM", "KG"].includes(data.unit) ||
      typeof data.condition !== "string" || !["new", "used", "unspecified"].includes(data.condition)) {
    return { success: false, error: "Выберите единицу измерения и состояние" };
  }
  if (typeof data.quantity !== "number" || !Number.isFinite(data.quantity) || data.quantity <= 0 || data.quantity > 1_000_000 ||
      (data.unit === "PIECE" && !Number.isInteger(data.quantity)) ||
      Math.abs(data.quantity * 1000 - Math.round(data.quantity * 1000)) > 0.00001) {
    return { success: false, error: "Укажите положительное количество: целое для штук, до трёх знаков после запятой для веса" };
  }
  if (typeof data.unitPrice !== "number" || !Number.isFinite(data.unitPrice) || data.unitPrice < 0 || data.unitPrice > 1_000_000_000 ||
      Math.abs(data.unitPrice * 100 - Math.round(data.unitPrice * 100)) > 0.00001 || data.quantity * data.unitPrice > 1_000_000_000_000) {
    return { success: false, error: "Укажите цену от 0 до 1 000 000 000 ₽, не более двух знаков после запятой" };
  }
  return { success: true, data: {
    name: data.name.trim(), year: data.year.trim(),
    condition: data.condition as ManualInventoryCondition,
    unit: data.unit as ManualInventoryUnit,
    quantity: data.quantity, unitPrice: Math.round(data.unitPrice * 100) / 100,
  } };
}

export function manualInventoryTotal(line: ManualInventoryInput): number {
  return Math.round(Math.round(line.unitPrice * 100) * line.quantity) / 100;
}

export function manualUnitLabel(unit: ManualInventoryUnit): string {
  return unit === "PIECE" ? "шт." : unit === "KG" ? "кг" : "г";
}

export function formatManualQuantity(line: ManualInventoryInput): string {
  return `${line.quantity.toLocaleString("ru-RU", { maximumFractionDigits: 3 })} ${manualUnitLabel(line.unit)}`;
}

export function restoreManualInventory(value: unknown): ManualInventoryLine[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((line) => {
    const result = validateManualInventoryInput(line);
    if (!result.success || typeof line.id !== "string" || !line.id || line.id.length > 100 || ids.has(line.id)) return [];
    ids.add(line.id);
    return [{ ...result.data, id: line.id }];
  });
}
