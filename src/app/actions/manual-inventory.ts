"use server";

import { isAuthenticated } from "./auth";
import { validateManualInventoryInput } from "@/lib/manual-inventory";

export async function prepareManualInventoryLine(input: unknown) {
  if (!(await isAuthenticated())) {
    return { success: false as const, error: "Для ручного редактирования войдите в аккаунт администратора" };
  }
  return validateManualInventoryInput(input);
}
