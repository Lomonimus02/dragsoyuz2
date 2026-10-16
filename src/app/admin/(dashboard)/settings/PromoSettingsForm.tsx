"use client";

import { useState, useTransition } from "react";
import { updatePromoSettings } from "@/app/actions";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { BoldTextarea } from "../components/BoldTextarea";

type PromoSettingsFormProps = {
  initialEnabled: boolean;
  initialText: string;
  initialTerms: string;
  initialButtonUrl: string;
  initialButtonLabel: string;
  initialButtonCaption: string;
};

export function PromoSettingsForm({
  initialEnabled,
  initialText,
  initialTerms,
  initialButtonUrl,
  initialButtonLabel,
  initialButtonCaption,
}: PromoSettingsFormProps) {
  const [promoEnabled, setPromoEnabled] = useState(initialEnabled);
  const [promoText, setPromoText] = useState(initialText);
  const [promoTerms, setPromoTerms] = useState(initialTerms);
  const [promoButtonUrl, setPromoButtonUrl] = useState(initialButtonUrl);
  const [promoButtonLabel, setPromoButtonLabel] = useState(initialButtonLabel);
  const [promoButtonCaption, setPromoButtonCaption] = useState(initialButtonCaption);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updatePromoSettings({
        promoEnabled,
        promoText,
        promoTerms,
        promoButtonUrl,
        promoButtonLabel,
        promoButtonCaption,
      });

      if (result.success) {
        setPromoText(result.data.promoText);
        setPromoTerms(result.data.promoTerms);
        setPromoEnabled(result.data.promoEnabled);
        setPromoButtonUrl(result.data.promoButtonUrl);
        setPromoButtonLabel(result.data.promoButtonLabel);
        setPromoButtonCaption(result.data.promoButtonCaption);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <p className="text-sm text-slate-500">
        Надбавка +1% указана только в тексте объявления и не меняет калькулятор и цены.
      </p>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Акция сохранена</span>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={promoEnabled}
          onChange={(event) => setPromoEnabled(event.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Показывать акцию
      </label>

      <BoldTextarea
        id="promoText"
        label="Текст"
        value={promoText}
        onChange={setPromoText}
        rows={4}
      />

      <BoldTextarea
        id="promoTerms"
        label="Условия акции"
        value={promoTerms}
        onChange={setPromoTerms}
        rows={6}
      />

      <div>
        <label htmlFor="promoButtonUrl" className="mb-1.5 block text-sm font-medium text-slate-700">
          Ссылка кнопки
        </label>
        <input
          id="promoButtonUrl"
          type="text"
          value={promoButtonUrl}
          onChange={(event) => setPromoButtonUrl(event.target.value)}
          disabled={isPending}
          placeholder="https://"
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Пустая ссылка скрывает кнопку и подпись. Нужен адрес http или https.
        </p>
      </div>

      <div>
        <label htmlFor="promoButtonLabel" className="mb-1.5 block text-sm font-medium text-slate-700">
          Текст кнопки
        </label>
        <input
          id="promoButtonLabel"
          type="text"
          value={promoButtonLabel}
          onChange={(event) => setPromoButtonLabel(event.target.value)}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Если ссылка задана, а текст пустой, на кнопке будет «Подробнее».
        </p>
      </div>

      <div>
        <label htmlFor="promoButtonCaption" className="mb-1.5 block text-sm font-medium text-slate-700">
          Подпись кнопки
        </label>
        <input
          id="promoButtonCaption"
          type="text"
          value={promoButtonCaption}
          onChange={(event) => setPromoButtonCaption(event.target.value)}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-xs text-slate-500">
          Показывается под кнопкой. Пустая подпись не выводится.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Сохранить
          </>
        )}
      </button>
    </form>
  );
}
