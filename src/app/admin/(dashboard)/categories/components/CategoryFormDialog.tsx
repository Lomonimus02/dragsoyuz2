"use client";

import { useState, useTransition, ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  createCategory,
  updateCategory,
  type CategoryData,
} from "@/app/actions";
import { getMetalLabel } from "@/lib/precious-metals";
import {
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface CategoryFormDialogProps {
  categories: CategoryData[];
  editCategory?: CategoryData;
  trigger?: ReactNode;
}

interface FormData {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: number;
  childSortOrder: number; // Позиция родительской категории среди подкатегорий
  warningMessage: string;
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

export function CategoryFormDialog({
  categories,
  editCategory,
  trigger,
}: CategoryFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const isEditing = !!editCategory;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: editCategory?.name || "",
      slug: editCategory?.slug || "",
      parentId: editCategory?.parentId || "",
      sortOrder: editCategory?.sortOrder ?? 0,
      childSortOrder: editCategory?.childSortOrder ?? 0,
      warningMessage: editCategory?.warningMessage || "",
      customRateAu: editCategory?.customRateAu?.toString() || "",
      customRateAg: editCategory?.customRateAg?.toString() || "",
      customRatePt: editCategory?.customRatePt?.toString() || "",
      customRatePd: editCategory?.customRatePd?.toString() || "",
      customRateTa: editCategory?.customRateTa?.toString() || "",
    },
  });

  const handleOpen = () => {
    setIsOpen(true);
    setNotification(null);
    reset({
      name: editCategory?.name || "",
      slug: editCategory?.slug || "",
      parentId: editCategory?.parentId || "",
      sortOrder: editCategory?.sortOrder ?? 0,
      childSortOrder: editCategory?.childSortOrder ?? 0,
      warningMessage: editCategory?.warningMessage || "",
      customRateAu: editCategory?.customRateAu?.toString() || "",
      customRateAg: editCategory?.customRateAg?.toString() || "",
      customRatePt: editCategory?.customRatePt?.toString() || "",
      customRatePd: editCategory?.customRatePd?.toString() || "",
      customRateTa: editCategory?.customRateTa?.toString() || "",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setNotification(null);
  };

  // Следим за parentId для условного отображения childSortOrder
  const watchParentId = watch("parentId");
  const isRootCategory = !watchParentId;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditing && name) {
      setValue("slug", generateSlug(name));
    }
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
          handleClose();
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
    <>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить категорию
        </button>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-slate-800">
                {isEditing ? "Редактировать категорию" : "Новая категория"}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Notification */}
              {notification && (
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                    notification.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {notification.type === "success" ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
              )}

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
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="Конденсаторы"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
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
                    errors.slug
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="kondensatory"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.slug.message}
                  </p>
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
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Без родителя (корневая)</option>
                  {availableParents.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label
                  htmlFor="cat-sortOrder"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Порядковый номер (Сортировка на /catalog)
                </label>
                <input
                  type="number"
                  id="cat-sortOrder"
                  step="1"
                  {...register("sortOrder", { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0 = авто"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {isRootCategory 
                    ? "Позиция категории на странице /catalog. Оставьте 0 для авто."
                    : "Позиция подкатегории среди других подкатегорий. Оставьте 0 для авто."
                  }
                </p>
              </div>

              {/* Child Sort Order - только для корневых категорий */}
              {isRootCategory && (
                <div>
                  <label
                    htmlFor="cat-childSortOrder"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Позиция среди подкатегорий (Внутри категории)
                  </label>
                  <input
                    type="number"
                    id="cat-childSortOrder"
                    step="1"
                    {...register("childSortOrder", { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0 = товары этой категории первыми"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Определяет порядок товаров этой категории относительно подкатегорий. 
                    <br />0 = товары родительской категории идут первыми.
                  </p>
                </div>
              )}

              {/* Warning Message */}
              <div>
                <label
                  htmlFor="cat-warningMessage"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Предупреждение (Инфо-блок)
                </label>
                <textarea
                  id="cat-warningMessage"
                  rows={3}
                  {...register("warningMessage")}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                  placeholder="Например: С 1990 года минус 10% от стоимости..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  Если оставить пустым — блок не будет отображаться на сайте
                </p>
              </div>

              {/* Custom Metal Rates Section */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  Специальные курсы (Опционально)
                </h3>
                <p className="text-xs text-amber-600 mb-4">
                  ⚠️ Заполнять, ТОЛЬКО если для этой категории цена металла отличается от биржевой. Иначе оставить пустым.
                </p>
                <div className="grid grid-cols-2 gap-3">
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                        placeholder="—"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        ₽/мг
                      </span>
                    </div>
                  </div>

                  {/* Ag - Серебро */}
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
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
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-16"
                        placeholder="—"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        ₽/г
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Сохранить
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
