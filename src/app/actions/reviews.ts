"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "./auth";

// ============================================================================
// ТИПЫ
// ============================================================================

export type ReviewData = {
  id: string;
  name: string;
  text: string;
  approved: boolean;
  createdAt: Date;
};

export type SubmitReviewResult =
  | { success: true }
  | { success: false; error: string };

export type ReviewsResult =
  | { success: true; data: ReviewData[] }
  | { success: false; error: string };

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================================
// ПУБЛИЧНЫЕ ЭКШЕНЫ
// ============================================================================

/**
 * Отправка отзыва с сайта (ожидает модерации)
 */
export async function submitReview(
  name: string,
  text: string
): Promise<SubmitReviewResult> {
  try {
    const trimmedName = name.trim();
    const trimmedText = text.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Пожалуйста, укажите ваше имя" };
    }

    if (trimmedName.length > 100) {
      return { success: false, error: "Имя не должно превышать 100 символов" };
    }

    if (!trimmedText || trimmedText.length < 10) {
      return {
        success: false,
        error: "Отзыв должен содержать минимум 10 символов",
      };
    }

    if (trimmedText.length > 2000) {
      return {
        success: false,
        error: "Отзыв не должен превышать 2000 символов",
      };
    }

    await prisma.review.create({
      data: {
        name: trimmedName,
        text: trimmedText,
        approved: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании отзыва:", error);
    return { success: false, error: "Произошла ошибка. Попробуйте позже." };
  }
}

/**
 * Список опубликованных отзывов для главной страницы
 */
export async function getApprovedReviews(): Promise<ReviewsResult> {
  try {
    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("Ошибка при получении отзывов:", error);
    return { success: false, error: "Не удалось загрузить отзывы" };
  }
}

// ============================================================================
// АДМИН ЭКШЕНЫ
// ============================================================================

/**
 * Все отзывы для панели модерации
 */
export async function adminGetReviews(): Promise<ReviewsResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error("Ошибка при получении отзывов (админ):", error);
    return { success: false, error: "Не удалось загрузить отзывы" };
  }
}

/**
 * Одобрить и опубликовать отзыв
 */
export async function adminApproveReview(id: string): Promise<ReviewActionResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.review.update({
      where: { id },
      data: { approved: true },
    });

    revalidatePath("/");
    revalidatePath("/admin/reviews");

    return { success: true };
  } catch (error) {
    console.error("Ошибка при одобрении отзыва:", error);
    return { success: false, error: "Не удалось опубликовать отзыв" };
  }
}

/**
 * Удалить отзыв
 */
export async function adminDeleteReview(id: string): Promise<ReviewActionResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    await prisma.review.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/reviews");

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении отзыва:", error);
    return { success: false, error: "Не удалось удалить отзыв" };
  }
}
