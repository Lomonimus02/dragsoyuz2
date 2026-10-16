"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ============================================================================
// ТИПЫ
// ============================================================================

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const ADMIN_COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Авторизация администратора
 * Проверяет пароль против хеша в БД или fallback на ADMIN_PASSWORD из env
 */
export async function loginAdmin(password: string): Promise<LoginResult> {
  try {
    // Получаем настройки из БД
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
      select: { adminPasswordHash: true },
    });

    let isValidPassword = false;

    // Проверяем хеш из БД (приоритет)
    if (settings?.adminPasswordHash) {
      isValidPassword = await bcrypt.compare(password, settings.adminPasswordHash);
    } else {
      // Fallback на ENV переменную для обратной совместимости
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error("ADMIN_PASSWORD не установлен и adminPasswordHash отсутствует в БД");
        return { success: false, error: "Ошибка конфигурации сервера" };
      }
      isValidPassword = password === adminPassword;
    }

    if (!isValidPassword) {
      return { success: false, error: "Неверный пароль" };
    }

    // Создаём простую сессию
    const sessionToken = Buffer.from(
      JSON.stringify({ 
        authenticated: true, 
        timestamp: Date.now() 
      })
    ).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: false, // Для HTTP без HTTPS
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Ошибка при входе:", error);
    return { success: false, error: "Ошибка сервера при авторизации" };
  }
}

/**
 * Смена пароля администратора
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  try {
    // Валидация нового пароля
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Пароль должен быть минимум 6 символов" };
    }

    // Получаем текущий хеш из БД
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
      select: { adminPasswordHash: true },
    });

    // Проверяем текущий пароль
    let isCurrentPasswordValid = false;
    
    if (settings?.adminPasswordHash) {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, settings.adminPasswordHash);
    } else {
      // Fallback на ENV переменную
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword) {
        isCurrentPasswordValid = currentPassword === adminPassword;
      }
    }

    if (!isCurrentPasswordValid) {
      return { success: false, error: "Неверный текущий пароль" };
    }

    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Обновляем в БД
    await prisma.globalSettings.update({
      where: { id: "global" },
      data: { adminPasswordHash: newPasswordHash },
    });

    return { success: true };
  } catch (error) {
    console.error("Ошибка при смене пароля:", error);
    return { success: false, error: "Ошибка сервера при смене пароля" };
  }
}

/**
 * Выход из админки
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

/**
 * Проверка авторизации (для использования в серверных компонентах)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return false;
  }

  try {
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
    return session.authenticated === true;
  } catch {
    return false;
  }
}
