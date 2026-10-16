"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createCategory,
  updateCategory,
  type CategoryData,
} from "@/app/actions";
import { CategoryBannerEditor } from "./CategoryBannerEditor";
import { CategoryInfoPageEditor } from "./CategoryInfoPageEditor";
import { getMetalLabel } from "@/lib/precious-metals";
import type { CategoryBannerAlign, CategoryBannerTheme } from "@prisma/client";
import {
  defaultInfoButtonLabel,
  parseInfoPageBlocks,
  type CategoryInfoBlock,
} from "@/lib/category-info";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

interface CategoryFormProps {
  categories: CategoryData[];
  editCategory?: CategoryData;
  defaultParentId?: string;
  redirectPath?: string;
}

interface FormData {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: number;
  childSortOrder: number;
  warningMessage: string;
  bannerTitle: string;
  bannerAlign: CategoryBannerAlign;
  bannerTheme: CategoryBannerTheme;
  bannerImageUrl: string;
  bannerLinkUrl: string;
  bannerLinkLabel: string;
  bannerTextColor: string;
  bannerTitleLines: boolean;
  // Закрепить управление курсом на Дашборде
  isPinnedToDashboard: boolean;
  // Кастомные курсы металлов (цена за 1 мг в рублях)
  customRateAu: string;
  customRateAg: string;
  customRatePt: string;
  customRatePd: string;
  customRateTa: string;
}

