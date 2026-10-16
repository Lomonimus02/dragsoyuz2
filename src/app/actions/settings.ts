"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "./auth";
import {
  DEFAULT_PROMO_BUTTON_CAPTION,
  DEFAULT_PROMO_BUTTON_LABEL,
  DEFAULT_PROMO_BUTTON_URL,
  DEFAULT_PROMO_TERMS,
  DEFAULT_PROMO_TEXT,
} from "@/lib/promo";
import {
  parseYearPeriodDiscounts,
  type YearPeriodDiscounts,
} from "@/lib/year-discount";
import {
  mergeInfoPageButtonColorPreset,
  normalizeInfoPageButtonColor,
  parseInfoPageButtonColorPresets,
} from "@/lib/category-info";

// ============================================================================
// ТИПЫ
// ============================================================================

/**
 * Данные курсов металлов для API
 */
export interface MetalRatesData {
  id: string;
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  tantalum: number;
  updatedAt: Date;
}

/**
 * Входные данные для обновления курсов
 */
export interface UpdateMetalRatesInput {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  tantalum: number;
}

/**
 * Результат операции с курсами
 */
export type MetalRatesResult =
  | { success: true; data: MetalRatesData }
  | { success: false; error: string };

/**
 * Данные глобальных настроек для API
 */
export interface GlobalSettingsData {
  id: string;
  priceMarkup: number; // Глобальный коэффициент наценки
  updatedAt: Date;
  // Контактные данные
  phoneNumber: string;
  email: string;
  telegramUsername: string;
  address: string;
  workSchedule: string;
  // Ссылка на ВКонтакте
  vkLink: string;
  // Настройки Telegram-бота
  telegramBotToken: string;
  telegramChatId: string;
  // Фото магазина
  storePhotoUrls: string[];
  // Текст и фото для страницы "О нас"
  aboutText: string;
  aboutPhotoUrl: string;
  // Показывать ли плашку над шапкой
  showArrivalNotice: boolean;
  // Текст плашки над шапкой
  arrivalNoticeText: string;
  // Скидки калькулятора по периоду года выпуска (%)
  yearPeriodDiscounts: YearPeriodDiscounts;
  // Общие пресеты цвета кнопки информационной страницы
  infoPageButtonColorPresets: string[];
  // Попап акции (только текст, не влияет на цены)
  promoEnabled: boolean;
  promoText: string;
  promoTerms: string;
  promoUpdatedAt: Date;
  promoButtonUrl: string;
  promoButtonLabel: string;
  promoButtonCaption: string;
}

/**
 * Входные данные для обновления глобальных настроек
 */
export interface UpdateGlobalSettingsInput {
  priceMarkup?: number;
  phoneNumber?: string;
  email?: string;
  telegramUsername?: string;
  address?: string;
  workSchedule?: string;
  vkLink?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  storePhotoUrls?: string[];
  aboutText?: string;
  aboutPhotoUrl?: string;
  showArrivalNotice?: boolean;
  arrivalNoticeText?: string;
  yearPeriodDiscounts?: YearPeriodDiscounts;
}

/**
 * Результат операции с глобальными настройками
 */
export type GlobalSettingsResult =
  | { success: true; data: GlobalSettingsData }
  | { success: false; error: string };

// ============================================================================
// ДЕФОЛТНЫЕ ЗНАЧЕНИЯ
// ============================================================================

const DEFAULT_RATES = {
  gold: 6500,
  silver: 85,
  platinum: 3200,
  palladium: 3800,
  tantalum: 0,
};

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

/**
 * Преобразует запись из БД в формат для API
 * Конвертирует Decimal-подобные значения в number
 */
