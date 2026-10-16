"use client";

import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  type ProductWithPrice,
  type CategoryData,
  type MetalRatesData,
  type UnitType,
  type InventoryMetalsMode,
} from "@/app/actions";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Package,
  Upload,
  X,
  Calculator,
  Trash2,
  Plus,
  Layers,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getMetalDisplaySymbol } from "@/lib/precious-metals";
import {
  roundRublesToHundred,
  shouldRoundPriceToHundred,
} from "@/lib/hundred-price";

const DISPLAY_METAL_FIELDS = [
  { key: "displayContentGold" as const, label: "Золото", symbol: "Au", unit: "мг" },
  { key: "displayContentSilver" as const, label: "Серебро", symbol: "Ag", unit: "г" },
  { key: "displayContentPlatinum" as const, label: "Платина", symbol: getMetalDisplaySymbol("Pt"), unit: "мг" },
  { key: "displayContentPalladium" as const, label: "Палладий", symbol: "Pd", unit: "мг" },
  { key: "displayContentTantalum" as const, label: "Тантал", symbol: "Ta", unit: "г" },
];

interface ProductFormProps {
  product?: ProductWithPrice;
  categories: CategoryData[];
  metalRates: MetalRatesData;
  defaultCategoryId?: string;
  redirectPath?: string;
  showcaseFaceInfo?: { productName: string; productId: string } | null;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  pageDescription: string;
  image: string;
  seoH1: string;
  seoDescription: string;
  categoryId: string;
  sortOrder: number;
  // Единица измерения
  unitType: UnitType;
  // Наценка и тип товара
  priceMarkup: number;
  priceMarkupUsed: number;
  isSingleType: boolean;
  isPriceOnRequest: boolean;
  isShowcaseFace: boolean;
  inventoryMetalsMode: InventoryMetalsMode;
  // Содержание металлов для НОВЫХ
  contentGold: number;
  contentSilver: number;
  contentPlatinum: number;
  contentPalladium: number;
  contentTantalum: number;
  // Содержание металлов для Б/У
  contentGoldUsed: number;
  contentSilverUsed: number;
  contentPlatinumUsed: number;
  contentPalladiumUsed: number;
  contentTantalumUsed: number;
  displayContentGold: number;
  displayContentSilver: number;
  displayContentPlatinum: number;
  displayContentPalladium: number;
  displayContentTantalum: number;
  displayContentCustomized: boolean;
  showDisplayContent: boolean;
  isNewAvailable: boolean;
  isUsedAvailable: boolean;
  manualPriceNew: number | null;
  manualPriceUsed: number | null;
  // Модификации
  hasModifications: boolean;
  modLabel: string;
  modifications: {
    name: string;
    contentAu: number;
    contentAg: number;
    contentPt: number;
    contentPd: number;
    contentTa: number;
    contentAuUsed: number;
    contentAgUsed: number;
    contentPtUsed: number;
    contentPdUsed: number;
    contentTaUsed: number;
  }[];
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

export function ProductForm({ product, categories, metalRates, defaultCategoryId, redirectPath, showcaseFaceInfo }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [imageUrl, setImageUrl] = useState(product?.image || "");
  const [isUploading, setIsUploading] = useState(false);
  const [hasDescription, setHasDescription] = useState(!!(product?.description));
  const [hasPageDescription, setHasPageDescription] = useState(!!(product?.pageDescription));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!product;
  // Если передан defaultCategoryId - категория заблокирована
  const isCategoryLocked = !!defaultCategoryId && !isEditing;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      pageDescription: product?.pageDescription || "",
      image: product?.image || "",
      seoH1: product?.seoH1 || "",
      seoDescription: product?.seoDescription || "",
      categoryId: product?.categoryId || defaultCategoryId || "",
      sortOrder: product?.sortOrder ?? 0,
      // Единица измерения
      unitType: product?.unitType ?? "PIECE",
      // Наценка и тип товара
      priceMarkup: product?.priceMarkup ?? 1.0,
      priceMarkupUsed: product?.priceMarkupUsed ?? 1.0,
      isSingleType: product?.isSingleType ?? false,
      isPriceOnRequest: product?.isPriceOnRequest ?? false,
      isShowcaseFace: product?.isShowcaseFace ?? false,
      inventoryMetalsMode: product?.inventoryMetalsMode ?? "AUTO",
      // Содержание металлов для НОВЫХ
      contentGold: product?.contentGold || 0,
      contentSilver: product?.contentSilver || 0,
      contentPlatinum: product?.contentPlatinum || 0,
      contentPalladium: product?.contentPalladium || 0,
      contentTantalum: product?.contentTantalum || 0,
      // Содержание металлов для Б/У
      contentGoldUsed: product?.contentGoldUsed || 0,
      contentSilverUsed: product?.contentSilverUsed || 0,
      contentPlatinumUsed: product?.contentPlatinumUsed || 0,
      contentPalladiumUsed: product?.contentPalladiumUsed || 0,
      contentTantalumUsed: product?.contentTantalumUsed || 0,
      displayContentGold: product?.displayContentGold ?? product?.contentGold ?? 0,
      displayContentSilver: product?.displayContentSilver ?? product?.contentSilver ?? 0,
      displayContentPlatinum: product?.displayContentPlatinum ?? product?.contentPlatinum ?? 0,
      displayContentPalladium: product?.displayContentPalladium ?? product?.contentPalladium ?? 0,
      displayContentTantalum: product?.displayContentTantalum ?? product?.contentTantalum ?? 0,
      displayContentCustomized: product?.displayContentCustomized ?? false,
      showDisplayContent: product?.showDisplayContent ?? true,
      isNewAvailable: product?.isNewAvailable ?? true,
      isUsedAvailable: product?.isUsedAvailable ?? true,
      manualPriceNew: product?.manualPriceNew || null,
      manualPriceUsed: product?.manualPriceUsed || null,
      // Модификации
      hasModifications: product?.hasModifications ?? false,
      modLabel: product?.modLabel ?? "Модификация",
      modifications: product?.modifications?.map((m) => ({
        name: m.name,
        contentAu: m.contentAu,
        contentAg: m.contentAg,
        contentPt: m.contentPt,
        contentPd: m.contentPd,
        contentTa: m.contentTa,
        contentAuUsed: m.contentAuUsed,
        contentAgUsed: m.contentAgUsed,
        contentPtUsed: m.contentPtUsed,
        contentPdUsed: m.contentPdUsed,
        contentTaUsed: m.contentTaUsed,
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "modifications",
  });

  const watchName = watch("name");
  const watchIsNewAvailable = watch("isNewAvailable");
  const watchIsUsedAvailable = watch("isUsedAvailable");
  const watchIsSingleType = watch("isSingleType");
  const watchHasModifications = watch("hasModifications");
  const watchPriceMarkup = watch("priceMarkup");
  const watchPriceMarkupUsed = watch("priceMarkupUsed");
  const watchCategoryId = watch("categoryId");
  const watchUnitType = watch("unitType");
  
  // Суффикс для содержания металлов в зависимости от единицы измерения
  const contentSuffix = useMemo(() => {
    switch (watchUnitType) {
      case "GRAM": return "мг/г";
      case "KG": return "мг/кг";
      default: return "мг/шт";
    }
  }, [watchUnitType]);
  
  // Watch содержание металлов для live calculator
  const watchContentGold = watch("contentGold");
  const watchContentSilver = watch("contentSilver");
  const watchContentPlatinum = watch("contentPlatinum");
  const watchContentPalladium = watch("contentPalladium");
  const watchContentTantalum = watch("contentTantalum");
  const watchContentGoldUsed = watch("contentGoldUsed");
  const watchContentSilverUsed = watch("contentSilverUsed");
  const watchContentPlatinumUsed = watch("contentPlatinumUsed");
  const watchContentPalladiumUsed = watch("contentPalladiumUsed");
  const watchContentTantalumUsed = watch("contentTantalumUsed");
  const watchDisplayContentCustomized = watch("displayContentCustomized");
  const watchManualPriceNew = watch("manualPriceNew");
  const watchManualPriceUsed = watch("manualPriceUsed");

  const hasFixedPrice =
    (watchManualPriceNew != null &&
      !Number.isNaN(watchManualPriceNew) &&
      watchManualPriceNew > 0) ||
    (watchManualPriceUsed != null &&
      !Number.isNaN(watchManualPriceUsed) &&
      watchManualPriceUsed > 0);

  // Синхронизация отображаемого содержания с расчётным (пока не изменено вручную)
  useEffect(() => {
    if (watchHasModifications || watchDisplayContentCustomized || hasFixedPrice) return;
    setValue("displayContentGold", watchContentGold ?? 0);
    setValue("displayContentSilver", watchContentSilver ?? 0);
    setValue("displayContentPlatinum", watchContentPlatinum ?? 0);
    setValue("displayContentPalladium", watchContentPalladium ?? 0);
    setValue("displayContentTantalum", watchContentTantalum ?? 0);
  }, [
    watchContentGold,
    watchContentSilver,
    watchContentPlatinum,
    watchContentPalladium,
    watchContentTantalum,
    watchDisplayContentCustomized,
    watchHasModifications,
    hasFixedPrice,
    setValue,
  ]);

  const syncDisplayFromPricing = () => {
    setValue("displayContentGold", watchContentGold ?? 0);
    setValue("displayContentSilver", watchContentSilver ?? 0);
    setValue("displayContentPlatinum", watchContentPlatinum ?? 0);
    setValue("displayContentPalladium", watchContentPalladium ?? 0);
    setValue("displayContentTantalum", watchContentTantalum ?? 0);
    setValue("displayContentCustomized", false);
  };

  // Получаем выбранную категорию для определения кастомных курсов
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === watchCategoryId);
  }, [categories, watchCategoryId]);

  // Расчёт цены на лету (Live Calculator)
  // Используем кастомные курсы категории если они заданы, иначе глобальные
  const calculatedPrices = useMemo(() => {
    // Если есть кастомный курс для категории — используем его, иначе глобальный
    const rateAu = selectedCategory?.customRateAu ?? metalRates.gold;
    const rateAg = selectedCategory?.customRateAg ?? metalRates.silver;
    const ratePt = selectedCategory?.customRatePt ?? metalRates.platinum;
    const ratePd = selectedCategory?.customRatePd ?? metalRates.palladium;
    const rateTa = selectedCategory?.customRateTa ?? metalRates.tantalum;
    
    const markup = watchPriceMarkup || 1.0;
    const markupUsed = watchPriceMarkupUsed || 1.0;
    
    // Цена за НОВОЕ (Au/Pt/Pd — мг*руб/мг, Ag/Ta — г*руб/г)
    const priceNew = (
      (watchContentGold || 0) * rateAu +
      (watchContentSilver || 0) * rateAg +
      (watchContentPlatinum || 0) * ratePt +
      (watchContentPalladium || 0) * ratePd +
      (watchContentTantalum || 0) * rateTa
    ) * markup;
    
    // Цена за Б/У (используем markupUsed)
    const priceUsed = (
      (watchContentGoldUsed || 0) * rateAu +
      (watchContentSilverUsed || 0) * rateAg +
      (watchContentPlatinumUsed || 0) * ratePt +
      (watchContentPalladiumUsed || 0) * ratePd +
      (watchContentTantalumUsed || 0) * rateTa
    ) * markupUsed;
    
    const roundToHundred = shouldRoundPriceToHundred({
      categorySlug: selectedCategory?.slug,
      categoryName: selectedCategory?.name,
      productName: watchName,
      unitType: watchUnitType,
    });

    return {
      priceNew: roundToHundred ? roundRublesToHundred(priceNew) : priceNew,
      priceUsed: roundToHundred ? roundRublesToHundred(priceUsed) : priceUsed,
    };
  }, [
    metalRates,
    selectedCategory,
    watchName,
    watchUnitType,
    watchPriceMarkup,
    watchPriceMarkupUsed,
    watchContentGold,
    watchContentSilver,
    watchContentPlatinum,
    watchContentPalladium,
    watchContentTantalum,
    watchContentGoldUsed,
    watchContentSilverUsed,
    watchContentPlatinumUsed,
    watchContentPalladiumUsed,
    watchContentTantalumUsed,
  ]);

  // Проверяем, используются ли кастомные курсы для выбранной категории
  const hasCustomRates = useMemo(() => {
    if (!selectedCategory) return false;
    return (
      selectedCategory.customRateAu !== null ||
      selectedCategory.customRateAg !== null ||
      selectedCategory.customRatePt !== null ||
      selectedCategory.customRatePd !== null ||
      selectedCategory.customRateTa !== null
    );
  }, [selectedCategory]);

  // Auto-generate slug from name
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

    // Показываем превью сразу
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.url);
        setImagePreview(result.url);
        setValue("image", result.url);
        setNotification({
          type: "success",
          message: "Изображение загружено",
        });
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка загрузки",
        });
        setImagePreview(imageUrl);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Ошибка при загрузке файла",
      });
      setImagePreview(imageUrl);
    } finally {
      setIsUploading(false);
      // Очищаем URL превью
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Удаление изображения
  const handleRemoveImage = () => {
    setImageUrl("");
    setImagePreview("");
    setValue("image", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: FormData) => {
    setNotification(null);
    console.log("=== Form onSubmit data ===", data);
    console.log("=== isSingleType value ===", data.isSingleType, typeof data.isSingleType);

    startTransition(async () => {
      let result;

      // Для единого типа товара:
      // - isNewAvailable = true (используется для единой цены)
      // - isUsedAvailable = false (Б/У недоступен)
      const isNewAvailable = data.isSingleType ? true : data.isNewAvailable;
      const isUsedAvailable = data.isSingleType ? false : data.isUsedAvailable;

      if (isEditing) {
        result = await updateProduct({
          id: product.id,
          name: data.name,
          slug: data.slug,
          description: hasDescription ? data.description || null : null,
          pageDescription: hasPageDescription ? data.pageDescription || null : null,
          image: data.image || null,
          seoH1: data.seoH1 || null,
          seoDescription: data.seoDescription || null,
          categoryId: data.categoryId,
          sortOrder: data.sortOrder,
          unitType: data.unitType,
          priceMarkup: data.priceMarkup,
          priceMarkupUsed: data.priceMarkupUsed,
          isSingleType: data.isSingleType,
          isPriceOnRequest: data.isPriceOnRequest,
          isShowcaseFace: data.isShowcaseFace,
          inventoryMetalsMode: data.inventoryMetalsMode,
          hasModifications: data.hasModifications,
          modLabel: data.modLabel,
          modifications: data.hasModifications ? data.modifications : [],
          contentGold: data.contentGold,
          contentSilver: data.contentSilver,
          contentPlatinum: data.contentPlatinum,
          contentPalladium: data.contentPalladium,
          contentTantalum: data.contentTantalum,
          contentGoldUsed: data.contentGoldUsed,
          contentSilverUsed: data.contentSilverUsed,
          contentPlatinumUsed: data.contentPlatinumUsed,
          contentPalladiumUsed: data.contentPalladiumUsed,
          contentTantalumUsed: data.contentTantalumUsed,
          displayContentGold: data.displayContentGold,
          displayContentSilver: data.displayContentSilver,
          displayContentPlatinum: data.displayContentPlatinum,
          displayContentPalladium: data.displayContentPalladium,
          displayContentTantalum: data.displayContentTantalum,
          displayContentCustomized: data.displayContentCustomized,
          showDisplayContent: data.showDisplayContent,
          isNewAvailable,
          isUsedAvailable,
          manualPriceNew: data.manualPriceNew,
          manualPriceUsed: data.manualPriceUsed,
        });
      } else {
        result = await createProduct({
          name: data.name,
          slug: data.slug,
          description: hasDescription ? data.description || null : null,
          pageDescription: hasPageDescription ? data.pageDescription || null : null,
          image: data.image || null,
          seoH1: data.seoH1 || null,
          seoDescription: data.seoDescription || null,
          categoryId: data.categoryId,
          sortOrder: data.sortOrder,
          unitType: data.unitType,
          priceMarkup: data.priceMarkup,
          priceMarkupUsed: data.priceMarkupUsed,
          isSingleType: data.isSingleType,
          isPriceOnRequest: data.isPriceOnRequest,
          isShowcaseFace: data.isShowcaseFace,
          inventoryMetalsMode: data.inventoryMetalsMode,
          hasModifications: data.hasModifications,
          modLabel: data.modLabel,
          modifications: data.hasModifications ? data.modifications : [],
          contentGold: data.contentGold,
          contentSilver: data.contentSilver,
          contentPlatinum: data.contentPlatinum,
          contentPalladium: data.contentPalladium,
          contentTantalum: data.contentTantalum,
          contentGoldUsed: data.contentGoldUsed,
          contentSilverUsed: data.contentSilverUsed,
          contentPlatinumUsed: data.contentPlatinumUsed,
          contentPalladiumUsed: data.contentPalladiumUsed,
          contentTantalumUsed: data.contentTantalumUsed,
          displayContentGold: data.displayContentGold,
          displayContentSilver: data.displayContentSilver,
          displayContentPlatinum: data.displayContentPlatinum,
          displayContentPalladium: data.displayContentPalladium,
          displayContentTantalum: data.displayContentTantalum,
          displayContentCustomized: data.displayContentCustomized,
          showDisplayContent: data.showDisplayContent,
          isNewAvailable,
          isUsedAvailable,
          manualPriceNew: data.manualPriceNew,
          manualPriceUsed: data.manualPriceUsed,
        });
      }

      if (result.success) {
        setNotification({
          type: "success",
          message: isEditing ? "Товар обновлён" : "Товар создан",
        });
        setTimeout(() => {
          // Используем redirectPath если передан, иначе возвращаемся в каталог категории
          const targetPath = redirectPath || `/admin/catalog/${data.categoryId}`;
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Основная информация
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Название *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name", { required: "Название обязательно" })}
                  onChange={(e) => {
                    register("name").onChange(e);
                    handleNameChange(e);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                  placeholder="Например: К10-17Б"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  URL (slug) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="slug"
                    {...register("slug", { required: "Slug обязателен" })}
                    className={`flex-1 px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.slug ? "border-red-300 bg-red-50" : "border-slate-300"
                    }`}
                    placeholder="k10-17b"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentName = watch("name");
                      if (currentName) {
                        setValue("slug", generateSlug(currentName));
                      }
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors text-sm whitespace-nowrap"
                    title="Сгенерировать из названия"
                  >
                    ↻ Из названия
                  </button>
                </div>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>

              {/* Описание для карточки */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDescription}
                    onChange={(e) => {
                      setHasDescription(e.target.checked);
                      if (!e.target.checked) {
                        setValue("description", "");
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Описание для карточки
                  </span>
                </label>
                {hasDescription && (
                  <div className="mt-2">
                    <textarea
                      id="description"
                      {...register("description")}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      placeholder="Краткое описание (2-3 предложения)"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Отображается в каталоге на карточке товара
                    </p>
                  </div>
                )}
              </div>

              {/* Описание для страницы товара */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPageDescription}
                    onChange={(e) => {
                      setHasPageDescription(e.target.checked);
                      if (!e.target.checked) {
                        setValue("pageDescription", "");
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Описание для страницы товара
                  </span>
                </label>
                {hasPageDescription && (
                  <div className="mt-2">
                    <textarea
                      id="pageDescription"
                      {...register("pageDescription")}
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[8rem]"
                      placeholder="Подробное описание для страницы товара"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Отображается на индивидуальной странице товара в блоке «Описание»
                    </p>
                  </div>
                )}
              </div>

              {/* SEO H1 */}
              <div>
                <label
                  htmlFor="seoH1"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  SEO H1 <span className="text-slate-400 font-normal">(заголовок на странице товара)</span>
                </label>
                <input
                  id="seoH1"
                  type="text"
                  {...register("seoH1")}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Например: Диоды 2Д504 (если пусто — используется название товара)"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Если заполнено — отображается как H1 вместо названия товара
                </p>
              </div>

              {/* SEO Description */}
              <div>
                <label
                  htmlFor="seoDescription"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  SEO Description <span className="text-slate-400 font-normal">(meta description страницы)</span>
                </label>
                <textarea
                  id="seoDescription"
                  rows={3}
                  {...register("seoDescription")}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Если пусто — генерируется автоматически: «Сдать {H1 или название} по высоким ценам в Санкт-Петербурге...»"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Если заполнено — используется как meta description вместо авто-шаблона
                </p>
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Категория *
                </label>
                <select
                  id="categoryId"
                  {...register("categoryId", { required: "Выберите категорию" })}
                  disabled={isCategoryLocked}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.categoryId ? "border-red-300 bg-red-50" : "border-slate-300"
                  } ${isCategoryLocked ? "bg-slate-100 cursor-not-allowed" : ""}`}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentName ? `${cat.parentName} → ` : ""}
                      {cat.name}
                    </option>
                  ))}
                </select>
                {isCategoryLocked && (
                  <p className="mt-1 text-xs text-slate-500">
                    Товар будет создан в выбранной категории
                  </p>
                )}
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Изображение
                </label>
                <input
                  type="hidden"
                  {...register("image")}
                />
                <div className="space-y-3">
                  {/* Upload button */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        {isUploading ? "Загрузка..." : "Выбрать файл"}
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
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить изображение"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    JPG, PNG, WebP или GIF. Максимум 5MB.
                  </p>
                  {imageUrl && (
                    <p className="text-xs text-green-600 truncate">
                      ✓ {imageUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Сортировка и настройки цены
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Порядковый номер
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  step="1"
                  {...register("sortOrder", { valueAsNumber: true })}
                  className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0 = авто"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Чем меньше число, тем выше товар. Оставьте 0 для авто-определения.
                </p>
              </div>

              {/* Unit Type */}
              <div>
                <label
                  htmlFor="unitType"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Единица измерения
                </label>
                <select
                  id="unitType"
                  {...register("unitType")}
                  className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="PIECE">Штука (шт)</option>
                  <option value="GRAM">Грамм (г)</option>
                  <option value="KG">Килограмм (кг)</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Определяет единицу цены (₽/шт, ₽/г, ₽/кг) и содержания металлов (мг/шт, мг/г, мг/кг)
                </p>
              </div>

              {/* Price Markup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="priceMarkup"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Наценка (Новое / Единое)
                  </label>
                  <input
                    type="number"
                    id="priceMarkup"
                    step="0.001"
                    min="0.1"
                    max="10"
                    {...register("priceMarkup", { valueAsNumber: true, min: 0.1, max: 10 })}
                    className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1.0"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    1.0 = без наценки, 0.9 = -10%, 1.15 = +15%
                  </p>
                </div>

                {/* Price Markup Used - показывается только если не единый тип */}
                {!watchIsSingleType && (
                  <div>
                    <label
                      htmlFor="priceMarkupUsed"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Наценка (Б/У)
                    </label>
                    <input
                      type="number"
                      id="priceMarkupUsed"
                      step="0.001"
                      min="0.1"
                      max="10"
                      {...register("priceMarkupUsed", { valueAsNumber: true, min: 0.1, max: 10 })}
                      className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="1.0"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Отдельная наценка для Б/У товаров
                    </p>
                  </div>
                )}
              </div>

              {/* Price On Request Toggle */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isPriceOnRequest")}
                    className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-amber-800">
                      Цена по запросу
                    </span>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Скрывает цену на сайте, вместо неё показывается &quot;Цена по запросу&quot;
                    </p>
                  </div>
                </label>
              </div>

              {/* Single Type Toggle */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watchIsSingleType}
                    onChange={(e) => setValue("isSingleType", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-purple-800">
                      Товар без разделения на Новый/Б/У (Единая цена)
                    </span>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Если включено — будет использоваться только блок &quot;Новое&quot; как основная цена
                    </p>
                  </div>
                </label>
              </div>

              {/* Showcase Face Toggle */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isShowcaseFace")}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-indigo-800">
                      Сделать лицом категории на Главной странице
                    </span>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Этот товар будет отображаться как представитель категории в витрине на главной
                    </p>
                  </div>
                </label>
                {showcaseFaceInfo && showcaseFaceInfo.productId !== product?.id && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                    Сейчас образцом витрины назначен: <strong>{showcaseFaceInfo.productName}</strong>. При включении галочки он будет заменён.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Учёт золота в описи — и для товаров с модификациями */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Учёт в описи
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Влияет на внутренний отчёт по золоту (Au) и строку «Итого
              золотосодержащие». На цену не влияет.
            </p>
            <div className="space-y-2">
              {(
                [
                  {
                    value: "AUTO" as const,
                    label: "Автоматически (по категории)",
                  },
                  {
                    value: "INCLUDE" as const,
                    label: "Учитывать в описи",
                  },
                  {
                    value: "EXCLUDE" as const,
                    label: "Не учитывать в описи",
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...register("inventoryMetalsMode")}
                    className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Modifications Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watchHasModifications}
                  onChange={(e) => setValue("hasModifications", e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-sm font-medium text-cyan-800 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Товар с модификациями (разное сопротивление, количество контактов и т.д.)
                  </span>
                  <p className="text-xs text-cyan-600 mt-0.5">
                    Вместо стандартных полей содержания будет таблица модификаций с индивидуальными составами
                  </p>
                </div>
              </label>
            </div>

            {/* Название колонки модификаций */}
            {watchHasModifications && (
              <div className="mt-4">
                <label
                  htmlFor="modLabel"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Название колонки для модификаций
                </label>
                <input
                  type="text"
                  id="modLabel"
                  {...register("modLabel")}
                  className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Модификация"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Например: Сопротивление, Тип, Объём, Номинал
                </p>
              </div>
            )}
          </div>

          {/* Modifications Table (when hasModifications = true) */}
          {watchHasModifications && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-600" />
                  Модификации ({fields.length})
                </h2>
                <button
                  type="button"
                  onClick={() => append({
                    name: "",
                    contentAu: 0,
                    contentAg: 0,
                    contentPt: 0,
                    contentPd: 0,
                    contentTa: 0,
                    contentAuUsed: 0,
                    contentAgUsed: 0,
                    contentPtUsed: 0,
                    contentPdUsed: 0,
                    contentTaUsed: 0,
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить модификацию
                </button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нет модификаций. Нажмите &quot;Добавить модификацию&quot;.</p>
                </div>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить модификацию"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modification Name */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Название модификации *
                      </label>
                      <input
                        type="text"
                        {...register(`modifications.${index}.name` as const, { required: true })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Например: ПТП-1 R=1 кОм"
                      />
                    </div>

                    <div className={`grid grid-cols-1 ${watchIsSingleType ? "" : "md:grid-cols-2"} gap-4`}>
                      {/* Содержание металлов — Новое */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-xs font-semibold text-green-800 mb-2">
                          {watchIsSingleType ? "Содержание (Единая цена)" : "Новое"}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "contentAu" as const, symbol: "Au", unit: "мг" },
                            { key: "contentAg" as const, symbol: "Ag", unit: "г" },
                            { key: "contentPt" as const, symbol: getMetalDisplaySymbol("Pt"), unit: "мг" },
                            { key: "contentPd" as const, symbol: "Pd", unit: "мг" },
                            { key: "contentTa" as const, symbol: "Ta", unit: "г" },
                          ].map((metal) => (
                            <div key={metal.key}>
                              <label className="block text-xs text-slate-500 mb-0.5">
                                {metal.symbol} ({metal.unit})
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                {...register(`modifications.${index}.${metal.key}` as const, { valueAsNumber: true, min: 0 })}
                                className="w-full px-2 py-1.5 text-sm rounded border border-green-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Содержание металлов — Б/У (скрываем при isSingleType) */}
                      {!watchIsSingleType && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="text-xs font-semibold text-amber-800 mb-2">Б/У</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "contentAuUsed" as const, symbol: "Au", unit: "мг" },
                              { key: "contentAgUsed" as const, symbol: "Ag", unit: "г" },
                              { key: "contentPtUsed" as const, symbol: getMetalDisplaySymbol("Pt"), unit: "мг" },
                              { key: "contentPdUsed" as const, symbol: "Pd", unit: "мг" },
                              { key: "contentTaUsed" as const, symbol: "Ta", unit: "г" },
                            ].map((metal) => (
                              <div key={metal.key}>
                                <label className="block text-xs text-slate-500 mb-0.5">
                                  {metal.symbol} ({metal.unit})
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  {...register(`modifications.${index}.${metal.key}` as const, { valueAsNumber: true, min: 0 })}
                                  className="w-full px-2 py-1.5 text-sm rounded border border-amber-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                  placeholder="0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {fields.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => append({
                      name: "",
                      contentAu: 0,
                      contentAg: 0,
                      contentPt: 0,
                      contentPd: 0,
                      contentTa: 0,
                      contentAuUsed: 0,
                      contentAgUsed: 0,
                      contentPtUsed: 0,
                      contentPdUsed: 0,
                      contentTaUsed: 0,
                    })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-cyan-700 bg-cyan-50 border border-cyan-200 text-sm rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить модификацию
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Metal content - NEW and USED in two columns */}
          {!watchHasModifications && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Содержание для расчёта цены ({contentSuffix})
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Используется для автоматического расчёта цен. Не отображается на сайте.
            </p>

            <div className={`grid grid-cols-1 ${watchIsSingleType ? "" : "md:grid-cols-2"} gap-6`}>
              {/* Содержание в НОВОМ */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-green-800">
                    {watchIsSingleType ? "Содержание металлов (Единая цена)" : "Содержание в НОВОМ"}
                  </h3>
                  {!watchIsSingleType && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="isNewAvailable"
                        checked={watchIsNewAvailable}
                        onChange={(e) => setValue("isNewAvailable", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xs font-medium text-green-700">Принимаем</span>
                    </label>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { key: "contentGold" as const, label: "Золото", symbol: "Au", unit: "мг" },
                    { key: "contentSilver" as const, label: "Серебро", symbol: "Ag", unit: "г" },
                    { key: "contentPlatinum" as const, label: "Платина", symbol: getMetalDisplaySymbol("Pt"), unit: "мг" },
                    { key: "contentPalladium" as const, label: "Палладий", symbol: "Pd", unit: "мг" },
                    { key: "contentTantalum" as const, label: "Тантал", symbol: "Ta", unit: "г" },
                  ].map((metal) => (
                    <div key={metal.key}>
                      <label
                        htmlFor={metal.key}
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        {metal.label} {metal.symbol} ({metal.unit})
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700">
                            {metal.symbol}
                          </span>
                        </div>
                        <input
                          type="number"
                          id={metal.key}
                          step="any"
                          min="0"
                          {...register(metal.key, { valueAsNumber: true, min: 0 })}
                          className="w-full pl-11 pr-14 py-2 text-sm rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                          {metal.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Live Price Calculator - Новое */}
                <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-2 text-green-800">
                    <Calculator className="w-4 h-4" />
                    <span className="text-xs font-medium">Примерная расчётная цена:</span>
                    <span className="text-sm font-bold">
                      {calculatedPrices.priceNew > 0 
                        ? `${calculatedPrices.priceNew.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`
                        : "—"
                      }
                    </span>
                    {hasCustomRates && (
                      <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                        Спец. курс
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Содержание в Б/У - скрываем при isSingleType */}
              {!watchIsSingleType && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-amber-800">
                      Содержание в Б/У
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="isUsedAvailable"
                        checked={watchIsUsedAvailable}
                        onChange={(e) => setValue("isUsedAvailable", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-medium text-amber-700">Принимаем</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: "contentGoldUsed" as const, label: "Золото", symbol: "Au", unit: "мг" },
                      { key: "contentSilverUsed" as const, label: "Серебро", symbol: "Ag", unit: "г" },
                      { key: "contentPlatinumUsed" as const, label: "Платина", symbol: getMetalDisplaySymbol("Pt"), unit: "мг" },
                      { key: "contentPalladiumUsed" as const, label: "Палладий", symbol: "Pd", unit: "мг" },
                      { key: "contentTantalumUsed" as const, label: "Тантал", symbol: "Ta", unit: "г" },
                    ].map((metal) => (
                      <div key={metal.key}>
                        <label
                          htmlFor={metal.key}
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          {metal.label} {metal.symbol} ({metal.unit})
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-amber-700">
                              {metal.symbol}
                            </span>
                          </div>
                          <input
                            type="number"
                            id={metal.key}
                            step="any"
                            min="0"
                            {...register(metal.key, { valueAsNumber: true, min: 0 })}
                            className="w-full pl-11 pr-14 py-2 text-sm rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                            {metal.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-amber-700">
                    Обычно меньше из-за скушенных ножек и т.д.
                  </p>
                  
                  {/* Live Price Calculator - Б/У */}
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Calculator className="w-4 h-4" />
                      <span className="text-xs font-medium">Примерная расчётная цена:</span>
                      <span className="text-sm font-bold">
                        {calculatedPrices.priceUsed > 0 
                          ? `${calculatedPrices.priceUsed.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`
                          : "—"
                        }
                      </span>
                      {hasCustomRates && (
                        <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                          Спец. курс
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Display metal content — always visible */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Содержание для отображения на сайте
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      {...register("showDisplayContent")}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Показывать на странице товара
                    </span>
                  </label>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {watch("showDisplayContent")
                    ? hasFixedPrice
                      ? "Товар с фиксированной ценой — задайте содержание для отображения вручную. На цену не влияет."
                      : "Блок виден покупателям. Не влияет на цены."
                    : "Блок скрыт на сайте — данные сохраняются в админке."}
                  {watch("showDisplayContent") &&
                    !hasFixedPrice &&
                    !watchDisplayContentCustomized &&
                    !watchHasModifications && (
                      <span className="text-indigo-600"> Синхронизировано с расчётным.</span>
                    )}
                </p>
              </div>
              {!watchHasModifications && !hasFixedPrice && (
                <button
                  type="button"
                  onClick={syncDisplayFromPricing}
                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                >
                  Подтянуть из расчётного
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DISPLAY_METAL_FIELDS.map((metal) => (
                  <div key={metal.key}>
                    <label
                      htmlFor={metal.key}
                      className="block text-xs font-medium text-slate-600 mb-1"
                    >
                      {metal.label} {metal.symbol} ({metal.unit})
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-slate-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-700">
                          {metal.symbol}
                        </span>
                      </div>
                      <input
                        type="number"
                        id={metal.key}
                        step="any"
                        min="0"
                        {...register(metal.key, {
                          valueAsNumber: true,
                          min: 0,
                          onChange: () => {
                            setValue("displayContentCustomized", true);
                          },
                        })}
                        className="w-full pl-11 pr-14 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                        {metal.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing - Manual prices */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Фиксированные цены
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Оставьте пустым для автоматического расчёта по формуле
            </p>

            <div className={`grid grid-cols-1 ${watchIsSingleType ? "" : "md:grid-cols-2"} gap-6`}>
              {/* New price */}
              {(watchIsNewAvailable || watchIsSingleType) && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <label
                    htmlFor="manualPriceNew"
                    className="block text-sm font-medium text-green-800 mb-2"
                  >
                    {watchIsSingleType ? "Фиксированная цена" : "Цена за НОВОЕ"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="manualPriceNew"
                      step="0.01"
                      min="0"
                      {...register("manualPriceNew", { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      placeholder="Авто"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Used price - скрываем при isSingleType */}
              {!watchIsSingleType && watchIsUsedAvailable && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <label
                    htmlFor="manualPriceUsed"
                    className="block text-sm font-medium text-amber-800 mb-2"
                  >
                    Цена за Б/У
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="manualPriceUsed"
                      step="0.01"
                      min="0"
                      {...register("manualPriceUsed", { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      placeholder="Авто"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      ₽
                    </span>
                  </div>
                </div>
              )}

              {/* Show message if both are disabled */}
              {!watchIsSingleType && !watchIsNewAvailable && !watchIsUsedAvailable && (
                <div className="col-span-full text-center py-4 text-slate-500 text-sm">
                  Включите приём &quot;Нового&quot; или &quot;Б/У&quot; в блоке выше
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-700 mb-4">
              Превью изображения
            </h3>
            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview("")}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-16 h-16 mb-2" />
                  <span className="text-sm">Нет изображения</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditing ? "Сохранить изменения" : "Создать товар"}
                  </>
                )}
              </button>

              <Link
                href="/admin/products"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад к списку
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
