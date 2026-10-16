"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  getGlobalSettings,
  saveInfoPageButtonColorPreset,
} from "@/app/actions";
import {
  defaultInfoButtonLabel,
  INFO_PAGE_BUTTON_BLACK_TEXT_COLOR,
  INFO_PAGE_BUTTON_DEFAULT_COLOR,
  INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR,
  INFO_PAGE_BUTTON_RED_COLOR,
  normalizeInfoPageButtonColor,
  type CategoryInfoBlock,
} from "@/lib/category-info";

interface CategoryInfoPageEditorProps {
  categoryName: string;
  enabled: boolean;
  buttonLabel: string;
  buttonColor: string;
  buttonTextColor: string;
  blocks: CategoryInfoBlock[];
  onEnabledChange: (enabled: boolean) => void;
  onButtonLabelChange: (label: string) => void;
  onButtonColorChange: (color: string) => void;
  onButtonTextColorChange: (color: string) => void;
  onBlocksChange: (blocks: CategoryInfoBlock[]) => void;
}

function newId(): string {
  return crypto.randomUUID();
}

export function CategoryInfoPageEditor({
  categoryName,
  enabled,
  buttonLabel,
  buttonColor,
  buttonTextColor,
  blocks,
  onEnabledChange,
  onButtonLabelChange,
  onButtonColorChange,
  onButtonTextColorChange,
  onBlocksChange,
}: CategoryInfoPageEditorProps) {
  const placeholder = defaultInfoButtonLabel(categoryName || "категории");
  const [presets, setPresets] = useState<string[]>([]);
  const [presetMessage, setPresetMessage] = useState<string | null>(null);
  const [isSavingPreset, startSavePreset] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getGlobalSettings().then((result) => {
      if (cancelled || !result.success) return;
      setPresets(result.data.infoPageButtonColorPresets);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSavePreset = (hex: string | null) => {
    if (!hex) {
      setPresetMessage(
        "Выберите цвет, чтобы сохранить его в общий список.",
      );
      return;
    }

    startSavePreset(async () => {
      const result = await saveInfoPageButtonColorPreset(hex);
      if (result.success) {
        setPresets(result.data.infoPageButtonColorPresets);
        setPresetMessage(
          "Цвет сохранён в общий список. Чтобы применить его к этой категории, выберите образец и сохраните категорию.",
        );
      } else {
        setPresetMessage(result.error);
      }
    });
  };

  const handleEnabledChange = (next: boolean) => {
    onEnabledChange(next);
    if (next && !buttonLabel.trim()) {
      onButtonLabelChange(defaultInfoButtonLabel(categoryName || "категории"));
    }
  };

  const addTextBlock = () => {
    onBlocksChange([...blocks, { id: newId(), type: "text", content: "" }]);
  };

  const addImageBlock = () => {
    onBlocksChange([...blocks, { id: newId(), type: "image", url: "" }]);
  };

  const updateBlock = (id: string, patch: Partial<CategoryInfoBlock>) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === id ? ({ ...block, ...patch } as CategoryInfoBlock) : block,
      ),
    );
  };

  const removeBlock = (id: string) => {
    onBlocksChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onBlocksChange(copy);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Информационная страница
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Кнопка под баннером открывает страницу с текстом и фото. Контент можно
          подготовить заранее — кнопка и страница появятся на сайте только после
          публикации.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Показать кнопку и опубликовать страницу
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Пока выключено, страница недоступна посетителям, блоки можно
              редактировать.
            </span>
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Текст кнопки
          </label>
          <input
            type="text"
            value={buttonLabel}
            onChange={(e) => onButtonLabelChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
            placeholder={placeholder}
          />
          <p className="mt-1 text-xs text-slate-500">
            Можно указать уточнение в скобках, например: «Важная информация о
            микросхемах (логика)»
          </p>
        </div>

        <InfoButtonColorField
          label="Цвет кнопки"
          value={buttonColor}
          onChange={onButtonColorChange}
          presets={presets}
          defaultHex={INFO_PAGE_BUTTON_DEFAULT_COLOR}
          placeholder="#104488"
          builtinSwatches={[
            { hex: INFO_PAGE_BUTTON_RED_COLOR, label: "Красный" },
          ]}
          isSavingPreset={isSavingPreset}
          onSavePreset={handleSavePreset}
        />

        <InfoButtonColorField
          label="Цвет текста"
          value={buttonTextColor}
          onChange={onButtonTextColorChange}
          presets={presets}
          defaultHex={INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR}
          placeholder="#FFFFFF"
          builtinSwatches={[
            { hex: INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR, label: "Белый" },
            { hex: INFO_PAGE_BUTTON_BLACK_TEXT_COLOR, label: "Чёрный" },
          ]}
          isSavingPreset={isSavingPreset}
          onSavePreset={handleSavePreset}
        />
        <p className="text-xs text-slate-500 -mt-2">
          «Сохранить цвет» добавляет образец для других категорий и не
          применяет его к этой. Выберите образец и сохраните категорию.
        </p>
        {presetMessage && (
          <p className="text-xs text-slate-600 -mt-2">{presetMessage}</p>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">Блоки</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addTextBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
              >
                <Type className="w-4 h-4" />
                Добавить текст
              </button>
              <button
                type="button"
                onClick={addImageBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
              >
                <ImagePlus className="w-4 h-4" />
                Добавить фото
              </button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Блоков пока нет. Добавьте текст или фото — порядок можно менять
              стрелками.
            </p>
          ) : (
            <ul className="space-y-3">
              {blocks.map((block, index) => (
                <li
                  key={block.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {block.type === "text" ? "Текст" : "Фото"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-30"
                        title="Выше"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === blocks.length - 1}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-white disabled:opacity-30"
                        title="Ниже"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                        title="Удалить"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {block.type === "text" ? (
                    <TextBlockEditor
                      content={block.content}
                      boldScale={block.boldScale}
                      onChange={(content) =>
                        updateBlock(block.id, { content })
                      }
                      onBoldScaleChange={(boldScale) =>
                        updateBlock(block.id, { boldScale })
                      }
                    />
                  ) : (
                    <ImageBlockEditor
                      block={block}
                      onChange={(patch) => updateBlock(block.id, patch)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function swatchClass(active: boolean): string {
  return `inline-flex items-center px-3 py-1.5 rounded-full border text-sm transition-colors ${
    active
      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
  }`;
}

function InfoButtonColorField({
  label,
  value,
  onChange,
  presets,
  defaultHex,
  placeholder,
  builtinSwatches,
  isSavingPreset,
  onSavePreset,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets: string[];
  defaultHex: string;
  placeholder: string;
  builtinSwatches: { hex: string; label: string }[];
  isSavingPreset: boolean;
  onSavePreset: (hex: string | null) => void;
}) {
  const selectedHex = normalizeInfoPageButtonColor(value);
  const colorInputValue = (selectedHex || defaultHex).toLowerCase();

  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </span>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChange("")}
          className={swatchClass(!selectedHex)}
        >
          По умолчанию
        </button>
        {builtinSwatches.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            onClick={() => onChange(swatch.hex)}
            className={swatchClass(selectedHex === swatch.hex)}
          >
            <span
              className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle border border-slate-300/80"
              style={{ backgroundColor: swatch.hex }}
            />
            {swatch.label}
          </button>
        ))}
        {presets.map((hex) => (
          <button
            key={hex}
            type="button"
            title={hex}
            onClick={() => onChange(hex)}
            className={swatchClass(selectedHex === hex)}
          >
            <span
              className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle border border-slate-300/80"
              style={{ backgroundColor: hex }}
            />
            {hex}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={colorInputValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
          title="Выбрать цвет"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-32 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => onSavePreset(selectedHex)}
          disabled={isSavingPreset}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isSavingPreset ? "Сохранение..." : "Сохранить цвет"}
        </button>
      </div>
    </div>
  );
}

function TextBlockEditor({
  content,
  boldScale,
  onChange,
  onBoldScaleChange,
}: {
  content: string;
  boldScale?: number;
  onChange: (content: string) => void;
  onBoldScaleChange: (scale: number | undefined) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scaleDraft, setScaleDraft] = useState(() =>
    boldScale != null && Number.isFinite(boldScale) ? String(boldScale) : "",
  );

  const applyBold = () => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`**${content}**`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const next =
      content.slice(0, start) + "**" + selected + "**" + content.slice(end);
    onChange(next);
    const nextStart = start + 2;
    const nextEnd = end + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextStart, nextEnd);
    });
  };

  const handleScaleDraftChange = (raw: string) => {
    setScaleDraft(raw);
    const trimmed = raw.trim();
    if (trimmed === "") {
      onBoldScaleChange(undefined);
      return;
    }
    const value = Number(trimmed.replace(",", "."));
    if (Number.isFinite(value)) {
      onBoldScaleChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={applyBold}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Жирный
        </button>
        <label className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          Жирность
          <input
            type="text"
            inputMode="decimal"
            value={scaleDraft}
            onChange={(e) => handleScaleDraftChange(e.target.value)}
            placeholder="1.5"
            className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </label>
      </div>
      <textarea
        ref={textareaRef}
        rows={4}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 resize-y text-sm"
        placeholder="можно выделить фрагмент и нажать Жирный (**текст**)"
      />
    </div>
  );
}

function ImageBlockEditor({
  block,
  onChange,
}: {
  block: Extract<CategoryInfoBlock, { type: "image" }>;
  onChange: (patch: Partial<Extract<CategoryInfoBlock, { type: "image" }>>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        setUploadError("Не удалось загрузить изображение");
        return;
      }

      const result = await response.json();
      if (result.success) {
        onChange({ url: result.url });
      } else {
        setUploadError(result.error || "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm">
          <Upload className="w-4 h-4 text-slate-500" />
          {isUploading ? "Загрузка..." : block.url ? "Заменить фото" : "Загрузить фото"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </label>
        {block.url && (
          <button
            type="button"
            onClick={() => onChange({ url: "" })}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Удалить фото
          </button>
        )}
      </div>
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {block.url && (
        <div className="relative h-36 w-full max-w-md overflow-hidden rounded-lg border border-slate-200">
          <Image src={block.url} alt={block.alt || "Фото блока"} fill className="object-cover" />
        </div>
      )}
      <input
        type="text"
        value={block.alt || ""}
        onChange={(e) => onChange({ alt: e.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
        placeholder="Подпись (alt), необязательно"
      />
    </div>
  );
}
