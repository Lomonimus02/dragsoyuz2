"use client";

import { useState, useTransition } from "react";
import { updateGlobalSettings, type GlobalSettingsData } from "@/app/actions";
import {
  YEAR_PERIODS,
  parseYearPeriodDiscounts,
  type YearPeriodDiscounts,
  type YearPeriodId,
} from "@/lib/year-discount";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface YearPeriodDiscountsFormProps {
  initialData: GlobalSettingsData;
}

export function YearPeriodDiscountsForm({
  initialData,
}: YearPeriodDiscountsFormProps) {
  const [values, setValues] = useState<YearPeriodDiscounts>(
    parseYearPeriodDiscounts(initialData.yearPeriodDiscounts),
  );
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange = (id: YearPeriodId, raw: string) => {
    const parsed = Number(raw);
    const next = Number.isFinite(parsed) ? parsed : 0;
    setValues((prev) => ({ ...prev, [id]: next }));
    setNotification(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    startTransition(async () => {
      const result = await updateGlobalSettings({
        yearPeriodDiscounts: parseYearPeriodDiscounts(values),
      });

      if (result.success) {
        setValues(result.data.yearPeriodDiscounts);
        setNotification({
          type: "success",
          message: "Проценты по году обновлены",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      <p className="text-sm text-slate-500">
        Процент снижает содержание золота (Au) у микросхем, транзисторов и
        диодов: −10% = 90% золота. Цена в калькуляторе и описи считается от
        этого. Ручная «Уценка» меняет только цену, не золото. Цены в каталоге
        не меняются.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {YEAR_PERIODS.map((period) => (
          <label key={period.id} className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              {period.label}
            </span>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={values[period.id]}
                onChange={(e) => handleChange(period.id, e.target.value)}
                disabled={isPending}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                %
              </span>
            </div>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Сохранить
          </>
        )}
      </button>
    </form>
  );
}
