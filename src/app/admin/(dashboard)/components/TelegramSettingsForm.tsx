"use client";

import { useState } from "react";
import { updateGlobalSettings, GlobalSettingsData } from "@/app/actions";
import { Bot, MessageSquare, Loader2, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { SITE_BRAND } from "@/lib/site";

interface TelegramSettingsFormProps {
  initialData: GlobalSettingsData;
}

export function TelegramSettingsForm({ initialData }: TelegramSettingsFormProps) {
  const [form, setForm] = useState({
    telegramBotToken: initialData.telegramBotToken || "",
    telegramChatId: initialData.telegramChatId || "",
  });
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateGlobalSettings({
        telegramBotToken: form.telegramBotToken.trim(),
        telegramChatId: form.telegramChatId.trim(),
      });

      if (result.success) {
        setMessage({ type: "success", text: "Настройки Telegram сохранены!" });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch {
      setMessage({ type: "error", text: "Произошла ошибка при сохранении" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestMessage = async () => {
    if (!form.telegramBotToken.trim() || !form.telegramChatId.trim()) {
      setMessage({ type: "error", text: "Заполните оба поля перед тестированием" });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${form.telegramBotToken.trim()}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: form.telegramChatId.trim(),
            text: `✅ Тестовое сообщение от ${SITE_BRAND}\n\nПодключение настроено успешно!`,
            parse_mode: "HTML",
          }),
        }
      );

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "Тестовое сообщение отправлено! Проверьте Telegram." });
      } else {
        setMessage({
          type: "error",
          text: `Ошибка Telegram: ${data.description || "Неизвестная ошибка"}`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось отправить сообщение. Проверьте токен и Chat ID." });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = form.telegramBotToken.trim() && form.telegramChatId.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bot Token */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Bot className="w-4 h-4 text-slate-400" />
          Токен бота
        </label>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={form.telegramBotToken}
            onChange={handleChange("telegramBotToken")}
            placeholder="123456789:ABCDefghIJKLMnopQRSTuvwxyz"
            className="w-full px-4 py-2.5 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">@BotFather</a> в Telegram
        </p>
      </div>

      {/* Chat ID */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          Chat ID
        </label>
        <input
          type="text"
          value={form.telegramChatId}
          onChange={handleChange("telegramChatId")}
          placeholder="-1001234567890"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-mono text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">
          ID чата или группы. Узнайте через <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">@userinfobot</a> или <a href="https://t.me/getmyid_bot" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">@getmyid_bot</a>
        </p>
      </div>

      {/* Status indicator */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
        isConfigured
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}>
        {isConfigured ? (
          <>
            <Check className="w-4 h-4" />
            Бот настроен. Заявки будут отправляться в Telegram.
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            Заполните оба поля, чтобы заявки приходили в Telegram.
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" && <Check className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            "Сохранить"
          )}
        </button>
        <button
          type="button"
          onClick={handleTestMessage}
          disabled={isTesting || !isConfigured}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-medium rounded-lg transition-colors"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Отправка...
            </>
          ) : (
            "Тест"
          )}
        </button>
      </div>
    </form>
  );
}
