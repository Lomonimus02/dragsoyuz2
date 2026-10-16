"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { CategoryBannerAlign, CategoryBannerTheme } from "@prisma/client";
import { normalizeBannerTextColor } from "@/lib/category-banner";
import { applyHundredPrice } from "@/lib/hundred-price";
import {
  normalizeInfoPageButtonColor,
  parseInfoPageBlocks,
  type CategoryInfoBlock,
} from "@/lib/category-info";

// ============================================================================
// ТИПЫ
// ============================================================================

function pickBannerFields(category: {
  bannerEnabled: boolean;
  bannerTitle: string | null;
  bannerText: string | null;
  bannerAlign: CategoryBannerAlign;
  bannerTheme: CategoryBannerTheme;
  bannerImageUrl: string | null;
  bannerLinkUrl: string | null;
  bannerLinkLabel: string | null;
  bannerTextColor: string | null;
  bannerTitleLines: boolean;
  bannerShowGuide: boolean;
}) {
  return {
    bannerEnabled: category.bannerEnabled,
    bannerTitle: category.bannerTitle,
    bannerText: category.bannerText,
    bannerAlign: category.bannerAlign,
    bannerTheme: category.bannerTheme,
    bannerImageUrl: category.bannerImageUrl,
    bannerLinkUrl: category.bannerLinkUrl,
    bannerLinkLabel: category.bannerLinkLabel,
    bannerTextColor: category.bannerTextColor,
    bannerTitleLines: category.bannerTitleLines,
    bannerShowGuide: category.bannerShowGuide,
  };
}

function pickBannerInput(input: {
  bannerEnabled?: boolean;
  bannerTitle?: string | null;
  bannerText?: string | null;
  bannerAlign?: CategoryBannerAlign;
  bannerTheme?: CategoryBannerTheme;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerLinkLabel?: string | null;
  bannerTextColor?: string | null;
  bannerTitleLines?: boolean;
  bannerShowGuide?: boolean;
}) {
  const data: Record<string, unknown> = {};
  if (input.bannerEnabled !== undefined) data.bannerEnabled = input.bannerEnabled;
  if (input.bannerTitle !== undefined) data.bannerTitle = input.bannerTitle?.trim() || null;
  if (input.bannerText !== undefined) data.bannerText = input.bannerText?.trim() || null;
  if (input.bannerAlign !== undefined) data.bannerAlign = input.bannerAlign;
  if (input.bannerTheme !== undefined) data.bannerTheme = input.bannerTheme;
  if (input.bannerImageUrl !== undefined) data.bannerImageUrl = input.bannerImageUrl || null;
  if (input.bannerLinkUrl !== undefined) data.bannerLinkUrl = input.bannerLinkUrl?.trim() || null;
  if (input.bannerLinkLabel !== undefined) data.bannerLinkLabel = input.bannerLinkLabel?.trim() || null;
  if (input.bannerTextColor !== undefined) {
    data.bannerTextColor = normalizeBannerTextColor(input.bannerTextColor);
  }
  if (input.bannerTitleLines !== undefined) data.bannerTitleLines = input.bannerTitleLines;
  if (input.bannerShowGuide !== undefined) data.bannerShowGuide = input.bannerShowGuide;
  return data;
}

function pickInfoPageFields(category: {
  infoPageEnabled: boolean;
  infoPageButtonLabel: string | null;
  infoPageButtonColor: string | null;
  infoPageButtonTextColor: string | null;
  infoPageBlocks: unknown;
}) {
  return {
    infoPageEnabled: category.infoPageEnabled,
    infoPageButtonLabel: category.infoPageButtonLabel,
    infoPageButtonColor: normalizeInfoPageButtonColor(
      category.infoPageButtonColor,
    ),
    infoPageButtonTextColor: normalizeInfoPageButtonColor(
      category.infoPageButtonTextColor,
    ),
    infoPageBlocks: parseInfoPageBlocks(category.infoPageBlocks),
  };
}

function pickInfoPageInput(input: {
  infoPageEnabled?: boolean;
  infoPageButtonLabel?: string | null;
  infoPageButtonColor?: string | null;
  infoPageButtonTextColor?: string | null;
  infoPageBlocks?: CategoryInfoBlock[];
}) {
  const data: Record<string, unknown> = {};
  if (input.infoPageEnabled !== undefined) data.infoPageEnabled = input.infoPageEnabled;
  if (input.infoPageButtonLabel !== undefined) {
    data.infoPageButtonLabel = input.infoPageButtonLabel?.trim() || null;
  }
  if (input.infoPageButtonColor !== undefined) {
    data.infoPageButtonColor = normalizeInfoPageButtonColor(
      input.infoPageButtonColor,
    );
  }
  if (input.infoPageButtonTextColor !== undefined) {
    data.infoPageButtonTextColor = normalizeInfoPageButtonColor(
      input.infoPageButtonTextColor,
    );
  }
  if (input.infoPageBlocks !== undefined) {
    data.infoPageBlocks = parseInfoPageBlocks(
      input.infoPageBlocks,
    ) as Prisma.InputJsonValue;
  }
  return data;
}

/**
 * Ð”Ð°Ð½Ð½Ñ‹Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð´Ð»Ñ API
 */
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  sortOrder: number;
  childSortOrder: number;
  warningMessage: string | null;
  bannerEnabled: boolean;
  bannerTitle: string | null;
  bannerText: string | null;
  bannerAlign: CategoryBannerAlign;
  bannerTheme: CategoryBannerTheme;
  bannerImageUrl: string | null;
  bannerLinkUrl: string | null;
  bannerLinkLabel: string | null;
  bannerTextColor: string | null;
  bannerTitleLines: boolean;
  bannerShowGuide: boolean;
  infoPageEnabled: boolean;
  infoPageButtonLabel: string | null;
  infoPageButtonColor: string | null;
  infoPageButtonTextColor: string | null;
  infoPageBlocks: CategoryInfoBlock[];
  isPinnedToDashboard: boolean;
  customRateAu: number | null;
  customRateAg: number | null;
  customRatePt: number | null;
  customRatePd: number | null;
  customRateTa: number | null;
  productCount: number;
  childrenCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ð’Ñ…Ð¾Ð´Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð´Ð»Ñ ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
 */
