"use client";

import { useRef, useState } from "react";
import { productPurchaseCopy, purchaseCopyDefaults, type PurchaseCopySettings } from "@/lib/product-purchase-copy";
import { SITE_BRAND } from "@/lib/site";

const fields = [
  ["title", "Заголовок страницы"], ["introduction", "Вступление"],
  ["acceptance", "Что принимаем"], ["yearText", "Условия по году выпуска"],
  ["benefitsHeading", "Заголовок преимуществ"], ["benefits", "Преимущества — по одному на строку"],
  ["conclusion", "Заключение"], ["metaDescription", "Описание для поисковиков"],
] as const;

export function PurchaseCopyEditor({ categoryName, categorySlug, value, onChange }: {
  categoryName: string; categorySlug: string; value: PurchaseCopySettings; onChange: (value: PurchaseCopySettings) => void;
}) {
  const defaults = purchaseCopyDefaults(categoryName, categorySlug);
  const values = { ...defaults, ...value };
  const [example, setExample] = useState("Название детали");
  const copy = productPurchaseCopy({ name: example || "Название детали", categoryName, categorySlug }, SITE_BRAND, value);
  const inputs = useRef<Partial<Record<keyof PurchaseCopySettings, HTMLTextAreaElement | null>>>({});
  const change = (key: keyof PurchaseCopySettings, text: string) => onChange({ ...value, [key]: text });
  const insert = (key: keyof PurchaseCopySettings, token: string) => {
    const input = inputs.current[key];
    const text = values[key];
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? start;
    change(key, text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + token.length, start + token.length); });
  };
  return <section className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
    <div>
      <h2 className="font-semibold text-slate-900">Текст на страницах товаров</h2>
      <p className="mt-1 text-sm text-slate-500">Настройки применятся ко всем товарам этого раздела. Название каждой детали подставляется автоматически в скобках. Сохраните категорию после изменения.</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      <label className="text-sm text-slate-700">После слова «Скупка»
        <input className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" maxLength={160} value={values.groupGenitive} onChange={e => change("groupGenitive", e.target.value)} />
        <span className="block mt-1 text-xs text-slate-500">Например: микросхем, конденсаторов, металлов платиновой группы</span>
      </label>
      <label className="text-sm text-slate-700">После слов «Мы принимаем»
        <input className="mt-1 w-full rounded-lg border border-slate-200 p-2.5" maxLength={160} value={values.groupAccusative} onChange={e => change("groupAccusative", e.target.value)} />
        <span className="block mt-1 text-xs text-slate-500">Например: микросхемы, конденсаторы, металлы платиновой группы</span>
      </label>
    </div>
    <details className="rounded-lg border border-slate-200 p-3">
      <summary className="cursor-pointer text-sm font-medium text-indigo-700">Редактировать абзацы и преимущества</summary>
      <p className="mt-3 text-xs text-slate-500">Кнопки под полями вставляют название товара, компании или группу в нужное место. HTML вводить не нужно.</p>
      <div className="mt-4 space-y-4">
        {fields.filter(([key]) => key !== "yearText" || copy.hasYearAdjustment).map(([key, label]) => <div key={key}>
          <label className="block text-sm text-slate-700" htmlFor={`purchase-${key}`}>{label}</label>
          <textarea id={`purchase-${key}`} ref={element => { inputs.current[key] = element; }} rows={key === "benefits" ? 5 : 3} maxLength={5000}
            className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm" value={values[key]} onChange={e => change(key, e.target.value)} />
          <div className="flex flex-wrap gap-2 mt-1">
            {[["Товар", "{название}"], ["Компания", "{бренд}"], ["Группа: скупка", "{группа}"], ["Группа: принимаем", "{детали}"]].map(([label, token]) =>
              <button type="button" className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" key={token} onClick={() => insert(key, token)}>+ {label}</button>)}
          </div>
        </div>)}
      </div>
    </details>
    <details open className="rounded-lg bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">Как будет выглядеть текст</summary>
      <label className="block mt-3 text-xs text-slate-500">Название для примера (не сохраняется)
        <input className="block mt-1 w-full rounded border border-slate-200 bg-white p-2 text-sm text-slate-800" value={example} onChange={e => setExample(e.target.value)} />
      </label>
      <div className="mt-4 space-y-3 text-sm text-slate-700 break-words">
        <h3 className="text-base font-semibold">{copy.title}</h3>
        <p>{copy.introduction}</p><p>{copy.acceptance}</p>
        <h4 className="font-semibold">{copy.benefitsHeading}</h4>
        <ul className="list-disc pl-5">{copy.benefits.map((benefit, index) => <li key={index}>{benefit}</li>)}</ul>
        <p className="font-medium">{copy.conclusion}</p>
      </div>
    </details>
    <button type="button" className="text-sm text-slate-500 underline" onClick={() => onChange({})}>Вернуть стандартный текст</button>
  </section>;
}
