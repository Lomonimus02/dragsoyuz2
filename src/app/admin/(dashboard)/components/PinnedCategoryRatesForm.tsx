"use client";

import { useState, useTransition } from "react";
import {
  updateCategoryRates,
  type CategoryData,
  type UpdateCategoryRatesInput,
} from "@/app/actions";
import { Save, Loader2, CheckCircle, AlertCircle, Pin } from "lucide-react";
import { getMetalLabel } from "@/lib/precious-metals";

interface PinnedCategoryRatesFormProps {
  categories: CategoryData[];
}

interface CategoryRates {
  id: string;
  name: string;
  customRateAu: string;
  customRateAg: string;
  customRatePt: string;
  customRatePd: string;
  customRateTa: string;
}

export function PinnedCategoryRatesForm({
  categories,
}: PinnedCategoryRatesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Инициализация состояния из props
  const [rates, setRates] = useState<CategoryRates[]>(() =>
    categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      customRateAu: cat.customRateAu?.toString() ?? "",
      customRateAg: cat.customRateAg?.toString() ?? "",
      customRatePt: cat.customRatePt?.toString() ?? "",
      customRatePd: cat.customRatePd?.toString() ?? "",
      customRateTa: cat.customRateTa?.toString() ?? "",
    }))
  );

  const handleRateChange = (
    categoryId: string,
    field: keyof Omit<CategoryRates, "id" | "name">,
    value: string
  ) => {
    setRates((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    );
  };

  // Преобразуем строку в число или null
  const parseRate = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    startTransition(async () => {
      const inputs: UpdateCategoryRatesInput[] = rates.map((cat) => ({
        id: cat.id,
        customRateAu: parseRate(cat.customRateAu),
        customRateAg: parseRate(cat.customRateAg),
        customRatePt: parseRate(cat.customRatePt),
        customRatePd: parseRate(cat.customRatePd),
        customRateTa: parseRate(cat.customRateTa),
      }));

      const result = await updateCategoryRates(inputs);

      if (result.success) {
        setNotification({
          type: "success",
          message: "Курсы категорий сохранены",
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при сохранении",
        });
      }
    });
  };

  if (categories.length === 0) {
    return (
      <div className="text-slate-500 text-center py-8">
        <Pin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p>Нет закреплённых категорий</p>
        <p className="text-sm mt-1">
          Чтобы закрепить категорию, установите флаг "Закрепить управление курсом на Дашборде" при редактировании категории
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Category Rates */}
      <div className="space-y-6">
        {rates.map((cat) => (
          <div
            key={cat.id}
            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
          >
            <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Pin className="w-4 h-4 text-indigo-500" />
              {cat.name}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Au - Золото */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Au (Золото)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cat.customRateAu}
                    onChange={(e) =>
                      handleRateChange(cat.id, "customRateAu", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₽/мг
                  </span>
                </div>
              </div>

              {/* Ag - Серебро */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ag (Серебро)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cat.customRateAg}
                    onChange={(e) =>
                      handleRateChange(cat.id, "customRateAg", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₽/г
                  </span>
                </div>
              </div>

              {/* Pl - Платина */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {getMetalLabel("Pt")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cat.customRatePt}
                    onChange={(e) =>
                      handleRateChange(cat.id, "customRatePt", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₽/мг
                  </span>
                </div>
              </div>

              {/* Pd - Палладий */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pd (Палладий)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cat.customRatePd}
                    onChange={(e) =>
                      handleRateChange(cat.id, "customRatePd", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₽/мг
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ta (Тантал)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cat.customRateTa}
                    onChange={(e) =>
                      handleRateChange(cat.id, "customRateTa", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm pr-14"
                    placeholder="—"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ₽/г
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
              Сохранить все курсы
            </>
          )}
        </button>
      </div>
    </form>
  );
}