export interface CreateCategoryInput {
  name: string;
  slug: string;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  childSortOrder?: number;
  warningMessage?: string | null;
  bannerEnabled?: boolean;
  bannerTitle?: string | null;
  bannerText?: string | null;
  bannerAlign?: CategoryBannerAlign;
  bannerTheme?: CategoryBannerTheme;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerLinkLabel?: string | null;
  bannerTextColor?: string | null;
  bannerTitleLines?: boolean;
  bannerShowGuide?: boolean;
  infoPageEnabled?: boolean;
  infoPageButtonLabel?: string | null;
  infoPageButtonColor?: string | null;
  infoPageButtonTextColor?: string | null;
  infoPageBlocks?: CategoryInfoBlock[];
  isPinnedToDashboard?: boolean;
  customRateAu?: number | null;
  customRateAg?: number | null;
  customRatePt?: number | null;
  customRatePd?: number | null;
  customRateTa?: number | null;
}

/**
 * Ð’Ñ…Ð¾Ð´Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð´Ð»Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
 */
export interface UpdateCategoryInput {
  id: string;
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  childSortOrder?: number;
  warningMessage?: string | null;
  bannerEnabled?: boolean;
  bannerTitle?: string | null;
  bannerText?: string | null;
  bannerAlign?: CategoryBannerAlign;
  bannerTheme?: CategoryBannerTheme;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  bannerLinkLabel?: string | null;
  bannerTextColor?: string | null;
  bannerTitleLines?: boolean;
  bannerShowGuide?: boolean;
  infoPageEnabled?: boolean;
  infoPageButtonLabel?: string | null;
  infoPageButtonColor?: string | null;
  infoPageButtonTextColor?: string | null;
  infoPageBlocks?: CategoryInfoBlock[];
  isPinnedToDashboard?: boolean;
  customRateAu?: number | null;
  customRateAg?: number | null;
  customRatePt?: number | null;
  customRatePd?: number | null;
  customRateTa?: number | null;
}

/**
 * Ð ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚ Ð¾Ð¿ÐµÑ€Ð°Ñ†Ð¸Ð¸ ÑÐ¾ ÑÐ¿Ð¸ÑÐºÐ¾Ð¼ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹
 */
export type CategoriesResult =
  | { success: true; data: CategoryData[]; total: number }
  | { success: false; error: string };

/**
 * Ð ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚ Ð¾Ð¿ÐµÑ€Ð°Ñ†Ð¸Ð¸ Ñ Ð¾Ð´Ð½Ð¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÐµÐ¹
 */
export type CategoryResult =
  | { success: true; data: CategoryData }
  | { success: false; error: string };

/**
 * Ð ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚ Ð¾Ð¿ÐµÑ€Ð°Ñ†Ð¸Ð¸ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ñ
 */
export type DeleteCategoryResult =
  | { success: true }
  | { success: false; error: string };

/**
 * ÐŸÐµÑ€ÐµÑÑ‡Ð¸Ñ‚Ð°Ñ‚ÑŒ sortOrder Ð´Ð»Ñ Ð²ÑÐµÑ… ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ñ Ð¾Ð´Ð¸Ð½Ð°ÐºÐ¾Ð²Ñ‹Ð¼ parentId Ð¿Ð¾ÑÐ»Ðµ Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ñ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¸ Ð¾Ð´Ð½Ð¾Ð¹
 * @param parentId - ID Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ (null Ð´Ð»Ñ ÐºÐ¾Ñ€Ð½ÐµÐ²Ñ‹Ñ…)
 * @param movedCategoryId - ID Ð¿ÐµÑ€ÐµÐ¼ÐµÑ‰Ñ‘Ð½Ð½Ð¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
 * @param newPosition - Ð½Ð¾Ð²Ð°Ñ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ (1-based)
 */
