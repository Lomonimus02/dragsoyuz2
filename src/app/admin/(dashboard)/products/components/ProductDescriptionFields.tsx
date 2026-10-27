"use client";

import { DESCRIPTION_FIELDS, formatProductDescription, type DescriptionFieldKey, type ProductDescriptionDraft } from "@/lib/product-description-fields";

type Props = {
  draft: ProductDescriptionDraft;
  onChange: (draft: ProductDescriptionDraft) => void;
  productName: string;
};

export function ProductDescriptionFields({ draft, onChange, productName }: Props) {
  const visible = DESCRIPTION_FIELDS.filter(field => field.basic || field.key in draft.fields);
  const available = DESCRIPTION_FIELDS.filter(field => !field.basic && !(field.key in draft.fields));
  const updateField = (key: DescriptionFieldKey, value: string) => onChange({ ...draft, fields: { ...draft.fields, [key]: value } });
  const preview = formatProductDescription(draft);
  const inputClass = "w-full min-w-0 px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid="product-description-fields">
      <p className="text-sm text-slate-600">Заполните только значения. Подписи добавятся автоматически. Пустые поля и текст-подсказка внутри них на сайте не публикуются.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map(field => (
          <div key={field.key} className={field.multiline || field.key === "name" || field.key === "type" ? "sm:col-span-2 min-w-0" : "min-w-0"}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <label htmlFor={`detail-${field.key}`} className="text-sm font-medium text-slate-700">{field.label}</label>
              {field.key === "name" && (
                <button type="button" disabled={!productName.trim()} onClick={() => updateField("name", productName.trim())} className="text-xs text-indigo-700 hover:underline disabled:opacity-50">
                  Из названия товара
                </button>
              )}
              {!field.basic && (
                <button type="button" aria-label={`Убрать поле «${field.label}»`} onClick={() => {
                  const fields = { ...draft.fields };
                  delete fields[field.key];
                  onChange({ ...draft, fields });
                }} className="text-xs text-slate-500 hover:text-red-700">Убрать поле</button>
              )}
            </div>
            {field.multiline ? (
              <textarea id={`detail-${field.key}`} rows={2} value={draft.fields[field.key] ?? ""} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} className={`${inputClass} resize-y`} />
            ) : (
              <input id={`detail-${field.key}`} type="text" value={draft.fields[field.key] ?? ""} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} className={inputClass} />
            )}
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <div>
          <label htmlFor="detail-add-field" className="block text-sm font-medium text-slate-700 mb-1">Добавить характеристику</label>
          <select id="detail-add-field" value="" onChange={event => {
            const field = available.find(item => item.key === event.target.value);
            if (field) updateField(field.key, "");
          }} className={inputClass}>
            <option value="">Выберите поле</option>
            {available.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="detail-additional" className="block text-sm font-medium text-slate-700 mb-1">Дополнительный текст <span className="font-normal text-slate-400">(необязательно)</span></label>
        <textarea id="detail-additional" rows={3} value={draft.additionalText} onChange={event => onChange({ ...draft, additionalText: event.target.value })} placeholder="Особенности детали, которые не вошли в поля выше" className={`${inputClass} resize-y`} />
      </div>
      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Как будет выглядеть на сайте</summary>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600" data-testid="product-description-preview">{preview || "Заполните хотя бы одно поле — здесь появится описание."}</p>
      </details>
    </div>
  );
}
