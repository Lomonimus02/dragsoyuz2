export type CategoryInfoTextBlock = {
  id: string;
  type: "text";
  content: string;
  boldScale?: number;
};

export type CategoryInfoImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt?: string;
};

export type CategoryInfoBlock = CategoryInfoTextBlock | CategoryInfoImageBlock;

export function defaultInfoButtonLabel(name: string): string {
  return `Важная информация о ${name.trim().toLowerCase()}`;
}

export function resolveInfoButtonLabel(
  label: string | null | undefined,
  name: string,
): string {
  const trimmed = label?.trim();
  return trimmed || defaultInfoButtonLabel(name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBoldScale(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return undefined;
}

/** CSS font-weight для `**…**`. Пустой scale — как раньше (700). */
export function resolveBoldFontWeight(scale?: number): number {
  if (scale === undefined || !Number.isFinite(scale)) return 700;
  const weight = Math.round((400 * scale) / 100) * 100;
  return Math.min(900, Math.max(100, weight));
}

export function parseInfoPageBlocks(raw: unknown): CategoryInfoBlock[] {
  if (!Array.isArray(raw)) return [];

  const blocks: CategoryInfoBlock[] = [];

  for (const item of raw) {
    if (!isRecord(item)) continue;

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : crypto.randomUUID();

    if (item.type === "text") {
      const content = typeof item.content === "string" ? item.content.trim() : "";
      const boldScale = parseBoldScale(item.boldScale);
      if (boldScale !== undefined) {
        blocks.push({ id, type: "text", content, boldScale });
      } else {
        blocks.push({ id, type: "text", content });
      }
      continue;
    }

    if (item.type === "image") {
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!url) continue;
      const alt = typeof item.alt === "string" ? item.alt.trim() : "";
      if (alt) {
        blocks.push({ id, type: "image", url, alt });
      } else {
        blocks.push({ id, type: "image", url });
      }
    }
  }

  return blocks;
}

/** Фон кнопки по умолчанию (--primary-700) */
export const INFO_PAGE_BUTTON_DEFAULT_COLOR = "#104488";

/** Встроенный пресет «Красный» */
export const INFO_PAGE_BUTTON_RED_COLOR = "#DC2626";

/** Текст кнопки по умолчанию */
export const INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR = "#FFFFFF";

/** Встроенный пресет текста «Чёрный» (для светлого фона) */
export const INFO_PAGE_BUTTON_BLACK_TEXT_COLOR = "#111827";

const INFO_PAGE_BUTTON_BUILTIN_PRESET_COLORS = new Set([
  INFO_PAGE_BUTTON_RED_COLOR,
  INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR,
  INFO_PAGE_BUTTON_BLACK_TEXT_COLOR,
]);

export type BoldSegment = { text: string; bold: boolean };

/** Разбивает текст по `**жирный**` без HTML. Несовпавшие `**` остаются как есть. */
export function parseBoldSegments(text: string): BoldSegment[] {
  if (!text) return [];

  const segments: BoldSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false });
  }

  return segments;
}

export function normalizeInfoPageButtonColor(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^#([0-9A-Fa-f]{3})$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^#([0-9A-Fa-f]{6})$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

export function parseInfoPageButtonColorPresets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    const hex = normalizeInfoPageButtonColor(
      typeof item === "string" ? item : null,
    );
    if (!hex) continue;
    if (INFO_PAGE_BUTTON_BUILTIN_PRESET_COLORS.has(hex)) continue;
    if (seen.has(hex)) continue;
    seen.add(hex);
    result.push(hex);
  }

  return result;
}

export function mergeInfoPageButtonColorPreset(
  existing: string[],
  hex: string,
): string[] {
  const color = normalizeInfoPageButtonColor(hex);
  if (!color || INFO_PAGE_BUTTON_BUILTIN_PRESET_COLORS.has(color)) {
    return parseInfoPageButtonColorPresets(existing);
  }
  const presets = parseInfoPageButtonColorPresets(existing);
  if (presets.includes(color)) return presets;
  return [...presets, color];
}
