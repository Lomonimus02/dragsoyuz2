"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateMetalRates, type MetalRatesData } from "@/app/actions";
import { getMetalDisplaySymbol, getMetalLabel } from "@/lib/precious-metals";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface MetalRatesFormProps {
  initialRates: MetalRatesData;
}

interface FormData {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  tantalum: number;
}

type NotificationType = "success" | "error" | null;

export function MetalRatesForm({ initialRates }: MetalRatesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      gold: initialRates.gold,
      silver: initialRates.silver,
      platinum: initialRates.platinum,
      palladium: initialRates.palladium,
      tantalum: initialRates.tantalum,
    },
  });

  const onSubmit = (data: FormData) => {
    setNotification(null);
    
    startTransition(async () => {
      const result = await updateMetalRates(data);
      
      if (result.success) {
        setNotification({
          type: "success",
          message: "Курсы успешно обновлены",
        });
        // Убираем уведомление через 3 секунды
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при обновлении курсов",
        });
      }
    });
  };

  const metals = [
    { key: "gold" as const, label: "Золото (Au) — Цена за 1 мг (₽)", symbol: "Au", color: "amber", unit: "₽/мг" },
    { key: "silver" as const, label: "Серебро (Ag) — Цена за 1 г (₽)", symbol: "Ag", color: "slate", unit: "₽/г" },
    { key: "platinum" as const, label: `${getMetalLabel("Pt")} — Цена за 1 мг (₽)`, symbol: getMetalDisplaySymbol("Pt"), color: "cyan", unit: "₽/мг" },
    { key: "palladium" as const, label: "Палладий (Pd) — Цена за 1 мг (₽)", symbol: "Pd", color: "violet", unit: "₽/мг" },
    { key: "tantalum" as const, label: "Тантал (Ta) — Цена за 1 г (₽)", symbol: "Ta", color: "stone", unit: "₽/г" },
  ];

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

      {/* Metal inputs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metals.map((metal) => (
          <div key={metal.key}>
            <label
              htmlFor={metal.key}
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              {metal.label}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-600">
                  {metal.symbol}
                </span>
              </div>
              <input
                type="number"
                id={metal.key}
                step="any"
                min="0"
                {...register(metal.key, {
                  required: "Обязательное поле",
                  min: { value: 0, message: "Цена не может быть отрицательной" },
                  valueAsNumber: true,
                })}
                className={`
                  w-full pl-14 pr-12 py-3 rounded-lg border
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  transition-colors
                  ${
                    errors[metal.key]
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300 bg-white"
                  }
                `}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {metal.unit}
              </span>
            </div>
            {errors[metal.key] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[metal.key]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Last updated info */}
      <div className="text-sm text-slate-500">
        Последнее обновление:{" "}
        {new Date(initialRates.updatedAt).toLocaleString("ru-RU", {
          dateStyle: "long",
          timeStyle: "short",
        })}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${
              isPending || !isDirty
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
            }
          `}
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Сохранить курсы
            </>
          )}
        </button>
      </div>
    </form>
  );
}
