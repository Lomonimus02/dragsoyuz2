export type ArticleBodyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string; level?: 2 | 3 }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

export type InlinePiece = {
  text: string;
  bold: boolean;
  href?: string;
};

export type ArticleMarkupKind = "heading" | "ul" | "ol";

const MARKUP_PREFIX: Record<ArticleMarkupKind, string> = {
  heading: "## ",
  ul: "- ",
  ol: "1. ",
};

export const ARTICLE_TABLE_TEMPLATE = `:::table
Марка | До 1990 | С 2010
КТ315 | **высокая** | низкая
:::`;

const TABLE_FENCE = /:::table\r?\n([\s\S]*?)\r?\n:::/;

export function articleBodyHasTable(body: string): boolean {
  return body.includes(":::table");
}

export function stripArticleTables(body: string): string {
  return body.replace(/:::table[\s\S]*?:::/g, " ");
}

function splitCells(line: string): string[] {
  return line.split(" | ");
}

function parseTableBlock(raw: string): { header: string[]; rows: string[][] } | null {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return null;

  const header = splitCells(lines[0]);
  const columnCount = Math.max(header.length, 1);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCells(line);
    while (cells.length < columnCount) cells.push("");
    return cells;
  });

  return { header, rows };
}

/** Жирный текст `**так**` / `__так__` и ссылки Markdown `[текст](https://...)`. */
export function parseInlineMarkdown(input: string): InlinePiece[] {
  if (!input) return [];

  const pieces: InlinePiece[] = [];
  const re =
    /\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIndex) {
      pieces.push({ text: input.slice(lastIndex, match.index), bold: false });
    }
    if (match[1] != null) pieces.push({ text: match[1], bold: true });
    else if (match[2] != null) pieces.push({ text: match[2], bold: true });
    else pieces.push({ text: match[3], bold: false, href: match[4] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    pieces.push({ text: input.slice(lastIndex), bold: false });
  }

  return pieces.length > 0 ? pieces : [{ text: input, bold: false }];
}

/** Собирает разметку статьи из блоков. Пустые абзацы и пункты не попадают в текст. */
export function serializeArticleBody(blocks: ArticleBodyBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.kind === "paragraph") {
      if (block.text.trim()) parts.push(block.text);
      continue;
    }

    if (block.kind === "heading") {
      const text = block.text.trim();
      if (text) parts.push(`${block.level === 3 ? "###" : "##"} ${text}`);
      continue;
    }

    if (block.kind === "quote") {
      const lines = block.text
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length > 0) parts.push(lines.map((line) => `> ${line}`).join("\n"));
      continue;
    }

    if (block.kind === "ul" || block.kind === "ol") {
      const items = block.items.map((item) => item.trim()).filter((item) => item.length > 0);
      if (items.length === 0) continue;
      parts.push(
        items
          .map((item, index) => (block.kind === "ul" ? `- ${item}` : `${index + 1}. ${item}`))
          .join("\n"),
      );
      continue;
    }

    const header = `| ${block.header.join(" | ")} |`;
    const rule = `| ${block.header.map(() => "---").join(" | ")} |`;
    const rows = block.rows.map((row) => `| ${row.join(" | ")} |`);
    parts.push([header, rule, ...rows].join("\n"));
  }

  return parts.join("\n\n");
}

function splitMarkdownRow(line: string): string[] {
  let raw = line.trim();
  if (raw.startsWith("|")) raw = raw.slice(1);
  if (raw.endsWith("|")) raw = raw.slice(0, -1);
  return raw.split("|").map((cell) => cell.trim());
}

