import type { SellModalContactInfo } from "@/app/(root)/components/SellModal";
import { formatWhatsAppHref } from "./whatsapp";

/**
 * Второй магазин — тот же код и та же админка, отдельная база и свой адрес.
 * Выкладывается отдельным релизом, без изменения исходного магазина.
 * Название, домен и тема приходят из окружения; по умолчанию — РадиоКлад.
 */
export const SITE_BRAND = process.env.NEXT_PUBLIC_SITE_BRAND?.trim() || "РадиоКлад";
export const IS_LOCAL_PREVIEW = process.env.NEXT_PUBLIC_LOCAL_PREVIEW === "1";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://radio-klad.ru"
).replace(/\/$/, "");
export const SITE_THEME = process.env.NEXT_PUBLIC_SITE_THEME?.trim() || "radioklad";
// Empty optional contacts must not link the second store to the original brand.
export const DEFAULT_SITE_EMAIL = SITE_THEME === "radioklad" ? "" : "info@dragsoyuz.ru";
export const DEFAULT_SITE_VK_URL = SITE_THEME === "radioklad" ? "" : "https://vk.com/dragsoyuz";
/** Номер из окружения для второго магазина. Витрина РадиоКлада берёт свой счётчик по теме. */
export const YANDEX_METRIKA_ID =
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim() ?? "";

export function siteHostLabel(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "radio-klad.ru";
  }
}

export function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function formatTelegramHref(username: string): string {
  const cleanUsername = username
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//, "");
  return `https://t.me/${cleanUsername}`;
}

export function buildSellContactInfo(
  settings?: {
    phoneNumber?: string | null;
    telegramUsername?: string | null;
    vkLink?: string | null;
    whatsappNumber?: string | null;
  } | null,
): SellModalContactInfo {
  const phoneNumber = settings?.phoneNumber || "+7 (812) 983-49-76";
  const phoneDigits = (settings?.phoneNumber || "+78129834976").replace(
    /[^\d+]/g,
    "",
  );

  return {
    phoneNumber,
    phoneHref: formatPhoneHref(phoneDigits),
    telegramHref: formatTelegramHref(settings?.telegramUsername || "dragsoyuz"),
    vkHref: settings?.vkLink?.trim() || DEFAULT_SITE_VK_URL,
    whatsappHref: formatWhatsAppHref(settings?.whatsappNumber),
  };
}
