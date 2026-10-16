"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clampDiscountPercent,
  type YearPeriodId,
} from "@/lib/year-discount";

export type ItemCondition = "new" | "used";
export type { YearPeriodId };

export interface InventoryLine {
  lineId: string;
  productId: string;
  modificationId: string | null;
  condition: ItemCondition;
  yearPeriodId: YearPeriodId;
  quantity: number;
  customDiscountPercent: number | null;
}

export type AddLineInput = Omit<InventoryLine, "lineId">;

interface CartState {
  items: InventoryLine[];
  hasHydrated: boolean;

  addLine: (payload: AddLineInput) => void;
  replaceLine: (lineId: string, payload: AddLineInput) => void;
  removeLine: (lineId: string) => void;
  updateLineQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getLineCount: () => number;
  getTotalPieces: () => number;
}

function normalizeQuantity(quantity: number): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const rounded = Math.round(quantity * 10) / 10;
  if (rounded <= 0) return null;
  return rounded;
}

function normalizeCustomDiscountPercent(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return clampDiscountPercent(value);
}

function normalizeLine(line: InventoryLine): InventoryLine {
  return {
    ...line,
    customDiscountPercent: normalizeCustomDiscountPercent(
      line.customDiscountPercent,
    ),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addLine: (payload) => {
        const quantity = normalizeQuantity(payload.quantity);
        if (quantity === null) return;

        const line: InventoryLine = {
          lineId: crypto.randomUUID(),
          productId: payload.productId,
          modificationId: payload.modificationId,
          condition: payload.condition,
          yearPeriodId: payload.yearPeriodId,
          quantity,
          customDiscountPercent: normalizeCustomDiscountPercent(
            payload.customDiscountPercent,
          ),
        };

        set((state) => ({
          items: [...state.items, line],
        }));
      },

      replaceLine: (lineId, payload) => {
        const quantity = normalizeQuantity(payload.quantity);
        if (quantity === null) return;

        const next: InventoryLine = {
          lineId,
          productId: payload.productId,
          modificationId: payload.modificationId,
          condition: payload.condition,
          yearPeriodId: payload.yearPeriodId,
          quantity,
          customDiscountPercent: normalizeCustomDiscountPercent(
            payload.customDiscountPercent,
          ),
        };

        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? next : item,
          ),
        }));
      },

      removeLine: (lineId) => {
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        }));
      },

      updateLineQuantity: (lineId, quantity) => {
        set((state) => {
          const normalized = normalizeQuantity(quantity);
          if (normalized === null) {
            return {
              items: state.items.filter((item) => item.lineId !== lineId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.lineId === lineId
                ? { ...item, quantity: normalized }
                : item,
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getLineCount: () => get().items.length,

      getTotalPieces: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "scrap-inventory-v2",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CartState> | undefined;
        const items = Array.isArray(persisted?.items)
          ? persisted.items.map((line) => normalizeLine(line as InventoryLine))
          : currentState.items;
        return { ...currentState, ...persisted, items };
      },
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hasHydrated: true });
      },
    },
  ),
);