function isMarkdownSeparator(line: string): boolean {
  const cells = splitMarkdownRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isMarkdownTableStart(lines: string[], index: number): boolean {
  const current = lines[index] ?? "";
  const next = lines[index + 1] ?? "";
  return current.includes("|") && isMarkdownSeparator(next);
}

/** Обычный Markdown: заголовки, списки, цитаты, таблицы. Старый блок :::table тоже читается. */
export function parseArticleBody(body: string): ArticleBodyBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: ArticleBodyBlock[] = [];
  const paragraph: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join("\n").trim();
    paragraph.length = 0;
    if (text) blocks.push({ kind: "paragraph", text });
  };

  let index = 0;
  while (index < lines.length) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (trimmed === ":::table") {
      flushParagraph();
      const tableLines: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") {
        tableLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const table = parseTableBlock(tableLines.join("\n"));
      if (table) blocks.push({ kind: "table", ...table });
      continue;
    }

    if (isMarkdownTableStart(lines, index)) {
      flushParagraph();
      const header = splitMarkdownRow(lines[index]);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().includes("|")) {
        const cells = splitMarkdownRow(lines[index]);
        while (cells.length < header.length) cells.push("");
        rows.push(cells.slice(0, header.length));
        index += 1;
      }
      if (header.length > 0) blocks.push({ kind: "table", header, rows });
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({
        kind: "heading",
        text: heading[2].trim(),
        level: heading[1].length >= 3 ? 3 : 2,
      });
      index += 1;
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, ""));
        index += 1;
      }
      if (items.length > 0) blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      if (items.length > 0) blocks.push({ kind: "ol", items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quotes: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quotes.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      const text = quotes.join("\n").trim();
      if (text) blocks.push({ kind: "quote", text });
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph();
      index += 1;
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }

  flushParagraph();
  return blocks;
}

/** Текст без разметки: для описания и анонса. */
export function articlePlainText(body: string): string {
  return parseArticleBody(body)
    .flatMap((block) => {
      if (block.kind === "paragraph" || block.kind === "heading" || block.kind === "quote") {
        return [block.text];
      }
      if (block.kind === "ul" || block.kind === "ol") return block.items;
      return [];
    })
    .join(" ")
    .replace(/\*\*|__/g, "")
    .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isMarkupLine(line: string, kind: ArticleMarkupKind): boolean {
  if (kind === "heading") return line.startsWith("## ");
  if (kind === "ul") return line.startsWith("- ");
  return /^\d+\. /.test(line);
}

function previousContentLine(before: string): string {
  const end = before.endsWith("\n") ? before.slice(0, -1) : before;
  const nl = end.lastIndexOf("\n");
  return nl === -1 ? end : end.slice(nl + 1);
}

/** Вставляет строку ##, «- » или «1. » так, чтобы блок отделился пустой строкой. */
export function insertArticleMarkup(
  body: string,
  start: number,
  end: number,
  kind: ArticleMarkupKind,
): { value: string; cursor: number } {
  const prefix = MARKUP_PREFIX[kind];
  const safeStart = Math.max(0, Math.min(start, body.length));
  const safeEnd = Math.max(safeStart, Math.min(end, body.length));
  const before = body.slice(0, safeStart);
  const selected = body.slice(safeStart, safeEnd);
  const after = body.slice(safeEnd);

  const continueList =
    kind !== "heading" && isMarkupLine(previousContentLine(before), kind);

  let lead = "";
  if (before.length > 0) {
    if (continueList) {
      lead = before.endsWith("\n") ? "" : "\n";
    } else if (before.endsWith("\n\n")) {
      lead = "";
    } else if (before.endsWith("\n")) {
      lead = "\n";
    } else {
      lead = "\n\n";
    }
  }

  let trail = "";
  if (after.startsWith("\n") && !after.startsWith("\n\n")) {
    const nextLine = after.slice(1).split("\n", 1)[0];
    const continues = kind !== "heading" && isMarkupLine(nextLine, kind);
    if (!continues && nextLine.length > 0) {
      trail = "\n";
    }
  }

  const chunk = lead + prefix + selected + trail;
  return {
    value: before + chunk + after,
    cursor: before.length + lead.length + prefix.length + selected.length,
  };
}

export function insertArticleTable(
  body: string,
  start: number,
  end: number,
): { ok: true; value: string; cursor: number } | { ok: false; message: string } {
  if (articleBodyHasTable(body)) {
    return { ok: false, message: "В тексте уже есть таблица" };
  }

  const safeStart = Math.max(0, Math.min(start, body.length));
  const safeEnd = Math.max(safeStart, Math.min(end, body.length));
  const before = body.slice(0, safeStart);
  const after = body.slice(safeEnd);

  let prefix = "";
  if (before.length > 0 && !before.endsWith("\n\n")) {
    prefix = before.endsWith("\n") ? "\n" : "\n\n";
  }

  let suffix = "";
  if (after.length > 0 && !after.startsWith("\n\n")) {
    suffix = after.startsWith("\n") ? "\n" : "\n\n";
  }

  const chunk = prefix + ARTICLE_TABLE_TEMPLATE + suffix;
  return {
    ok: true,
    value: before + chunk + after,
    cursor: before.length + chunk.length,
  };
}
