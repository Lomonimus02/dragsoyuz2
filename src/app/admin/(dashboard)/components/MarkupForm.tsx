"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateGlobalSettings, type GlobalSettingsData } from "@/app/actions";
import { Save, Loader2, CheckCircle, AlertCircle, Percent } from "lucide-react";

interface MarkupFormProps {
  initialSettings: GlobalSettingsData;
}

interface FormData {
  priceMarkup: number;
}

type NotificationType = "success" | "error" | null;

export function MarkupForm({ initialSettings }: MarkupFormProps) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      priceMarkup: initialSettings.priceMarkup,
    },
  });

  const currentMarkup = watch("priceMarkup");
  const markupPercent = ((currentMarkup - 1) * 100).toFixed(1);

  const onSubmit = (data: FormData) => {
    setNotification(null);

    startTransition(async () => {
      const result = await updateGlobalSettings({
        priceMarkup: data.priceMarkup,
      });

      if (result.success) {
        setNotification({
          type: "success",
          message: "Наценка успешно обновлена",
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: "error",
          message: result.error || "Ошибка при обновлении наценки",
        });
      }
    });
  };

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

      {/* Markup input */}
      <div>
        <label
          htmlFor="priceMarkup"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Коэффициент наценки
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
              <Percent className="w-4 h-4 text-slate-600" />
            </div>
            <input
              type="number"
              id="priceMarkup"
              step="0.01"
              min="0.01"
              {...register("priceMarkup", {
                required: "Обязательное поле",
                min: { value: 0.01, message: "Минимум 0.01" },
                max: { value: 10, message: "Максимум 10" },
                valueAsNumber: true,
              })}
              className={`
                w-full pl-14 pr-4 py-3 rounded-lg border
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                transition-colors
                ${
                  errors.priceMarkup
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300 bg-white"
                }
              `}
              placeholder="1.00"
            />
          </div>
          <div className="text-sm text-slate-600 bg-slate-100 px-4 py-3 rounded-lg min-w-[100px] text-center">
            {Number(markupPercent) >= 0 ? "+" : ""}
            {markupPercent}%
          </div>
        </div>
        {errors.priceMarkup && (
          <p className="mt-1 text-sm text-red-600">
            {errors.priceMarkup?.message}
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          1.0 = без наценки, 1.15 = +15%, 0.9 = -10%
        </p>
      </div>

      {/* Last updated info */}
      <div className="text-sm text-slate-500">
        Последнее обновление:{" "}
        {new Date(initialSettings.updatedAt).toLocaleString("ru-RU", {
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
            inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium
            transition-all duration-200
            ${
              isPending || !isDirty
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow"
            }
          `}
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
  );
}
