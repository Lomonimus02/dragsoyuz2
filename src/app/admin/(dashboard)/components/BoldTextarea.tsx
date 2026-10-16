"use client";

import { useRef, useState } from "react";
import {
  insertArticleMarkup,
  insertArticleTable,
  type ArticleMarkupKind,
} from "@/lib/article-body";

type BoldTextareaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  allowTable?: boolean;
  allowStructure?: boolean;
};

const toolButtonClass =
  "inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

export function BoldTextarea({
  id,
  label,
  value,
  onChange,
  rows = 5,
  hint = "Выделите фрагмент и нажмите «Жирный» — в тексте появится **жирный**.",
  allowTable = false,
  allowStructure = false,
}: BoldTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tableMessage, setTableMessage] = useState<string | null>(null);

  const applyBold = () => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`**${value}**`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + "**" + selected + "**" + value.slice(end);
    onChange(next);
    const nextStart = start + 2;
    const nextEnd = end + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextStart, nextEnd);
    });
  };

  const applyMarkup = (kind: ArticleMarkupKind) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const result = insertArticleMarkup(value, start, end, kind);
    setTableMessage(null);
    onChange(result.value);
    const cursor = result.cursor;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  const applyTable = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const result = insertArticleTable(value, start, end);
    if (!result.ok) {
      setTableMessage(result.message);
      return;
    }
    setTableMessage(null);
    onChange(result.value);
    const cursor = result.cursor;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {allowStructure ? (
            <>
              <button type="button" onClick={() => applyMarkup("heading")} className={toolButtonClass}>
                Подзаголовок
              </button>
              <button type="button" onClick={() => applyMarkup("ul")} className={toolButtonClass}>
                Список
              </button>
              <button type="button" onClick={() => applyMarkup("ol")} className={toolButtonClass}>
                Нумерованный список
              </button>
            </>
          ) : null}
          {allowTable ? (
            <button type="button" onClick={applyTable} className={toolButtonClass}>
              Таблица
            </button>
          ) : null}
          <button type="button" onClick={applyBold} className={toolButtonClass}>
            Жирный
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => {
          setTableMessage(null);
          onChange(event.target.value);
        }}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
      />
      {tableMessage ? <p className="mt-1 text-xs text-amber-700">{tableMessage}</p> : null}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
