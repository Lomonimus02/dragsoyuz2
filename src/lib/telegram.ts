import { prisma } from "@/lib/prisma";

/**
 * Отправить сообщение в Telegram через Bot API
 * Читает токен и Chat ID из GlobalSettings в БД
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
    });

    const botToken = settings?.telegramBotToken;
    const chatId = settings?.telegramChatId;

    if (!botToken || !chatId) {
      console.warn("Telegram бот не настроен: отсутствует токен или Chat ID");
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();

    if (!data.ok) {
      console.error("Ошибка Telegram API:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Ошибка при отправке в Telegram:", error);
    return false;
  }
}

/**
 * Форматирует и отправляет заявку на почтовое отправление в Telegram
 */
export async function sendPostalRequestToTelegram(data: {
  name: string;
  phone: string;
  comment?: string;
}): Promise<boolean> {
  const lines = [
    "📦 <b>Новая заявка на почтовое отправление</b>",
    "",
    `👤 <b>Имя:</b> ${escapeHtml(data.name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(data.phone)}`,
  ];

  if (data.comment) {
    lines.push(`💬 <b>Комментарий:</b> ${escapeHtml(data.comment)}`);
  }

  lines.push("");
  lines.push(`🕐 ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}`);

  return sendTelegramMessage(lines.join("\n"));
}

/** Экранирует HTML-спецсимволы для Telegram */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
