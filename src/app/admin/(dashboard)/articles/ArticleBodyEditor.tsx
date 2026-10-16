"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ArticleBodyView } from "@/app/(root)/components/ArticleBodyView";
import {
  parseArticleBody,
  parseInlineMarkdown,
  serializeArticleBody,
  type ArticleBodyBlock,
} from "@/lib/article-body";

type EditorBlock = {
  id: string;
  block: ArticleBodyBlock;
};

type ArticleBodyEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const toolButtonClass =
  "inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function keepSelection(event: MouseEvent) {
  event.preventDefault();
}

function newId(): string {
  return crypto.randomUUID();
}

function withIds(blocks: ArticleBodyBlock[]): EditorBlock[] {
  const source = blocks.length > 0 ? blocks : [{ kind: "paragraph" as const, text: "" }];
  return source.map((block) => ({ id: newId(), block }));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markupToHtml(text: string): string {
  if (!text) return "";
  return parseInlineMarkdown(text)
    .map((piece) => {
      const html = escapeHtml(piece.text).replace(/\n/g, "<br>");
      const linked = piece.href
        ? `<a href="${escapeHtml(piece.href)}">${html}</a>`
        : html;
      return piece.bold ? `<strong>${linked}</strong>` : linked;
    })
    .join("");
}

function isBoldElement(element: HTMLElement): boolean {
  const tag = element.tagName;
  if (tag === "STRONG" || tag === "B") return true;
  const weight = element.style.fontWeight;
  return weight === "bold" || weight === "700";
}

function nodeToMarkup(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  if (element.tagName === "BR") return "\n";

  const inner = Array.from(element.childNodes).map(nodeToMarkup).join("");
  if (element.tagName === "A") {
    const href = element.getAttribute("href") ?? "";
    if (/^https?:\/\//i.test(href)) return `[${inner}](${href})`;
    return inner;
  }
  if (isBoldElement(element)) {
    return inner ? `**${inner}**` : "";
  }
  return inner;
}

function htmlToMarkup(html: string): string {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  return nodeToMarkup(holder).replace(/\*\*\*\*/g, "");
}

function InlineField({
  text,
  onChange,
  placeholder,
  className,
  singleLine = false,
}: {
  text: string;
  onChange: (value: string) => void;
  placeholder: string;
  className: string;
  singleLine?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (htmlToMarkup(element.innerHTML) === text) return;
    element.innerHTML = markupToHtml(text);
  }, [text]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline={!singleLine}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`article-inline-field ${className}`}
      onPaste={(event) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, markupToHtml(pasted));
      }}
      onKeyDown={(event) => {
        if (singleLine && event.key === "Enter") {
          event.preventDefault();
        }
      }}
      onInput={(event) => {
        onChange(htmlToMarkup((event.currentTarget as HTMLDivElement).innerHTML));
      }}
    />
  );
}