type NotificationType = "success" | "error" | null;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryForm({
  categories,
  editCategory,
  defaultParentId,
  redirectPath,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState<string>(editCategory?.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [infoPageEnabled, setInfoPageEnabled] = useState(
    editCategory?.infoPageEnabled ?? false,
  );
  const [infoPageButtonLabel, setInfoPageButtonLabel] = useState(
    editCategory?.infoPageButtonLabel || "",
  );
  const [infoPageBlocks, setInfoPageBlocks] = useState<CategoryInfoBlock[]>(
    () => parseInfoPageBlocks(editCategory?.infoPageBlocks),
  );
  const [infoPageButtonColor, setInfoPageButtonColor] = useState(
    editCategory?.infoPageButtonColor || "",
  );
  const [infoPageButtonTextColor, setInfoPageButtonTextColor] = useState(
    editCategory?.infoPageButtonTextColor || "",
  );

  const isEditing = !!editCategory;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: editCategory?.name || "",
      slug: editCategory?.slug || "",
      parentId: editCategory?.parentId || defaultParentId || "",
      sortOrder: editCategory?.sortOrder ?? 0,
      childSortOrder: editCategory?.childSortOrder ?? 0,
      warningMessage:
        editCategory?.warningMessage ||
        editCategory?.bannerText ||
        "",
      bannerTitle: editCategory?.bannerTitle || "",
      bannerAlign: editCategory?.bannerAlign ?? "LEFT",
      bannerTheme: editCategory?.bannerTheme ?? "NOTICE",
      bannerImageUrl: editCategory?.bannerImageUrl || "",
      bannerLinkUrl: editCategory?.bannerLinkUrl || "",
      bannerLinkLabel: editCategory?.bannerLinkLabel || "",
      bannerTextColor: editCategory?.bannerTextColor || "",
      bannerTitleLines: editCategory?.bannerTitleLines ?? false,
      isPinnedToDashboard: editCategory?.isPinnedToDashboard ?? false,
      customRateAu: editCategory?.customRateAu?.toString() || "",
      customRateAg: editCategory?.customRateAg?.toString() || "",
      customRatePt: editCategory?.customRatePt?.toString() || "",
      customRatePd: editCategory?.customRatePd?.toString() || "",
      customRateTa: editCategory?.customRateTa?.toString() || "",
    },
  });

  // Смотрим parentId чтобы показать/скрыть childSortOrder
  const watchParentId = watch("parentId");
  const watchName = watch("name");
  const watchSlug = watch("slug");
  const watchWarningMessage = watch("warningMessage");
  const isRootCategory = !watchParentId && !defaultParentId;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditing && name) {
      setValue("slug", generateSlug(name));
    }
  };

  // Загрузка изображения
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
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
        const text = await response.text();
        console.error("Upload failed:", response.status, text);
        setNotification({
          type: "error",
          message: `Ошибка загрузки (${response.status}). Проверьте размер файла.`,
        });
        return;
      }

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.url);
        setNotification({
          type: "success",
          message: "Изображение загружено",
        });
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка загрузки",
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setNotification({
        type: "error",
        message: "Ошибка при загрузке файла. Попробуйте файл меньшего размера.",
      });
    } finally {
      setIsUploading(false);
      setImagePreview("");
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Удаление изображения
  const handleRemoveImage = () => {
    setImageUrl("");
  };

  const onSubmit = (data: FormData) => {
    setNotification(null);

    // Преобразуем кастомные курсы: пустая строка -> null, иначе число
    const parseRate = (value: string): number | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const num = parseFloat(trimmed);
      return isNaN(num) ? null : num;
    };

    startTransition(async () => {
      let result;

      if (isEditing) {
        result = await updateCategory({
          id: editCategory.id,
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          childSortOrder: data.childSortOrder,
          warningMessage: data.warningMessage || null,
          imageUrl: imageUrl || null,
          bannerEnabled: !!(data.warningMessage?.trim() || data.bannerTitle?.trim()),
          bannerTitle: data.bannerTitle || null,
          bannerText: null,
          bannerAlign: data.bannerAlign,
          bannerTheme: data.bannerTheme,
          bannerImageUrl: data.bannerImageUrl || null,
          bannerLinkUrl: data.bannerLinkUrl || null,
          bannerLinkLabel: data.bannerLinkLabel || null,
          bannerTextColor: data.bannerTextColor || null,
          bannerTitleLines: data.bannerTitleLines,
          infoPageEnabled,
          infoPageButtonLabel: infoPageButtonLabel.trim() || null,
          infoPageButtonColor: infoPageButtonColor.trim() || null,
          infoPageButtonTextColor: infoPageButtonTextColor.trim() || null,
          infoPageBlocks,
          isPinnedToDashboard: data.isPinnedToDashboard,
          customRateAu: parseRate(data.customRateAu),
          customRateAg: parseRate(data.customRateAg),
          customRatePt: parseRate(data.customRatePt),
          customRatePd: parseRate(data.customRatePd),
          customRateTa: parseRate(data.customRateTa),
        });
      } else {
        result = await createCategory({
          name: data.name,
          slug: data.slug,
          parentId: data.parentId || null,
          sortOrder: data.sortOrder,
          childSortOrder: data.childSortOrder,
          warningMessage: data.warningMessage || null,
          imageUrl: imageUrl || null,
          bannerEnabled: !!(data.warningMessage?.trim() || data.bannerTitle?.trim()),
          bannerTitle: data.bannerTitle || null,
          bannerText: null,
          bannerAlign: data.bannerAlign,
          bannerTheme: data.bannerTheme,
          bannerImageUrl: data.bannerImageUrl || null,
          bannerLinkUrl: data.bannerLinkUrl || null,
          bannerLinkLabel: data.bannerLinkLabel || null,
          bannerTextColor: data.bannerTextColor || null,
          bannerTitleLines: data.bannerTitleLines,
          infoPageEnabled,
          infoPageButtonLabel: infoPageButtonLabel.trim() || null,
          infoPageButtonColor: infoPageButtonColor.trim() || null,
          infoPageButtonTextColor: infoPageButtonTextColor.trim() || null,
          infoPageBlocks,
          isPinnedToDashboard: data.isPinnedToDashboard,
          customRateAu: parseRate(data.customRateAu),
          customRateAg: parseRate(data.customRateAg),
          customRatePt: parseRate(data.customRatePt),
          customRatePd: parseRate(data.customRatePd),
          customRateTa: parseRate(data.customRateTa),
        });
      }

      if (result.success) {
        setNotification({
          type: "success",
          message: isEditing ? "Категория обновлена" : "Категория создана",
        });
        setTimeout(() => {
          // Редирект в нужную папку каталога
          const targetPath = redirectPath || (data.parentId ? `/admin/catalog/${data.parentId}` : "/admin/catalog");
          router.push(targetPath);
        }, 1000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при сохранении",
        });
      }
    });
  };

  // Available parent categories (exclude self and children for editing)
  const availableParents = categories.filter((cat) => {
    if (!isEditing) return true;
    // Can't be parent of itself
    if (cat.id === editCategory.id) return false;
    // Can't select own children as parent (to prevent cycles)
    if (cat.parentId === editCategory.id) return false;
    return true;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          Основная информация
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="cat-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Название *
            </label>
            <input
              type="text"
              id="cat-name"
              {...register("name", { required: "Название обязательно" })}
              onChange={(e) => {
                register("name").onChange(e);
                handleNameChange(e);
              }}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              placeholder="Конденсаторы"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="cat-slug"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              URL (slug) *
            </label>
            <input
              type="text"
              id="cat-slug"
              {...register("slug", { required: "Slug обязателен" })}
              className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.slug ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              placeholder="kondensatory"
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
          </div>

          {/* Parent */}
          <div>
            <label
              htmlFor="cat-parent"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Родительская категория
            </label>
            <select
              id="cat-parent"
              {...register("parentId")}
              disabled={!!defaultParentId && !isEditing}
              className={`w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                defaultParentId && !isEditing ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Без родителя (корневая)</option>
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {defaultParentId && !isEditing && (
              <p className="mt-1 text-xs text-slate-500">
                Категория будет создана внутри выбранной папки
              </p>
            )}
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="cat-sortOrder"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Порядковый номер (Сортировка)
            </label>
            <input
              type="number"
              id="cat-sortOrder"
              step="1"
              {...register("sortOrder", { valueAsNumber: true })}
              className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-slate-500">
              Чем меньше число, тем выше категория в списке
            </p>
          </div>

          {/* Child Sort Order - только для корневых категорий */}
          {isRootCategory && (
            <div>
              <label
                htmlFor="cat-childSortOrder"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Порядок среди подкатегорий (для отображения товаров)
              </label>
              <input
                type="number"
                id="cat-childSortOrder"
                step="1"
                {...register("childSortOrder", { valueAsNumber: true })}
                className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-slate-500">
                Определяет позицию товаров родительской категории среди подкатегорий.
                Например: 0 = первыми, 100 = последними.
              </p>
            </div>
          )}

          {/* Баннер категории */}
          <CategoryBannerEditor
            categoryName={watchName}
            categorySlug={watchSlug}
            warningMessage={watchWarningMessage}
            bannerTextLegacy={editCategory?.bannerText || ""}
            infoPageEnabled={infoPageEnabled}
            infoPageButtonLabel={
              infoPageButtonLabel.trim() || defaultInfoButtonLabel(watchName)
            }
            infoPageButtonColor={infoPageButtonColor}
            infoPageButtonTextColor={infoPageButtonTextColor}
            values={{
              bannerTitle: watch("bannerTitle"),
              bannerAlign: watch("bannerAlign"),
              bannerTheme: watch("bannerTheme"),
              bannerImageUrl: watch("bannerImageUrl"),
              bannerLinkUrl: watch("bannerLinkUrl"),
              bannerLinkLabel: watch("bannerLinkLabel"),
              bannerTextColor: watch("bannerTextColor"),
              bannerTitleLines: watch("bannerTitleLines"),
            }}
            onWarningMessageChange={(value) =>
              setValue("warningMessage", value, { shouldDirty: true })
            }
            registerTitleLines={register("bannerTitleLines")}
            onChange={(key, value) => {
              setValue(key as keyof FormData, value as never, { shouldDirty: true });
            }}
          />

          <CategoryInfoPageEditor
            categoryName={watchName}
            enabled={infoPageEnabled}
            buttonLabel={infoPageButtonLabel}
            buttonColor={infoPageButtonColor}
            buttonTextColor={infoPageButtonTextColor}
            blocks={infoPageBlocks}
            onEnabledChange={setInfoPageEnabled}
            onButtonLabelChange={setInfoPageButtonLabel}
            onButtonColorChange={setInfoPageButtonColor}
            onButtonTextColorChange={setInfoPageButtonTextColor}
            onBlocksChange={setInfoPageBlocks}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Изображение категории
            </label>
            <div className="space-y-3">
              {!imageUrl && (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
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
                </div>
              )}
              <p className="text-xs text-slate-500">
                JPG, PNG, WebP или GIF. Максимум 5MB.
              </p>
              {/* Превью загрузки */}
              {imagePreview && isUploading && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200 opacity-50">
                  <Image
                    src={imagePreview}
                    alt="Загрузка..."
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {/* Загруженное фото */}
              {imageUrl && (
                <div className="relative group inline-block">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                    <Image
                      src={imageUrl}
                      alt="Фото категории"
                      fill
                      className="object-cover"
                      onError={() => {
                        console.error("Failed to load image:", imageUrl);
                        setNotification({
                          type: "error",
                          message: "Не удалось загрузить изображение. Попробуйте загрузить другой файл.",
                        });
                        setImageUrl("");
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                    title="Удалить"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pin to Dashboard */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="cat-isPinnedToDashboard"
              {...register("isPinnedToDashboard")}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="cat-isPinnedToDashboard"
              className="text-sm font-medium text-slate-700 cursor-pointer select-none"
            >
              Закрепить управление курсом на Дашборде
            </label>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Если включено — поля специальных курсов этой категории будут отображаться на главной странице админки
          </p>
        </div>
      </div>

      {/* Custom Metal Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Специальные курсы (Опционально)
        </h2>
        <p className="text-sm text-amber-600 mb-6">
          ⚠️ Заполнять, ТОЛЬКО если для этой категории цена металла отличается от биржевой. Иначе оставить пустым.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Au - Золото */}
          <div>
            <label
              htmlFor="cat-customRateAu"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Au (Золото)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRateAu"
                step="any"
                min="0"
                {...register("customRateAu")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          {/* Ag - Серебро (г) */}
          <div>
            <label
              htmlFor="cat-customRateAg"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Ag (Серебро)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRateAg"
                step="any"
                min="0"
                {...register("customRateAg")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/г
              </span>
            </div>
          </div>

          {/* Pt - Платина */}
          <div>
            <label
              htmlFor="cat-customRatePt"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {getMetalLabel("Pt")}
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRatePt"
                step="any"
                min="0"
                {...register("customRatePt")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          {/* Pd - Палладий */}
          <div>
            <label
              htmlFor="cat-customRatePd"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Pd (Палладий)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRatePd"
                step="any"
                min="0"
                {...register("customRatePd")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/мг
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="cat-customRateTa"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Ta (Тантал)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cat-customRateTa"
                step="any"
                min="0"
                {...register("customRateTa")}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                placeholder="—"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₽/г
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isEditing ? "Сохранить изменения" : "Создать категорию"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