async function reorderCategoriesByParent(
  parentId: string | null,
  movedCategoryId: string,
  newPosition: number
): Promise<void> {
  // ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÐ¼ Ð²ÑÐµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ñ Ñ‚ÐµÐ¼ Ð¶Ðµ parentId
  const categories = await prisma.category.findMany({
    where: { parentId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  // Ð£Ð´Ð°Ð»ÑÐµÐ¼ Ð¿ÐµÑ€ÐµÐ¼ÐµÑ‰Ð°ÐµÐ¼ÑƒÑŽ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð¸Ð· ÑÐ¿Ð¸ÑÐºÐ°
  const otherCategories = categories.filter(c => c.id !== movedCategoryId);
  
  // Ð’ÑÑ‚Ð°Ð²Ð»ÑÐµÐ¼ ÐµÑ‘ Ð½Ð° Ð½Ð¾Ð²ÑƒÑŽ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸ÑŽ
  const movedCategory = categories.find(c => c.id === movedCategoryId);
  if (!movedCategory) return;

  // ÐšÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð¸Ñ€ÑƒÐµÐ¼ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸ÑŽ Ð² Ð´Ð¾Ð¿ÑƒÑÑ‚Ð¸Ð¼Ñ‹Ñ… Ð³Ñ€Ð°Ð½Ð¸Ñ†Ð°Ñ…
  const clampedPosition = Math.max(1, Math.min(newPosition, categories.length));
  
  // Ð’ÑÑ‚Ð°Ð²Ð»ÑÐµÐ¼ Ð½Ð° Ð½ÑƒÐ¶Ð½ÑƒÑŽ Ð¿Ð¾Ð·Ð¸Ñ†Ð¸ÑŽ
  otherCategories.splice(clampedPosition - 1, 0, movedCategory);

  // ÐžÐ±Ð½Ð¾Ð²Ð»ÑÐµÐ¼ sortOrder Ð´Ð»Ñ Ð²ÑÐµÑ…
  const updates = otherCategories.map((category, index) => 
    prisma.category.update({
      where: { id: category.id },
      data: { sortOrder: index + 1 },
    })
  );

  await Promise.all(updates);
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÑÐ¿Ð¸ÑÐ¾Ðº ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹
 * @param rootOnly - ÐµÑÐ»Ð¸ true, Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÐºÐ¾Ñ€Ð½ÐµÐ²Ñ‹Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ (Ð±ÐµÐ· Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹)
 */
export async function getCategories(rootOnly: boolean = false): Promise<CategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      where: rootOnly ? { parentId: null } : undefined,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
        // Ð’ÐºÐ»ÑŽÑ‡Ð°ÐµÐ¼ Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð´Ð»Ñ Ð¿Ð¾Ð´ÑÑ‡Ñ‘Ñ‚Ð° Ð¸Ñ… Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð²
        children: {
          select: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: rootOnly 
        ? { sortOrder: "asc" } 
        : [{ parentId: "asc" }, { sortOrder: "asc" }],
    });

    const data: CategoryData[] = categories.map((cat) => {
      // Ð¡Ñ‡Ð¸Ñ‚Ð°ÐµÐ¼ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð² ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ + Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð²Ð¾ Ð²ÑÐµÑ… Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑÑ…
      const ownProducts = cat._count.products;
      const childrenProducts = cat.children?.reduce(
        (sum, child) => sum + child._count.products, 
        0
      ) ?? 0;
      
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId,
        parentName: cat.parent?.name ?? null,
        sortOrder: cat.sortOrder,
        childSortOrder: cat.childSortOrder,
        warningMessage: cat.warningMessage,
        ...pickBannerFields(cat),
        ...pickInfoPageFields(cat),
        isPinnedToDashboard: cat.isPinnedToDashboard,
        customRateAu: cat.customRateAu,
        customRateAg: cat.customRateAg,
        customRatePt: cat.customRatePt,
        customRatePd: cat.customRatePd,
      customRateTa: cat.customRateTa,
        productCount: ownProducts + childrenProducts,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    return {
      success: true,
      data,
      total: categories.length,
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð¿Ð¾ slug
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryResult> {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
    }

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        childSortOrder: category.childSortOrder,
        warningMessage: category.warningMessage,
        ...pickBannerFields(category),
        ...pickInfoPageFields(category),
        isPinnedToDashboard: category.isPinnedToDashboard,
        customRateAu: category.customRateAu,
        customRateAg: category.customRateAg,
        customRatePt: category.customRatePt,
        customRatePd: category.customRatePd,
        customRateTa: category.customRateTa,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ Ð¿Ð¾ ID
 */
export async function getCategoryById(id: string): Promise<CategoryResult> {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
    }

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        childSortOrder: category.childSortOrder,
        warningMessage: category.warningMessage,
        ...pickBannerFields(category),
        ...pickInfoPageFields(category),
        isPinnedToDashboard: category.isPinnedToDashboard,
        customRateAu: category.customRateAu,
        customRateAg: category.customRateAg,
        customRatePt: category.customRatePt,
        customRatePd: category.customRatePd,
        customRateTa: category.customRateTa,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<CategoryResult> {
  try {
    if (!input.name?.trim()) {
      return { success: false, error: "ÐÐ°Ð·Ð²Ð°Ð½Ð¸Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾" };
    }

    if (!input.slug?.trim()) {
      return { success: false, error: "Slug ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÐµÐ½" };
    }

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð¾ÑÑ‚ÑŒ slug
    const existing = await prisma.category.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ñ Ñ‚Ð°ÐºÐ¸Ð¼ slug ÑƒÐ¶Ðµ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚" };
    }

    // Ð•ÑÐ»Ð¸ ÐµÑÑ‚ÑŒ parentId â€” Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ ÑÑƒÑ‰ÐµÑÑ‚Ð²Ð¾Ð²Ð°Ð½Ð¸Ðµ Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»Ñ
    if (input.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        return { success: false, error: "Ð Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ°Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
      }
    }

    // ÐÐ²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ sortOrder ÐµÑÐ»Ð¸ Ð½Ðµ ÑƒÐºÐ°Ð·Ð°Ð½ Ð¸Ð»Ð¸ Ñ€Ð°Ð²ÐµÐ½ 0
    let sortOrder = input.sortOrder;
    if (!sortOrder || sortOrder <= 0) {
      // ÐÐ°Ñ…Ð¾Ð´Ð¸Ð¼ Ð¼Ð°ÐºÑÐ¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹ sortOrder ÑÑ€ÐµÐ´Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ñ Ñ‚ÐµÐ¼ Ð¶Ðµ parentId
      const maxSortOrderResult = await prisma.category.aggregate({
        where: { parentId: input.parentId ?? null },
        _max: { sortOrder: true },
      });
      // ÐÐ¾Ð²Ð°Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð¿Ð¾Ð»ÑƒÑ‡Ð°ÐµÑ‚ sortOrder = max + 1 (Ð¸Ð»Ð¸ 1 ÐµÑÐ»Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð½ÐµÑ‚)
      sortOrder = (maxSortOrderResult._max.sortOrder ?? 0) + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        imageUrl: input.imageUrl ?? null,
        parentId: input.parentId ?? null,
        sortOrder,
        childSortOrder: input.childSortOrder ?? 0,
        warningMessage: input.warningMessage?.trim() || null,
        ...pickBannerInput(input),
        ...pickInfoPageInput(input),
        isPinnedToDashboard: input.isPinnedToDashboard ?? false,
        // ÐšÐ°ÑÑ‚Ð¾Ð¼Ð½Ñ‹Ðµ ÐºÑƒÑ€ÑÑ‹: ÐµÑÐ»Ð¸ Ð¿ÑƒÑÑ‚Ð¾Ðµ/undefined â€” Ð¿Ð¸ÑˆÐµÐ¼ null
        customRateAu: input.customRateAu ?? null,
        customRateAg: input.customRateAg ?? null,
        customRatePt: input.customRatePt ?? null,
        customRatePd: input.customRatePd ?? null,
        customRateTa: input.customRateTa ?? null,
      },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        childSortOrder: category.childSortOrder,
        warningMessage: category.warningMessage,
        ...pickBannerFields(category),
        ...pickInfoPageFields(category),
        isPinnedToDashboard: category.isPinnedToDashboard,
        customRateAu: category.customRateAu,
        customRateAg: category.customRateAg,
        customRatePt: category.customRatePt,
        customRatePd: category.customRatePd,
        customRateTa: category.customRateTa,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ
 */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<CategoryResult> {
  try {
    if (!input.id) {
      return { success: false, error: "ID ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÐµÐ½" };
    }

    const existing = await prisma.category.findUnique({
      where: { id: input.id },
    });

    if (!existing) {
      return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
    }

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð¾ÑÑ‚ÑŒ slug
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (slugExists) {
        return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ñ Ñ‚Ð°ÐºÐ¸Ð¼ slug ÑƒÐ¶Ðµ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚" };
      }
    }

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»Ñ
    if (input.parentId) {
      if (input.parentId === input.id) {
        return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÐµÐ¼ ÑÐ°Ð¼Ð¾Ð¹ ÑÐµÐ±Ñ" };
      }
      const parent = await prisma.category.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        return { success: false, error: "Ð Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ°Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
      }
    }

    // Ð¤Ð¾Ñ€Ð¼Ð¸Ñ€ÑƒÐµÐ¼ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð´Ð»Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ
    const updateData: {
      name?: string;
      slug?: string;
      imageUrl?: string | null;
      warningMessage?: string | null;
      isPinnedToDashboard?: boolean;
      childSortOrder?: number;
      customRateAu?: number | null;
      customRateAg?: number | null;
      customRatePt?: number | null;
      customRatePd?: number | null;
  customRateTa?: number | null;
      parent?: { connect: { id: string } } | { disconnect: true };
    } = {};
    
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
    if (input.warningMessage !== undefined) updateData.warningMessage = input.warningMessage?.trim() || null;
    if (input.isPinnedToDashboard !== undefined) updateData.isPinnedToDashboard = input.isPinnedToDashboard;
    if (input.childSortOrder !== undefined) updateData.childSortOrder = input.childSortOrder;
    // ÐšÐ°ÑÑ‚Ð¾Ð¼Ð½Ñ‹Ðµ ÐºÑƒÑ€ÑÑ‹: ÐµÑÐ»Ð¸ Ð¿Ð¾Ð»Ðµ Ð¿ÐµÑ€ÐµÐ´Ð°Ð½Ð¾ â€” Ð¾Ð±Ð½Ð¾Ð²Ð»ÑÐµÐ¼ (Ð²ÐºÐ»ÑŽÑ‡Ð°Ñ null Ð´Ð»Ñ ÑÐ±Ñ€Ð¾ÑÐ°)
    if (input.customRateAu !== undefined) updateData.customRateAu = input.customRateAu;
    if (input.customRateAg !== undefined) updateData.customRateAg = input.customRateAg;
    if (input.customRatePt !== undefined) updateData.customRatePt = input.customRatePt;
    if (input.customRatePd !== undefined) updateData.customRatePd = input.customRatePd;
    if (input.customRateTa !== undefined) updateData.customRateTa = input.customRateTa;
    Object.assign(updateData, pickBannerInput(input), pickInfoPageInput(input));
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        updateData.parent = { disconnect: true };
      } else {
        updateData.parent = { connect: { id: input.parentId } };
      }
    }
    // sortOrder Ð¾Ð±Ñ€Ð°Ð±Ð°Ñ‚Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð¾ Ñ‡ÐµÑ€ÐµÐ· reorder

    const category = await prisma.category.update({
      where: { id: input.id },
      data: updateData,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
    });

    // Ð•ÑÐ»Ð¸ Ð¸Ð·Ð¼ÐµÐ½Ð¸Ð»ÑÑ sortOrder â€” Ð¿ÐµÑ€ÐµÑÑ‡Ð¸Ñ‚Ñ‹Ð²Ð°ÐµÐ¼ Ð¿Ð¾Ñ€ÑÐ´Ð¾Ðº Ð²ÑÐµÑ… ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ñ Ñ‚ÐµÐ¼ Ð¶Ðµ parentId
    if (input.sortOrder !== undefined && input.sortOrder !== existing.sortOrder) {
      const parentId = input.parentId !== undefined ? input.parentId : existing.parentId;
      await reorderCategoriesByParent(parentId, input.id, input.sortOrder);
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl,
        parentId: category.parentId,
        parentName: category.parent?.name ?? null,
        sortOrder: category.sortOrder,
        childSortOrder: category.childSortOrder,
        warningMessage: category.warningMessage,
        ...pickBannerFields(category),
        ...pickInfoPageFields(category),
        isPinnedToDashboard: category.isPinnedToDashboard,
        customRateAu: category.customRateAu,
        customRateAg: category.customRateAg,
        customRatePt: category.customRatePt,
        customRatePd: category.customRatePd,
        customRateTa: category.customRateTa,
        productCount: category._count.products,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ
 */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  try {
    if (!id) {
      return { success: false, error: "ID ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÐµÐ½" };
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      return { success: false, error: "ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°" };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `ÐÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑŽ: Ð² Ð½ÐµÐ¹ ${category._count.products} Ñ‚Ð¾Ð²Ð°Ñ€(Ð¾Ð²)`,
      };
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error: `Невозможно удалить категорию: в ней ${category._count.children} подкатегори${category._count.children === 1 ? 'я' : 'й'}`
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

// ============================================================================
// Ð’Ð˜Ð¢Ð Ð˜ÐÐ ÐšÐÐ¢Ð•Ð“ÐžÐ Ð˜Ð™ (Ð´Ð»Ñ Ð³Ð»Ð°Ð²Ð½Ð¾Ð¹ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹)
// ============================================================================

/**
 * Ð”Ð°Ð½Ð½Ñ‹Ðµ Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ñ‹ Ð´Ð»Ñ Ð³Ð»Ð°Ð²Ð½Ð¾Ð¹ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹
 * Ð¡Ð¾Ð´ÐµÑ€Ð¶Ð¸Ñ‚ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸ÑŽ Ð¾ Ð¢ÐžÐ’ÐÐ Ð• (ÑÐ°Ð¼Ð¾Ð¼ Ð´Ð¾Ñ€Ð¾Ð³Ð¾Ð¼ Ð² ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸) + slug ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð´Ð»Ñ ÑÑÑ‹Ð»ÐºÐ¸
 */
export interface CategoryShowcaseItem {
  // Ð”Ð°Ð½Ð½Ñ‹Ðµ Ð¢ÐžÐ’ÐÐ Ð
  id: string;              // id Ñ‚Ð¾Ð²Ð°Ñ€Ð°
  name: string;            // Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ðµ Ñ‚Ð¾Ð²Ð°Ñ€Ð°
  slug: string;            // slug Ñ‚Ð¾Ð²Ð°Ñ€Ð°
  description: string | null; // Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ Ñ‚Ð¾Ð²Ð°Ñ€Ð°
  image: string | null;    // Ñ„Ð¾Ñ‚Ð¾ Ñ‚Ð¾Ð²Ð°Ñ€Ð°
  priceNew: number | null; // Ñ†ÐµÐ½Ð° Ñ‚Ð¾Ð²Ð°Ñ€Ð° (ÐÐ¾Ð²Ñ‹Ð¹)
  priceUsed: number | null;// Ñ†ÐµÐ½Ð° Ñ‚Ð¾Ð²Ð°Ñ€Ð° (Ð‘/Ð£)
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  isSingleType: boolean;   // Ð•Ð´Ð¸Ð½Ð°Ñ Ñ†ÐµÐ½Ð° (Ð±ÐµÐ· Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ñ Ð½Ð° Ð‘/Ð£)
  isPriceOnRequest: boolean; // Ð¦ÐµÐ½Ð° Ð¿Ð¾ Ð·Ð°Ð¿Ñ€Ð¾ÑÑƒ
  unitType: "PIECE" | "GRAM" | "KG"; // Ð•Ð´Ð¸Ð½Ð¸Ñ†Ð° Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¸Ñ
  // Модификации
  hasModifications: boolean;
  modLabel: string;
  modifications: { id: string; name: string; priceNew: number; priceUsed: number }[];
  // Ð”Ð°Ð½Ð½Ñ‹Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð´Ð»Ñ ÑÑÑ‹Ð»ÐºÐ¸
  categorySlug: string;    // slug ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
  categoryName: string;    // Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
}

/**
 * Ð ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚ Ð·Ð°Ð¿Ñ€Ð¾ÑÐ° Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ñ‹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹
 */
export type CategoryShowcaseResult =
  | { success: true; data: CategoryShowcaseItem[] }
  | { success: false; error: string };

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ñƒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð´Ð»Ñ Ð³Ð»Ð°Ð²Ð½Ð¾Ð¹ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñ‹.
 * 
 * ÐÐ»Ð³Ð¾Ñ€Ð¸Ñ‚Ð¼:
 * 1. ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÑ‚ Ð’Ð¡Ð• ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ (Ð¾Ñ‚ÑÐ¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ Ð¿Ð¾ sortOrder asc)
 * 2. Ð”Ð»Ñ ÐšÐÐ–Ð”ÐžÐ™ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð½Ð°Ñ…Ð¾Ð´Ð¸Ñ‚ ÐžÐ”Ð˜Ð Ñ‚Ð¾Ð²Ð°Ñ€ Ñ ÑÐ°Ð¼Ð¾Ð¹ Ð²Ñ‹ÑÐ¾ÐºÐ¾Ð¹ Ñ†ÐµÐ½Ð¾Ð¹ (priceNew desc)
 * 3. ÐŸÑ€Ð¾Ð¿ÑƒÑÐºÐ°ÐµÑ‚ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð±ÐµÐ· Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð²
 * 4. Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð¢ÐžÐ’ÐÐ Ð (Ð½Ð°Ð·Ð²Ð°Ð½Ð¸Ðµ, Ñ„Ð¾Ñ‚Ð¾, Ñ†ÐµÐ½Ð°) + categorySlug Ð´Ð»Ñ ÑÑÑ‹Ð»ÐºÐ¸
 * 
 * @param limit - Ð¼Ð°ÐºÑÐ¸Ð¼Ð°Ð»ÑŒÐ½Ð¾Ðµ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð¾Ð² (Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ 10)
 */
export async function getCategoryShowcase(limit: number = 10): Promise<CategoryShowcaseResult> {
  try {
    // ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÐ¼ ÐºÑƒÑ€ÑÑ‹ Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð² Ð¸ Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ Ð´Ð»Ñ Ñ€Ð°ÑÑ‡Ñ‘Ñ‚Ð° Ñ†ÐµÐ½
    const [metalRates, globalSettings] = await Promise.all([
      prisma.metalRate.findFirst(),
      prisma.globalSettings.findFirst(),
    ]);

    // Ð•ÑÐ»Ð¸ Ð½ÐµÑ‚ ÐºÑƒÑ€ÑÐ¾Ð² Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð², Ñ€Ð°ÑÑ‡Ñ‘Ñ‚ Ñ†ÐµÐ½ Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶ÐµÐ½
    if (!metalRates) {
      return { success: false, error: "ÐšÑƒÑ€ÑÑ‹ Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð² Ð½Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾ÐµÐ½Ñ‹" };
    }

    const markup = globalSettings?.priceMarkup ? Number(globalSettings.priceMarkup) : 1;

    // ÐŸÐ¾Ð»ÑƒÑ‡Ð°ÐµÐ¼ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÐºÐ¾Ñ€Ð½ÐµÐ²Ñ‹Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ñ Ñ‚Ð¾Ð²Ð°Ñ€Ð°Ð¼Ð¸ (Ð²ÐºÐ»ÑŽÑ‡Ð°Ñ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹)
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        // Ð¢Ð¾Ð²Ð°Ñ€Ñ‹ ÑÐ°Ð¼Ð¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            unitType: true,
            // Ð¡Ð¾Ð´ÐµÑ€Ð¶Ð°Ð½Ð¸Ðµ Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð² Ð´Ð»Ñ ÐÐ¾Ð²Ñ‹Ñ…
            contentGold: true,
            contentSilver: true,
            contentPlatinum: true,
            contentPalladium: true,
            contentTantalum: true,
            // Ð¡Ð¾Ð´ÐµÑ€Ð¶Ð°Ð½Ð¸Ðµ Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð² Ð´Ð»Ñ Ð‘/Ð£
            contentGoldUsed: true,
            contentSilverUsed: true,
            contentPlatinumUsed: true,
            contentPalladiumUsed: true,
            contentTantalumUsed: true,
            // Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚ÑŒ
            isNewAvailable: true,
            isUsedAvailable: true,
            isSingleType: true,
            isPriceOnRequest: true,
            isShowcaseFace: true,
            priceMarkup: true,
            priceMarkupUsed: true,
            // Ð ÑƒÑ‡Ð½Ñ‹Ðµ Ñ†ÐµÐ½Ñ‹
            manualPriceNew: true,
            manualPriceUsed: true,
            // Модификации
            hasModifications: true,
            modLabel: true,
            modifications: true,
          },
        },
        // Подкатегории с их товарами и кастомными курсами
        children: {
          select: {
            slug: true,
            name: true,
            customRateAu: true,
            customRateAg: true,
            customRatePt: true,
            customRatePd: true,
            customRateTa: true,
            products: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                unitType: true,
                contentGold: true,
                contentSilver: true,
                contentPlatinum: true,
                contentPalladium: true,
            contentTantalum: true,
                contentGoldUsed: true,
                contentSilverUsed: true,
                contentPlatinumUsed: true,
                contentPalladiumUsed: true,
            contentTantalumUsed: true,
                isNewAvailable: true,
                isUsedAvailable: true,
                isSingleType: true,
                isPriceOnRequest: true,
                isShowcaseFace: true,
                priceMarkup: true,
                priceMarkupUsed: true,
                manualPriceNew: true,
                manualPriceUsed: true,
            // Модификации
            hasModifications: true,
            modLabel: true,
            modifications: true,
              },
            },
          },
        },
      },
    });

    // Ð˜Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÐ¼ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¸ Ñ€Ð°ÑÑ‡Ñ‘Ñ‚Ð° Ñ†ÐµÐ½
    const { calculateBasePrice, resolveRates, calculateModificationPrices } = await import("@/lib/price-calculator");

    const showcaseItems: CategoryShowcaseItem[] = [];

    for (const category of categories) {
      // ÐšÐ°ÑÑ‚Ð¾Ð¼Ð½Ñ‹Ðµ ÐºÑƒÑ€ÑÑ‹ Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
      const parentCategoryRates = {
        customRateAu: category.customRateAu,
        customRateAg: category.customRateAg,
        customRatePt: category.customRatePt,
        customRatePd: category.customRatePd,
        customRateTa: category.customRateTa,
      };
      
      // Ð¢Ð¾Ð²Ð°Ñ€Ñ‹ Ð¸Ð· Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ + Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¾ ÐºÑƒÑ€ÑÐ°Ñ…
      const productsWithRates = category.products.map(p => ({
        ...p,
        categorySlug: category.slug,
        categoryName: category.name,
        categoryRates: parentCategoryRates,
      }));
      
      // Ð¢Ð¾Ð²Ð°Ñ€Ñ‹ Ð¸Ð· Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ + Ð¸Ñ… ÐºÐ°ÑÑ‚Ð¾Ð¼Ð½Ñ‹Ðµ ÐºÑƒÑ€ÑÑ‹
      const childProductsWithRates = category.children.flatMap(child => 
        child.products.map(p => ({
          ...p,
          categorySlug: child.slug,
          categoryName: child.name,
          categoryRates: {
            customRateAu: child.customRateAu,
            customRateAg: child.customRateAg,
            customRatePt: child.customRatePt,
            customRatePd: child.customRatePd,
            customRateTa: child.customRateTa,
          },
        }))
      );
      
      // ÐžÐ±ÑŠÐµÐ´Ð¸Ð½ÑÐµÐ¼ Ð²ÑÐµ Ñ‚Ð¾Ð²Ð°Ñ€Ñ‹ Ñ Ð¿Ñ€Ð¸Ð²ÑÐ·ÐºÐ¾Ð¹ Ðº Ð¸Ñ… ÐºÑƒÑ€ÑÐ°Ð¼
      const allProducts = [...productsWithRates, ...childProductsWithRates];

      // ÐŸÑ€Ð¾Ð¿ÑƒÑÐºÐ°ÐµÐ¼ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð±ÐµÐ· Ñ‚Ð¾Ð²Ð°Ñ€Ð¾Ð²
      if (allProducts.length === 0) {
        continue;
      }

      // Ð¡Ð½Ð°Ñ‡Ð°Ð»Ð° Ð¸Ñ‰ÐµÐ¼ Ñ‚Ð¾Ð²Ð°Ñ€ Ñ Ñ„Ð»Ð°Ð³Ð¾Ð¼ isShowcaseFace
      const showcaseFaceProduct = allProducts.find(p => p.isShowcaseFace);

      // Ð¥ÐµÐ»Ð¿ÐµÑ€ Ð´Ð»Ñ Ñ€Ð°ÑÑ‡Ñ‘Ñ‚Ð° Ñ†ÐµÐ½ Ñ‚Ð¾Ð²Ð°Ñ€Ð°
      const calcPrices = (product: typeof allProducts[0]) => {
        const effectiveMarkup = (product.priceMarkup ?? 1) * markup;
        const effectiveMarkupUsed = (product.priceMarkupUsed ?? 1) * markup;
        const rates = resolveRates(metalRates, product.categoryRates);
        
        let priceNew: number | null = null;
        if (product.isNewAvailable) {
          if (product.manualPriceNew !== null) {
            priceNew = Number(product.manualPriceNew);
          } else {
            const basePrice = calculateBasePrice(
              product.contentGold, product.contentSilver,
              product.contentPlatinum, product.contentPalladium, rates,
              product.contentTantalum
            );
            priceNew = Math.round(basePrice * effectiveMarkup * 100) / 100;
          }
        }
        
        let priceUsed: number | null = null;
        if (product.isUsedAvailable) {
          if (product.manualPriceUsed !== null) {
            priceUsed = Number(product.manualPriceUsed);
          } else {
            const basePriceUsed = calculateBasePrice(
              product.contentGoldUsed, product.contentSilverUsed,
              product.contentPlatinumUsed, product.contentPalladiumUsed, rates,
              product.contentTantalumUsed
            );
            priceUsed = Math.round(basePriceUsed * effectiveMarkupUsed * 100) / 100;
          }
        }
        
        return { priceNew, priceUsed };
      };

      let chosenProduct: typeof allProducts[0] | null = null;
      let chosenPriceNew: number | null = null;
      let chosenPriceUsed: number | null = null;

      if (showcaseFaceProduct) {
        // Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼ Ñ‚Ð¾Ð²Ð°Ñ€, Ð²Ñ‹Ð±Ñ€Ð°Ð½Ð½Ñ‹Ð¹ Ð²Ñ€ÑƒÑ‡Ð½ÑƒÑŽ ÐºÐ°Ðº Ð»Ð¸Ñ†Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
        chosenProduct = showcaseFaceProduct;
        const prices = calcPrices(showcaseFaceProduct);
        chosenPriceNew = prices.priceNew;
        chosenPriceUsed = prices.priceUsed;
      } else {
        // Fallback: Ð½Ð°Ñ…Ð¾Ð´Ð¸Ð¼ ÑÐ°Ð¼Ñ‹Ð¹ Ð´Ð¾Ñ€Ð¾Ð³Ð¾Ð¹ Ñ‚Ð¾Ð²Ð°Ñ€
        let maxEffectivePrice = -Infinity;
        for (const product of allProducts) {
          const { priceNew, priceUsed } = calcPrices(product);
          const effectivePrice = Math.max(priceNew ?? 0, priceUsed ?? 0);
          if (effectivePrice > maxEffectivePrice) {
            maxEffectivePrice = effectivePrice;
            chosenProduct = product;
            chosenPriceNew = priceNew;
            chosenPriceUsed = priceUsed;
          }
        }
      }

      const maxEffectivePrice = Math.max(chosenPriceNew ?? 0, chosenPriceUsed ?? 0);

      // Ð”Ð¾Ð±Ð°Ð²Ð»ÑÐµÐ¼ Ñ‚Ð¾Ð²Ð°Ñ€ Ð² Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚, ÐµÑÐ»Ð¸ Ð½Ð°ÑˆÐ»Ð¸ (Ñ Ð»ÑŽÐ±Ð¾Ð¹ Ñ†ÐµÐ½Ð¾Ð¹ > 0)
      if (chosenProduct && maxEffectivePrice > 0) {
        const priceHint = {
          categorySlug: chosenProduct.categorySlug,
          categoryName: chosenProduct.categoryName,
          productSlug: chosenProduct.slug,
          productName: chosenProduct.name,
          unitType: chosenProduct.unitType,
        };
        showcaseItems.push({
          id: chosenProduct.id,
          name: chosenProduct.name,
          slug: chosenProduct.slug,
          description: chosenProduct.description,
          image: chosenProduct.image,
          priceNew: applyHundredPrice(chosenPriceNew, priceHint),
          priceUsed: applyHundredPrice(chosenPriceUsed, priceHint),
          isNewAvailable: chosenProduct.isNewAvailable,
          isUsedAvailable: chosenProduct.isUsedAvailable,
          isSingleType: chosenProduct.isSingleType,
          isPriceOnRequest: chosenProduct.isPriceOnRequest,
          unitType: chosenProduct.unitType,
          // Модификации с ценами
          hasModifications: chosenProduct.hasModifications ?? false,
          modLabel: chosenProduct.modLabel ?? 'Модификация',
          modifications: (chosenProduct.modifications ?? []).map((mod) => {
            const effectiveMarkup = (chosenProduct.priceMarkup ?? 1) * markup;
            const effectiveMarkupUsed = (chosenProduct.priceMarkupUsed ?? 1) * markup;
            const modPrices = calculateModificationPrices(
              { contentAu: mod.contentAu, contentAg: mod.contentAg, contentPt: mod.contentPt, contentPd: mod.contentPd, contentTa: mod.contentTa, contentAuUsed: mod.contentAuUsed, contentAgUsed: mod.contentAgUsed, contentPtUsed: mod.contentPtUsed, contentPdUsed: mod.contentPdUsed, contentTaUsed: mod.contentTaUsed },
              metalRates,
              chosenProduct.categoryRates,
              effectiveMarkup,
              effectiveMarkupUsed,
            );
            return {
              id: mod.id,
              name: mod.name,
              priceNew: applyHundredPrice(modPrices.priceNew, priceHint) ?? modPrices.priceNew,
              priceUsed: applyHundredPrice(modPrices.priceUsed, priceHint) ?? modPrices.priceUsed,
            };
          }),
          categorySlug: category.slug,
          categoryName: category.name,
        });
      }

      // ÐŸÑ€ÐµÑ€Ñ‹Ð²Ð°ÐµÐ¼ ÐµÑÐ»Ð¸ Ð´Ð¾ÑÑ‚Ð¸Ð³Ð»Ð¸ Ð»Ð¸Ð¼Ð¸Ñ‚Ð°
      if (showcaseItems.length >= limit) {
        break;
      }
    }

    return { success: true, data: showcaseItems };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ Ð²Ð¸Ñ‚Ñ€Ð¸Ð½Ñ‹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¿Ð¾ ID Ñ€Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ð¹ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
 * Ð•ÑÐ»Ð¸ parentId = null, Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ ÐºÐ¾Ñ€Ð½ÐµÐ²Ñ‹Ðµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸
 */
export async function getSubcategories(parentId: string | null): Promise<CategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const data: CategoryData[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId,
      parentName: cat.parent?.name ?? null,
      sortOrder: cat.sortOrder,
      childSortOrder: cat.childSortOrder,
      warningMessage: cat.warningMessage,
      ...pickBannerFields(cat),
      ...pickInfoPageFields(cat),
      isPinnedToDashboard: cat.isPinnedToDashboard,
      customRateAu: cat.customRateAu,
      customRateAg: cat.customRateAg,
      customRatePt: cat.customRatePt,
      customRatePd: cat.customRatePd,
      customRateTa: cat.customRateTa,
      productCount: cat._count.products,
      childrenCount: cat._count.children,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return {
      success: true,
      data,
      total: categories.length,
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ Ð¿Ð¾Ð´ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ñ†ÐµÐ¿Ð¾Ñ‡ÐºÑƒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð¾Ñ‚ ÐºÐ¾Ñ€Ð½Ñ Ð´Ð¾ Ñ‚ÐµÐºÑƒÑ‰ÐµÐ¹ (Ð´Ð»Ñ Ñ…Ð»ÐµÐ±Ð½Ñ‹Ñ… ÐºÑ€Ð¾ÑˆÐµÐº)
 */
export async function getCategoryBreadcrumbs(categoryId: string): Promise<{ success: true; data: Array<{ id: string; name: string; slug: string }> } | { success: false; error: string }> {
  try {
    const breadcrumbs: Array<{ id: string; name: string; slug: string }> = [];
    let currentId: string | null = categoryId;

    // ÐŸÐ¾Ð´Ð½Ð¸Ð¼Ð°ÐµÐ¼ÑÑ Ð²Ð²ÐµÑ€Ñ… Ð¿Ð¾ Ð´ÐµÑ€ÐµÐ²Ñƒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹
    while (currentId) {
      const category: { id: string; name: string; slug: string; parentId: string | null } | null = await prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, slug: true, parentId: true },
      });

      if (!category) break;

      breadcrumbs.unshift({
        id: category.id,
        name: category.name,
        slug: category.slug,
      });

      currentId = category.parentId;
    }

    return { success: true, data: breadcrumbs };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ Ñ…Ð»ÐµÐ±Ð½Ñ‹Ñ… ÐºÑ€Ð¾ÑˆÐµÐº:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

// ============================================================================
// Ð”ÐÐ¨Ð‘ÐžÐ Ð”: Ð—ÐÐšÐ Ð•ÐŸÐ›ÐÐÐÐ«Ð• ÐšÐÐ¢Ð•Ð“ÐžÐ Ð˜Ð˜
// ============================================================================

/**
 * ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸, Ð·Ð°ÐºÑ€ÐµÐ¿Ð»Ñ‘Ð½Ð½Ñ‹Ðµ Ð½Ð° Ð´Ð°ÑˆÐ±Ð¾Ñ€Ð´Ðµ (isPinnedToDashboard: true)
 */
export async function getPinnedCategories(): Promise<CategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      where: { isPinnedToDashboard: true },
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const data: CategoryData[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId,
      parentName: cat.parent?.name ?? null,
      sortOrder: cat.sortOrder,
      childSortOrder: cat.childSortOrder,
      warningMessage: cat.warningMessage,
      ...pickBannerFields(cat),
      ...pickInfoPageFields(cat),
      isPinnedToDashboard: cat.isPinnedToDashboard,
      customRateAu: cat.customRateAu,
      customRateAg: cat.customRateAg,
      customRatePt: cat.customRatePt,
      customRatePd: cat.customRatePd,
      customRateTa: cat.customRateTa,
      productCount: cat._count.products,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return {
      success: true,
      data,
      total: categories.length,
    };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ð¸ Ð·Ð°ÐºÑ€ÐµÐ¿Ð»Ñ‘Ð½Ð½Ñ‹Ñ… ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}

/**
 * Ð’Ñ…Ð¾Ð´Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð´Ð»Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÐºÑƒÑ€ÑÐ¾Ð² ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ñ Ð´Ð°ÑˆÐ±Ð¾Ñ€Ð´Ð°
 */
export interface UpdateCategoryRatesInput {
  id: string;
  customRateAu: number | null;
  customRateAg: number | null;
  customRatePt: number | null;
  customRatePd: number | null;
  customRateTa: number | null;
}

/**
 * ÐžÐ±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ ÐºÑƒÑ€ÑÑ‹ Ð¼ÐµÑ‚Ð°Ð»Ð»Ð¾Ð² Ð´Ð»Ñ Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¸Ñ… ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ (Ð´Ð»Ñ Ð´Ð°ÑˆÐ±Ð¾Ñ€Ð´Ð°)
 */
export async function updateCategoryRates(
  inputs: UpdateCategoryRatesInput[]
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // ÐžÐ±Ð½Ð¾Ð²Ð»ÑÐµÐ¼ Ð²ÑÐµ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð² Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ð¸Ð¸
    await prisma.$transaction(
      inputs.map((input) =>
        prisma.category.update({
          where: { id: input.id },
          data: {
            customRateAu: input.customRateAu,
            customRateAg: input.customRateAg,
            customRatePt: input.customRatePt,
            customRatePd: input.customRatePd,
            customRateTa: input.customRateTa,
          },
        })
      )
    );

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error("ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ð¸ ÐºÑƒÑ€ÑÐ¾Ð² ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°Ñ Ð¾ÑˆÐ¸Ð±ÐºÐ°",
    };
  }
}
