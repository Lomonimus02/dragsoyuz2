"use client";

import { useState, useRef } from "react";
import { updateGlobalSettings, GlobalSettingsData } from "@/app/actions";
import { FileText, Loader2, Check, Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface AboutTextFormProps {
  initialData: GlobalSettingsData;
}

export function AboutTextForm({ initialData }: AboutTextFormProps) {
  const [aboutText, setAboutText] = useState(initialData.aboutText || "");
  const [aboutPhotoUrl, setAboutPhotoUrl] = useState(initialData.aboutPhotoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setAboutPhotoUrl(result.url);
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

  const handleRemovePhoto = () => {
    setAboutPhotoUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateGlobalSettings({ aboutText, aboutPhotoUrl });

      if (result.success) {
        setMessage({ type: "success", text: "Страница «О нас» сохранена!" });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch {
      setMessage({ type: "error", text: "Произошла ошибка при сохранении" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <FileText className="w-4 h-4 text-slate-400" />
          Текст для страницы «О нас»
        </label>
        <textarea
          value={aboutText}
          onChange={(e) => {
            setAboutText(e.target.value);
            setMessage(null);
          }}
          placeholder="Расскажите о вашей компании. Используйте Enter для разделения абзацев."
          rows={10}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-y"
        />
        <p className="text-xs text-slate-500 mt-1">
          Переносы строк (Enter) будут сохранены на странице сайта
        </p>
      </div>

      {/* Фото для страницы "О компании" */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          Фото для страницы «О компании»
        </label>
        <div className="space-y-3">
          {aboutPhotoUrl ? (
            <div className="relative group inline-block">
              <div className="relative w-64 h-44 rounded-lg overflow-hidden border border-slate-200">
                <Image
                  src={aboutPhotoUrl}
                  alt="Фото для страницы О компании"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Удалить"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-500" />
              <span className="text-sm text-slate-700">
                {isUploading ? "Загрузка..." : "Загрузить фото"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
          {aboutPhotoUrl && (
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors ml-3">
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-700">
                {isUploading ? "Загрузка..." : "Заменить"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          )}
          <p className="text-xs text-slate-500">
            Отображается на странице «О компании» рядом с текстом
          </p>
        </div>
      </div>

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
          "Сохранить текст"
        )}
      </button>
    </form>
  );
}
