import type { SellModalContactInfo } from "@/app/(root)/components/SellModal";

/**
 * Второй магазин — тот же код и та же админка, отдельная база и свой адрес.
 * Его выкладывают на отдельный сервер, не через сборку драгсоюза на GitHub.
 * Название, домен и тема приходят из окружения. Без переменных остаётся драгсоюз.
 */
export const SITE_BRAND = process.env.NEXT_PUBLIC_SITE_BRAND?.trim() || "ДРАГСОЮЗ";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://драгсоюз.рф"
).replace(/\/$/, "");
export const SITE_THEME = process.env.NEXT_PUBLIC_SITE_THEME?.trim() || "dragsoyuz";
export const YANDEX_METRIKA_ID =
  process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim() || "108599989";

export function siteHostLabel(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "драгсоюз.рф";
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
    vkHref: settings?.vkLink || "https://vk.com/dragsoyuz",
  };
}