function serializeMetalRates(rates: {
  id: string;
  gold: unknown;
  silver: unknown;
  platinum: unknown;
  palladium: unknown;
  tantalum?: unknown;
  updatedAt: Date;
}): MetalRatesData {
  return {
    id: rates.id,
    gold: Number(rates.gold),
    silver: Number(rates.silver),
    platinum: Number(rates.platinum),
    palladium: Number(rates.palladium),
    tantalum: Number(rates.tantalum ?? 0),
    updatedAt: rates.updatedAt,
  };
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Получить текущие курсы металлов.
 * Если записи нет — создаёт дефолтную.
 */
export async function getMetalRates(): Promise<MetalRatesResult> {
  try {
    // Пытаемся получить существующую запись
    let rates = await prisma.metalRate.findUnique({
      where: { id: "current" },
    });

    // Если записи нет — создаём дефолтную
    if (!rates) {
      rates = await prisma.metalRate.create({
        data: {
          id: "current",
          gold: DEFAULT_RATES.gold,
          silver: DEFAULT_RATES.silver,
          platinum: DEFAULT_RATES.platinum,
          palladium: DEFAULT_RATES.palladium,
          tantalum: DEFAULT_RATES.tantalum,
        },
      });
    }

    return {
      success: true,
      data: serializeMetalRates(rates),
    };
  } catch (error) {
    console.error("Ошибка при получении курсов металлов:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить курсы металлов.
 * TODO: Добавить проверку роли админа
 */
export async function updateMetalRates(
  input: UpdateMetalRatesInput
): Promise<MetalRatesResult> {
  try {
    // Валидация входных данных
    if (
      input.gold <= 0 ||
      input.silver <= 0 ||
      input.platinum <= 0 ||
      input.palladium <= 0 ||
      input.tantalum < 0 ||
      Number.isNaN(input.tantalum)
    ) {
      return {
        success: false,
        error: "Курсы золота, серебра, платины и палладия должны быть больше нуля",
      };
    }

    // Обновляем или создаём запись (upsert)
    const rates = await prisma.metalRate.upsert({
      where: { id: "current" },
      update: {
        gold: input.gold,
        silver: input.silver,
        platinum: input.platinum,
        palladium: input.palladium,
        tantalum: input.tantalum,
      },
      create: {
        id: "current",
        gold: input.gold,
        silver: input.silver,
        platinum: input.platinum,
        palladium: input.palladium,
        tantalum: input.tantalum,
      },
    });

    // Инвалидируем кеш всего сайта (курсы влияют на все цены)
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: serializeMetalRates(rates),
    };
  } catch (error) {
    console.error("Ошибка при обновлении курсов металлов:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

// ============================================================================
// GLOBAL SETTINGS SERVER ACTIONS
// ============================================================================

/** Дефолтное значение наценки */
const DEFAULT_MARKUP = 1.0;

function serializeGlobalSettings(settings: {
  id: string;
  priceMarkup: number;
  updatedAt: Date;
  phoneNumber: string;
  email: string;
  telegramUsername: string;
  address: string;
  workSchedule: string;
  vkLink: string | null;
  telegramBotToken: string;
  telegramChatId: string;
  storePhotoUrls: string[];
  aboutText: string | null;
  aboutPhotoUrl: string | null;
  showArrivalNotice: boolean;
  arrivalNoticeText: string | null;
  yearPeriodDiscounts: unknown;
  infoPageButtonColorPresets?: unknown;
  promoEnabled?: boolean;
  promoText?: string | null;
  promoTerms?: string | null;
  promoUpdatedAt?: Date;
  promoButtonUrl?: string | null;
  promoButtonLabel?: string | null;
  promoButtonCaption?: string | null;
}): GlobalSettingsData {
  return {
    id: settings.id,
    priceMarkup: settings.priceMarkup,
    updatedAt: settings.updatedAt,
    phoneNumber: settings.phoneNumber,
    email: settings.email,
    telegramUsername: settings.telegramUsername,
    address: settings.address,
    workSchedule: settings.workSchedule,
    vkLink: settings.vkLink ?? "",
    telegramBotToken: settings.telegramBotToken,
    telegramChatId: settings.telegramChatId,
    storePhotoUrls: settings.storePhotoUrls ?? [],
    aboutText: settings.aboutText ?? "",
    aboutPhotoUrl: settings.aboutPhotoUrl ?? "",
    showArrivalNotice: settings.showArrivalNotice ?? true,
    arrivalNoticeText:
      settings.arrivalNoticeText?.trim() ||
      "❗️Время прибытия необходимо согласовать заранее❗️",
    yearPeriodDiscounts: parseYearPeriodDiscounts(settings.yearPeriodDiscounts),
    infoPageButtonColorPresets: parseInfoPageButtonColorPresets(
      settings.infoPageButtonColorPresets,
    ),
    promoEnabled: settings.promoEnabled ?? true,
    promoText: settings.promoText ?? DEFAULT_PROMO_TEXT,
    promoTerms: settings.promoTerms ?? DEFAULT_PROMO_TERMS,
    promoUpdatedAt: settings.promoUpdatedAt ?? new Date(0),
    promoButtonUrl: settings.promoButtonUrl ?? DEFAULT_PROMO_BUTTON_URL,
    promoButtonLabel: settings.promoButtonLabel ?? DEFAULT_PROMO_BUTTON_LABEL,
    promoButtonCaption: settings.promoButtonCaption ?? DEFAULT_PROMO_BUTTON_CAPTION,
  };
}

/**
 * Получить глобальные настройки.
 * Если записи нет — создаёт дефолтную с priceMarkup = 1.0
 */
export async function getGlobalSettings(): Promise<GlobalSettingsResult> {
  try {
    // Пытаемся получить существующую запись
    let settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    // Если записи нет — создаём дефолтную
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          id: "global",
          priceMarkup: DEFAULT_MARKUP,
          phoneNumber: "",
          email: "",
          telegramUsername: "",
          address: "",
          workSchedule: "",
          vkLink: "",
          telegramBotToken: "",
          telegramChatId: "",
          promoButtonUrl: DEFAULT_PROMO_BUTTON_URL,
          promoButtonLabel: DEFAULT_PROMO_BUTTON_LABEL,
          promoButtonCaption: DEFAULT_PROMO_BUTTON_CAPTION,
        },
      });
    }

    return {
      success: true,
      data: serializeGlobalSettings(settings),
    };
  } catch (error) {
    console.error("Ошибка при получении глобальных настроек:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Обновить глобальные настройки.
 * TODO: Добавить проверку роли админа
 */
export async function updateGlobalSettings(
  input: UpdateGlobalSettingsInput
): Promise<GlobalSettingsResult> {
  try {
    // Валидация входных данных (только если priceMarkup передан)
    if (input.priceMarkup !== undefined) {
      if (input.priceMarkup <= 0) {
        return {
          success: false,
          error: "Коэффициент наценки должен быть положительным числом",
        };
      }

      if (input.priceMarkup > 10) {
        return {
          success: false,
          error: "Коэффициент наценки не может превышать 10 (1000%)",
        };
      }
    }

    const yearPeriodDiscounts = input.yearPeriodDiscounts
      ? parseYearPeriodDiscounts(input.yearPeriodDiscounts)
      : undefined;

    if (yearPeriodDiscounts) {
      const outOfRange = Object.values(yearPeriodDiscounts).some(
        (value) => value < 0 || value > 100,
      );
      if (outOfRange) {
        return {
          success: false,
          error: "Скидка по году должна быть от 0 до 100%",
        };
      }
    }

    // Собираем данные для обновления
    const updateData: Partial<UpdateGlobalSettingsInput> = {};
    if (input.priceMarkup !== undefined) updateData.priceMarkup = input.priceMarkup;
    if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.telegramUsername !== undefined) updateData.telegramUsername = input.telegramUsername;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.workSchedule !== undefined) updateData.workSchedule = input.workSchedule;
    if (input.vkLink !== undefined) updateData.vkLink = input.vkLink;
    if (input.telegramBotToken !== undefined) updateData.telegramBotToken = input.telegramBotToken;
    if (input.telegramChatId !== undefined) updateData.telegramChatId = input.telegramChatId;
    if (input.storePhotoUrls !== undefined) updateData.storePhotoUrls = input.storePhotoUrls;
    if (input.aboutText !== undefined) updateData.aboutText = input.aboutText;
    if (input.aboutPhotoUrl !== undefined) updateData.aboutPhotoUrl = input.aboutPhotoUrl;
    if (input.showArrivalNotice !== undefined) updateData.showArrivalNotice = input.showArrivalNotice;
    if (input.arrivalNoticeText !== undefined) {
      updateData.arrivalNoticeText = input.arrivalNoticeText.trim() ||
        "❗️Время прибытия необходимо согласовать заранее❗️";
    }
    if (yearPeriodDiscounts !== undefined) {
      updateData.yearPeriodDiscounts = yearPeriodDiscounts;
    }

    // Обновляем или создаём запись (upsert)
    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        priceMarkup: input.priceMarkup ?? DEFAULT_MARKUP,
        phoneNumber: input.phoneNumber ?? "",
        email: input.email ?? "",
        telegramUsername: input.telegramUsername ?? "",
        address: input.address ?? "",
        workSchedule: input.workSchedule ?? "",
        vkLink: input.vkLink ?? "",
        telegramBotToken: input.telegramBotToken ?? "",
        telegramChatId: input.telegramChatId ?? "",
        storePhotoUrls: input.storePhotoUrls ?? [],
        aboutText: input.aboutText ?? "",
        aboutPhotoUrl: input.aboutPhotoUrl ?? "",
        showArrivalNotice: input.showArrivalNotice ?? true,
        arrivalNoticeText:
          input.arrivalNoticeText?.trim() ||
          "❗️Время прибытия необходимо согласовать заранее❗️",
        yearPeriodDiscounts: yearPeriodDiscounts ?? parseYearPeriodDiscounts(null),
      },
    });

    // Инвалидируем кеш всего сайта (настройки влияют на все страницы)
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: serializeGlobalSettings(settings),
    };
  } catch (error) {
    console.error("Ошибка при обновлении глобальных настроек:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

export interface UpdatePromoSettingsInput {
  promoEnabled: boolean;
  promoText: string;
  promoTerms: string;
  promoButtonUrl: string;
  promoButtonLabel: string;
  promoButtonCaption: string;
}

/**
 * Сохранить текст попапа акции.
 * promoUpdatedAt меняется, если изменились текст, условия, ссылка, текст кнопки или подпись,
 * чтобы закрытие в localStorage сбрасывалось именно при правке объявления.
 */
export async function updatePromoSettings(
  input: UpdatePromoSettingsInput,
): Promise<GlobalSettingsResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const promoText = input.promoText.trim();
    const promoTerms = input.promoTerms.trim();
    const promoButtonUrl = input.promoButtonUrl.trim();
    const promoButtonLabel = input.promoButtonLabel.trim();
    const promoButtonCaption = input.promoButtonCaption.trim();

    if (input.promoEnabled && !promoText) {
      return { success: false, error: "Укажите текст акции" };
    }

    const current = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    const textChanged = (current?.promoText ?? "") !== promoText;
    const termsChanged = (current?.promoTerms ?? "") !== promoTerms;
    const urlChanged = (current?.promoButtonUrl ?? "") !== promoButtonUrl;
    const labelChanged = (current?.promoButtonLabel ?? "") !== promoButtonLabel;
    const captionChanged = (current?.promoButtonCaption ?? "") !== promoButtonCaption;
    const promoUpdatedAt =
      !current || textChanged || termsChanged || urlChanged || labelChanged || captionChanged
        ? new Date()
        : current.promoUpdatedAt;

    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: {
        promoEnabled: input.promoEnabled,
        promoText,
        promoTerms,
        promoButtonUrl,
        promoButtonLabel,
        promoButtonCaption,
        promoUpdatedAt,
      },
      create: {
        id: "global",
        priceMarkup: DEFAULT_MARKUP,
        phoneNumber: "",
        email: "",
        telegramUsername: "",
        address: "",
        workSchedule: "",
        vkLink: "",
        telegramBotToken: "",
        telegramChatId: "",
        promoEnabled: input.promoEnabled,
        promoText,
        promoTerms,
        promoButtonUrl,
        promoButtonLabel,
        promoButtonCaption,
        promoUpdatedAt,
      },
    });

    revalidatePath("/", "layout");

    return {
      success: true,
      data: serializeGlobalSettings(settings),
    };
  } catch (error) {
    console.error("Ошибка при сохранении акции:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Получить текущий коэффициент наценки (удобный хелпер)
 * Используется в расчёте цен
 */
export async function getPriceMarkup(): Promise<number> {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });
    return settings?.priceMarkup ?? DEFAULT_MARKUP;
  } catch (error) {
    console.error("Ошибка при получении коэффициента наценки:", error);
    return DEFAULT_MARKUP;
  }
}

/**
 * Сохранить hex-цвет в общий список пресетов кнопки информационной страницы.
 * Не применяет цвет к категории — только добавляет образец для других форм.
 */
export async function saveInfoPageButtonColorPreset(
  hex: string,
): Promise<GlobalSettingsResult> {
  try {
    const color = normalizeInfoPageButtonColor(hex);
    if (!color) {
      return {
        success: false,
        error: "Укажите корректный hex-цвет",
      };
    }

    let settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          id: "global",
          priceMarkup: DEFAULT_MARKUP,
          phoneNumber: "",
          email: "",
          telegramUsername: "",
          address: "",
          workSchedule: "",
          vkLink: "",
          telegramBotToken: "",
          telegramChatId: "",
        },
      });
    }

    const presets = mergeInfoPageButtonColorPreset(
      parseInfoPageButtonColorPresets(settings.infoPageButtonColorPresets),
      color,
    );

    const updated = await prisma.globalSettings.update({
      where: { id: "global" },
      data: { infoPageButtonColorPresets: presets },
    });

    revalidatePath("/", "layout");

    return {
      success: true,
      data: serializeGlobalSettings(updated),
    };
  } catch (error) {
    console.error("Ошибка при сохранении пресета цвета кнопки:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}
