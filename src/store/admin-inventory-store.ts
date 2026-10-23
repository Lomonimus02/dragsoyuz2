"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { restoreManualInventory, validateManualInventoryInput, type ManualInventoryInput, type ManualInventoryLine } from "@/lib/manual-inventory";

interface AdminInventoryState {
  lines: ManualInventoryLine[];
  hasHydrated: boolean;
  saveLine: (id: string | null, input: ManualInventoryInput) => void;
  updateLineQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clear: () => void;
}

// Kept separately from customer inventory; only rendered for an authenticated admin.
export const useAdminInventoryStore = create<AdminInventoryState>()(persist((set) => ({
  lines: [], hasHydrated: false,
  saveLine: (id, input) => set((state) => ({
    lines: id
      ? state.lines.map((line) => line.id === id ? { ...input, id } : line)
      : [...state.lines, { ...input, id: crypto.randomUUID() }],
  })),
  updateLineQuantity: (id, quantity) => set((state) => {
    if (!Number.isFinite(quantity)) return state;
    if (quantity <= 0) return { lines: state.lines.filter((line) => line.id !== id) };
    return { lines: state.lines.map((line) => {
      if (line.id !== id) return line;
      const result = validateManualInventoryInput({ ...line, quantity });
      return result.success ? { ...result.data, id } : line;
    }) };
  }),
  removeLine: (id) => set((state) => ({ lines: state.lines.filter((line) => line.id !== id) })),
  clear: () => set({ lines: [] }),
}), {
  name: "radioklad-admin-inventory-v1",
  skipHydration: true,
  partialize: (state) => ({ lines: state.lines }),
  merge: (persisted, current) => ({
    ...current,
    lines: restoreManualInventory((persisted as { lines?: unknown } | null)?.lines),
  }),
  onRehydrateStorage: () => () => useAdminInventoryStore.setState({ hasHydrated: true }),
}));
