"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { CategoryBannerAlign, CategoryBannerTheme } from "@prisma/client";
import {
  BANNER_ALIGN_OPTIONS,
  BANNER_GOLD_TEXT_COLOR,
  BANNER_TEXT_COLOR_PRESETS,
  BANNER_THEME_OPTIONS,
  type CategoryBannerConfig,
} from "@/lib/category-banner";
import { CategoryBanners } from "@/app/(root)/components/CategoryBanner";
import { AlignCenter, AlignLeft, AlignRight, Upload, X } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface CategoryBannerFormValues {
  bannerTitle: string;
  bannerAlign: CategoryBannerAlign;
  bannerTheme: CategoryBannerTheme;
  bannerImageUrl: string;
  bannerLinkUrl: string;
  bannerLinkLabel: string;
  bannerTextColor: string;
  bannerTitleLines: boolean;
}

interface CategoryBannerEditorProps {
  categoryName: string;
  categorySlug: string;
  warningMessage: string;
  bannerTextLegacy: string;
  infoPageEnabled?: boolean;
  infoPageButtonLabel?: string | null;
  infoPageButtonColor?: string | null;
  infoPageButtonTextColor?: string | null;
  values: CategoryBannerFormValues;
  onWarningMessageChange: (value: string) => void;
  onChange: <K extends keyof CategoryBannerFormValues>(
    key: K,
    value: CategoryBannerFormValues[K],
  ) => void;
  registerTitleLines: UseFormRegisterReturn<"bannerTitleLines">;
}

export function CategoryBannerEditor({
  categoryName,
  categorySlug,
  warningMessage,
  bannerTextLegacy,
  infoPageEnabled = false,
  infoPageButtonLabel,
  infoPageButtonColor,
  infoPageButtonTextColor,
  values,
  onWarningMessageChange,
  onChange,
  registerTitleLines,
}: CategoryBannerEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const previewBanner: CategoryBannerConfig = {
    title: values.bannerTitle.trim() || null,
    align: values.bannerAlign,
    theme: values.bannerTheme,
    imageUrl: values.bannerImageUrl.trim() || null,
    linkUrl: values.bannerLinkUrl.trim() || null,
    linkLabel: values.bannerLinkLabel.trim() || null,
    textColor: values.bannerTextColor.trim() || null,
    titleLines: values.bannerTitleLines,
    showGuide: true,
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        setUploadError("Не удалось загрузить изображение");
        return;
      }

      const result = await response.json();
      if (result.success) {
        onChange("bannerImageUrl", result.url);
        onChange("bannerTheme", "IMAGE");
      } else {
        setUploadError(result.error || "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasPreviewContent =
    !!warningMessage.trim() ||
    !!values.bannerTitle.trim() ||
    !!bannerTextLegacy.trim();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Баннер на странице категории
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Информационный блок над списком товаров. Если текст пустой — баннер не показывается.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Текст баннера
          </label>
          <textarea
            rows={4}
            value={warningMessage}
            onChange={(e) => onWarningMessageChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 resize-y"
            placeholder="Например: С 1990 года минус 10% от стоимости..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Заголовок <span className="text-slate-400 font-normal">(необязательно)</span>
          </label>
          <input
            type="text"
            value={values.bannerTitle}
            onChange={(e) => onChange("bannerTitle", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            placeholder="Например: МИКРОСХЕМЫ"
          />
          <p className="mt-1 text-xs text-slate-500">
            Для линий по бокам — укажите заголовок или первую строку в тексте баннера
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <input
            type="checkbox"
            {...registerTitleLines}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Декоративные линии у заголовка
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Горизонтальные полоски по бокам заголовка. Работает с полем «Заголовок» или с первой строкой текста.
            </span>
          </span>
        </label>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Выравнивание
          </span>
          <div className="flex gap-2">
            {BANNER_ALIGN_OPTIONS.map((option) => {
              const Icon =
                option.value === "CENTER"
                  ? AlignCenter
                  : option.value === "RIGHT"
                    ? AlignRight
                    : AlignLeft;
              const active = values.bannerAlign === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange("bannerAlign", option.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Стиль
          </span>
          <div className="flex flex-wrap gap-2">
            {BANNER_THEME_OPTIONS.map((option) => {
              const active = values.bannerTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.description}
                  onClick={() => onChange("bannerTheme", option.value)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">
            Цвет текста
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {BANNER_TEXT_COLOR_PRESETS.map((preset) => {
              const isActive =
                preset.color === null
                  ? !values.bannerTextColor.trim()
                  : values.bannerTextColor.trim().toLowerCase() ===
                    preset.color.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onChange("bannerTextColor", preset.color ?? "")
                  }
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    isActive
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {preset.id === "gold" && (
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle border border-amber-400/50"
                      style={{ backgroundColor: BANNER_GOLD_TEXT_COLOR }}
                    />
                  )}
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={
                /^#[0-9A-Fa-f]{6}$/.test(values.bannerTextColor.trim())
                  ? values.bannerTextColor.trim()
                  : BANNER_GOLD_TEXT_COLOR
              }
              onChange={(e) => onChange("bannerTextColor", e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
              title="Выбрать цвет"
            />
            <input
              type="text"
              value={values.bannerTextColor}
              onChange={(e) => onChange("bannerTextColor", e.target.value)}
              placeholder="#E8C547"
              className="w-32 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
            <span className="text-xs text-slate-500">
              Свой hex-цвет или «По умолчанию» — цвет из стиля темы
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ссылка (URL)
            </label>
            <input
              type="text"
              value={values.bannerLinkUrl}
              onChange={(e) => onChange("bannerLinkUrl", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="/contacts"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Текст кнопки
            </label>
            <input
              type="text"
              value={values.bannerLinkLabel}
              onChange={(e) => onChange("bannerLinkLabel", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Подробнее"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Фоновое изображение
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm">
              <Upload className="w-4 h-4 text-slate-500" />
              {isUploading ? "Загрузка..." : "Загрузить фото"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {values.bannerImageUrl && (
              <button
                type="button"
                onClick={() => onChange("bannerImageUrl", "")}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Удалить фото
              </button>
            )}
          </div>
          {uploadError && (
            <p className="mt-1 text-sm text-red-600">{uploadError}</p>
          )}
          {values.bannerImageUrl && (
            <div className="relative mt-3 h-28 w-full max-w-md rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={values.bannerImageUrl}
                alt="Фон баннера"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onChange("bannerImageUrl", "")}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Превью</p>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          {hasPreviewContent || infoPageEnabled ? (
            <CategoryBanners
              categoryName={categoryName || "Категория"}
              categorySlug={categorySlug || "preview"}
              warningMessage={warningMessage.trim() || null}
              bannerTextLegacy={bannerTextLegacy.trim() || null}
              banner={previewBanner}
              infoPageEnabled={infoPageEnabled}
              infoPageButtonLabel={infoPageButtonLabel}
              infoPageButtonColor={infoPageButtonColor}
              infoPageButtonTextColor={infoPageButtonTextColor}
            />
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              Заполните текст баннера, чтобы увидеть превью
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