function looksLikeBlockMarkdown(text: string): boolean {
  if (text.includes("\n\n")) return true;
  return /(^|\n)\s{0,3}(#{1,3}\s+\S|[-*+]\s+\S|\d+\.\s+\S|>\s?|:::table\b)/.test(text)
    || /\|[^\n]+\|\s*\n\s*\|?\s*:?-{3,}/.test(text);
}

function emptyTable(): ArticleBodyBlock {
  return {
    kind: "table",
    header: ["", "", ""],
    rows: [
      ["", ""],
      ["", ""],
    ].map(() => ["", "", ""]),
  };
}

export function ArticleBodyEditor({ id, label, value, onChange }: ArticleBodyEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => withIds(parseArticleBody(value)));
  const serialized = useRef(serializeArticleBody(blocks.map((item) => item.block)));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value === serialized.current) return;
    const next = withIds(parseArticleBody(value));
    serialized.current = serializeArticleBody(next.map((item) => item.block));
    setBlocks(next);
  }, [value]);

  const commit = (next: EditorBlock[]) => {
    const source = next.length > 0 ? next : withIds([]);
    setBlocks(source);
    const body = serializeArticleBody(source.map((item) => item.block));
    serialized.current = body;
    onChange(body);
  };

  const updateBlock = (idToUpdate: string, block: ArticleBodyBlock) => {
    commit(blocks.map((item) => (item.id === idToUpdate ? { ...item, block } : item)));
  };

  const insertAfterFocused = (block: ArticleBodyBlock) => {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    let index = blocks.length - 1;
    if (anchor instanceof Node) {
      const host = (anchor instanceof Element ? anchor : anchor.parentElement)?.closest(
        "[data-block-id]",
      );
      const found = blocks.findIndex((item) => item.id === host?.getAttribute("data-block-id"));
      if (found >= 0) index = found;
    }
    const next = blocks.slice();
    next.splice(index + 1, 0, { id: newId(), block });
    commit(next);
  };

  const applyBold = () => {
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    if (!anchor || !rootRef.current?.contains(anchor)) return;
    document.execCommand("bold");
    const host = (anchor instanceof Element ? anchor : anchor.parentElement)?.closest(
      "[contenteditable='true']",
    );
    if (host instanceof HTMLElement) {
      host.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const hasTable = blocks.some((item) => item.block.kind === "table");
  const preview = parseArticleBody(serializeArticleBody(blocks.map((item) => item.block)));

  return (
    <div>
      <style>{`
        .article-inline-field:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            onClick={() => insertAfterFocused({ kind: "paragraph", text: "" })}
          >
            Абзац
          </button>
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            onClick={() => insertAfterFocused({ kind: "heading", text: "" })}
          >
            Подзаголовок
          </button>
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            onClick={() => insertAfterFocused({ kind: "quote", text: "" })}
          >
            Цитата
          </button>
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            onClick={() => insertAfterFocused({ kind: "ul", items: [""] })}
          >
            Список
          </button>
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            onClick={() => insertAfterFocused({ kind: "ol", items: [""] })}
          >
            Нумерованный список
          </button>
          <button
            type="button"
            className={toolButtonClass}
            onMouseDown={keepSelection}
            disabled={hasTable}
            onClick={() => insertAfterFocused(emptyTable())}
          >
            Таблица
          </button>
          <button type="button" className={toolButtonClass} onMouseDown={keepSelection} onClick={applyBold}>
            Жирный
          </button>
        </div>
      </div>

      <div
        id={id}
        ref={rootRef}
        className="space-y-3 rounded-xl border border-slate-300 bg-white p-4"
        onPasteCapture={(event) => {
          const pasted = event.clipboardData.getData("text/plain");
          if (!looksLikeBlockMarkdown(pasted)) return;
          const target = event.target;
          if (target instanceof Element && target.closest("table")) return;
          event.preventDefault();
          event.stopPropagation();
          const parsed = parseArticleBody(pasted);
          if (parsed.length === 0) return;

          const onlyEmpty =
            blocks.length === 1 &&
            blocks[0].block.kind === "paragraph" &&
            blocks[0].block.text.trim() === "";
          if (onlyEmpty) {
            commit(withIds(parsed));
            return;
          }

          const anchor = window.getSelection()?.anchorNode;
          let index = blocks.length - 1;
          if (anchor instanceof Node) {
            const host = (anchor instanceof Element ? anchor : anchor.parentElement)?.closest(
              "[data-block-id]",
            );
            const found = blocks.findIndex(
              (item) => item.id === host?.getAttribute("data-block-id"),
            );
            if (found >= 0) index = found;
          }

          const current = blocks[index];
          const incoming = withIds(parsed);
          const next = blocks.slice();
          const emptyParagraph =
            current?.block.kind === "paragraph" && current.block.text.trim() === "";
          if (emptyParagraph) next.splice(index, 1, ...incoming);
          else next.splice(index + 1, 0, ...incoming);
          commit(next);
        }}
      >
        {blocks.map((item) => (
          <BlockCard
            key={item.id}
            item={item}
            canDelete={blocks.length > 1}
            onChange={(block) => updateBlock(item.id, block)}
            onDelete={() => commit(blocks.filter((entry) => entry.id !== item.id))}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Можно вставить готовый Markdown: заголовки, списки, цитаты, ссылки и таблицы разберутся сами. Кнопки выше делают то же без служебных знаков.
      </p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Как будет на сайте
        </p>
        <ArticleBodyView blocks={preview} />
      </div>
    </div>
  );
}

function BlockCard({
  item,
  canDelete,
  onChange,
  onDelete,
}: {
  item: EditorBlock;
  canDelete: boolean;
  onChange: (block: ArticleBodyBlock) => void;
  onDelete: () => void;
}) {
  const block = item.block;

  return (
    <div data-block-id={item.id} className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {block.kind === "heading"
            ? block.level === 3
              ? "Малый подзаголовок"
              : "Подзаголовок"
            : block.kind === "quote"
              ? "Цитата"
            : block.kind === "ul"
              ? "Список"
              : block.kind === "ol"
                ? "Нумерованный список"
                : block.kind === "table"
                  ? "Таблица"
                  : "Абзац"}
        </span>
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            title="Удалить блок"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {block.kind === "paragraph" ? (
        <InlineField
          text={block.text}
          placeholder="Текст абзаца"
          className="min-h-16 text-base leading-7 text-slate-800 outline-none"
          onChange={(text) => onChange({ kind: "paragraph", text })}
        />
      ) : null}

      {block.kind === "heading" ? (
        <InlineField
          text={block.text}
          placeholder="Подзаголовок"
          singleLine
          className={
            block.level === 3
              ? "text-xl font-semibold leading-snug text-slate-900 outline-none"
              : "text-2xl font-bold leading-snug text-slate-900 outline-none"
          }
          onChange={(text) =>
            onChange({ kind: "heading", level: block.level, text: text.replace(/\n/g, " ") })
          }
        />
      ) : null}

      {block.kind === "quote" ? (
        <InlineField
          text={block.text}
          placeholder="Цитата"
          className="min-h-12 border-l-4 border-amber-400 pl-3 text-base leading-7 text-slate-700 outline-none"
          onChange={(text) => onChange({ kind: "quote", text })}
        />
      ) : null}

      {block.kind === "ul" || block.kind === "ol" ? (
        <div className="space-y-2">
          {block.items.map((listItem, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="pt-1 text-sm text-slate-400">
                {block.kind === "ul" ? "•" : `${index + 1}.`}
              </span>
              <InlineField
                text={listItem}
                placeholder="Пункт"
                className="min-h-8 flex-1 text-base leading-7 text-slate-800 outline-none"
                onChange={(text) => {
                  const items = block.items.slice();
                  items[index] = text.replace(/\n/g, " ");
                  onChange({ ...block, items });
                }}
              />
              {block.items.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                  title="Удалить пункт"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="h-4 w-4" />
            Ещё пункт
          </button>
        </div>
      ) : null}

      {block.kind === "table" ? (
        <TableFields block={block} onChange={onChange} />
      ) : null}
    </div>
  );
}

function TableFields({
  block,
  onChange,
}: {
  block: Extract<ArticleBodyBlock, { kind: "table" }>;
  onChange: (block: ArticleBodyBlock) => void;
}) {
  const setHeader = (index: number, text: string) => {
    const header = block.header.slice();
    header[index] = text.replace(/\n/g, " ");
    onChange({ ...block, header });
  };

  const setCell = (rowIndex: number, cellIndex: number, text: string) => {
    const rows = block.rows.map((row) => row.slice());
    rows[rowIndex][cellIndex] = text.replace(/\n/g, " ");
    onChange({ ...block, rows });
  };

  const addColumn = () => {
    onChange({
      kind: "table",
      header: [...block.header, ""],
      rows: block.rows.map((row) => [...row, ""]),
    });
  };

  const addRow = () => {
    onChange({
      ...block,
      rows: [...block.rows, block.header.map(() => "")],
    });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {block.header.map((cell, index) => (
                <th key={index} className="border border-slate-200 bg-slate-100 p-1">
                  <InlineField
                    text={cell}
                    placeholder="Шапка"
                    singleLine
                    className="min-w-24 px-2 py-1 font-semibold outline-none"
                    onChange={(text) => setHeader(index, text)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-slate-200 p-1">
                    <InlineField
                      text={cell}
                      placeholder="Ячейка"
                      singleLine
                      className="min-w-24 px-2 py-1 outline-none"
                      onChange={(text) => setCell(rowIndex, cellIndex, text)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addColumn}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <Plus className="h-4 w-4" />
          Столбец
        </button>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <Plus className="h-4 w-4" />
          Строка
        </button>
      </div>
    </div>
  );
}
