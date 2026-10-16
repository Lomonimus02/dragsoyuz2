/** Текст попапа по умолчанию. Это объявление, не коэффициент калькулятора. */
export const DEFAULT_PROMO_TEXT =
  "Подпишитесь на сообщество ВКонтакте — получите +1% к выплате";

export const DEFAULT_PROMO_TERMS =
  "Подпишитесь на наше сообщество ВКонтакте и напишите нам сообщение. Акция действует до указанной даты. Подробности уточняйте у менеджера.";

export const DEFAULT_PROMO_BUTTON_URL = "https://vk.com/dragsoyuz";

export const DEFAULT_PROMO_BUTTON_LABEL = "Условия акции во ВКонтакте";

export const DEFAULT_PROMO_BUTTON_CAPTION =
  "Откроется страница сообщества в новой вкладке";

export const PROMO_BUTTON_EMPTY_LABEL = "Подробнее";

/** http/https после trim. Пустая и невалидная ссылка не открывается. */
export function promoButtonHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return null;
  }
  return null;
}
