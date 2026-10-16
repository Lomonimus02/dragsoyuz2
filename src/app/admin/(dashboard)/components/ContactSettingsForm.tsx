"use client";

import { useState, useRef } from "react";
import { updateGlobalSettings, GlobalSettingsData } from "@/app/actions";
import { Phone, Mail, MapPin, Clock, Send, Loader2, Check, Upload, X, ImageIcon, MessageCircle, Eye } from "lucide-react";
import Image from "next/image";

interface ContactSettingsFormProps {
  initialData: GlobalSettingsData;
}

export function ContactSettingsForm({ initialData }: ContactSettingsFormProps) {
  const [form, setForm] = useState({
    phoneNumber: initialData.phoneNumber || "",
    email: initialData.email || "",
    telegramUsername: initialData.telegramUsername || "",
    vkLink: initialData.vkLink || "",
    address: initialData.address || "",
    workSchedule: initialData.workSchedule || "",
  });
  const [showArrivalNotice, setShowArrivalNotice] = useState(initialData.showArrivalNotice ?? true);
  const [arrivalNoticeText, setArrivalNoticeText] = useState(
    initialData.arrivalNoticeText ||
      "❗️Время прибытия необходимо согласовать заранее❗️",
  );
  const [storePhotoUrls, setStorePhotoUrls] = useState<string[]>(initialData.storePhotoUrls ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setMessage(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (storePhotoUrls.length >= 3) {
      setMessage({ type: "error", text: "Максимум 3 фотографии" });
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (result.success) {
        setStorePhotoUrls(prev => [...prev, result.url]);
        setMessage({ type: "success", text: "Фото загружено" });
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка загрузки" });
      }
    } catch {
      setMessage({ type: "error", text: "Ошибка при загрузке файла" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setStorePhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateGlobalSettings({
        phoneNumber: form.phoneNumber,
        email: form.email,
        telegramUsername: form.telegramUsername,
        vkLink: form.vkLink,
        address: form.address,
        workSchedule: form.workSchedule,
        storePhotoUrls: storePhotoUrls,
        showArrivalNotice: showArrivalNotice,
        arrivalNoticeText: arrivalNoticeText,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Контактные данные сохранены!" });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Произошла ошибка при сохранении" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Phone Number */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Phone className="w-4 h-4 text-slate-400" />
          Телефон
        </label>
        <input
          type="text"
          value={form.phoneNumber}
          onChange={handleChange("phoneNumber")}
          placeholder="+7 (812) 983-49-76"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">
          Формат: +7 (XXX) XXX-XX-XX
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Mail className="w-4 h-4 text-slate-400" />
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="info@dragsoyuz.ru"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Send className="w-4 h-4 text-slate-400" />
          Telegram
        </label>
        <input
          type="text"
          value={form.telegramUsername}
          onChange={handleChange("telegramUsername")}
          placeholder="dragsoyuz"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">
          Введите имя пользователя без @ (например: dragsoyuz)
        </p>
      </div>

      {/* VK Link */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <MessageCircle className="w-4 h-4 text-slate-400" />
          Ссылка на ВКонтакте (VK)
        </label>
        <input
          type="text"
          value={form.vkLink}
          onChange={handleChange("vkLink")}
          placeholder="https://vk.com/dragsoyuz"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">
          Например: https://vk.com/dragsoyuz
        </p>
      </div>

      {/* Address */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          Адрес
        </label>
        <textarea
          value={form.address}
          onChange={handleChange("address")}
          placeholder="г. Санкт-Петербург, ул. Примерная, д. 1"
          rows={2}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
        />
      </div>

      {/* Work Schedule */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          Режим работы
        </label>
        <textarea
          value={form.workSchedule}
          onChange={handleChange("workSchedule")}
          placeholder="Пн-Пт: 10:00 - 18:00&#10;Сб: по записи&#10;Вс: выходной"
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          Каждая строка — отдельный день/период
        </p>
      </div>

      {/* Store Photos */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          Фото магазина ({storePhotoUrls.length}/3)
        </label>
        <div className="space-y-3">
          {storePhotoUrls.length < 3 && (
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-700">
                  {isUploading ? "Загрузка..." : "Добавить фото"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          )}
          <p className="text-xs text-slate-500">
            JPG, PNG, WebP, GIF или HEIC. Максимум 5MB. До 3 фотографий.
          </p>
          {storePhotoUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {storePhotoUrls.map((url, index) => (
                <div key={url} className="relative group">
                  <div className="w-48 h-32 rounded-lg overflow-hidden border border-slate-200">
                    <Image
                      src={url}
                      alt={`Фото магазина ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Удалить"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Arrival Notice */}
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={showArrivalNotice}
              onChange={(e) => {
                setShowArrivalNotice(e.target.checked);
                setMessage(null);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              Показывать плашку над шапкой сайта
            </span>
          </div>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Текст плашки
          </label>
          <textarea
            value={arrivalNoticeText}
            onChange={(e) => {
              setArrivalNoticeText(e.target.value);
              setMessage(null);
            }}
            rows={2}
            placeholder="❗️Время прибытия необходимо согласовать заранее❗️"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Этот текст виден сверху сайта, над меню. Можно скрыть плашку переключателем выше.
          </p>
        </div>
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Сохранить контакты"
        )}
      </button>
    </form>
  );
}
