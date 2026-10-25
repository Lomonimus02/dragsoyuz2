import assert from "node:assert/strict";
import test from "node:test";
import { parseProductDescription, formatProductDescription, DESCRIPTION_FIELDS, pageDescriptionText } from "./product-description-fields";

const legacy = "Наименование: Конденсаторы КМ зелёные;\r\nГруппа: общая (Н90, F, U, M, L);\r\nРазмер: любой;\r\nТип: Керамические многослойные, герметичные;\r\nВнешний вид: Корпус прямоугольный, зелёного цвета;\r\nПринимаем: без железных выводов;\r\n";

test("existing labelled descriptions open as values and round-trip without any rewrite", () => {
  const draft = parseProductDescription(legacy);
  assert.deepEqual(draft.fields, { name: "Конденсаторы КМ зелёные", group: "общая (Н90, F, U, M, L)", size: "любой", type: "Керамические многослойные, герметичные", appearance: "Корпус прямоугольный, зелёного цвета", acceptance: "без железных выводов" });
  assert.equal(draft.additionalText, "");
  assert.equal(formatProductDescription(draft), legacy);
});

test("changing one value retains the other characteristics and only adds labels once", () => {
  const draft = parseProductDescription(legacy);
  draft.fields.size = "малый";
  const saved = formatProductDescription(draft);
  assert.match(saved, /Размер: малый;/);
  assert.doesNotMatch(saved, /любой|;;/);
  assert.deepEqual(parseProductDescription(saved).fields, draft.fields);
});

test("unfamiliar prose, duplicate labels and technical text survive edits", () => {
  const source = "Микросхемы (аналоги: К130, К133)\n\n· Корпус: DIP-16\n· Подложка: отсутствует\nКорпус: особый вариант\nURL: https://example.com/a:b\nДополнение без подписи";
  const draft = parseProductDescription(source);
  assert.equal(formatProductDescription(draft), source);
  assert.equal(draft.fields.body, "DIP-16");
  draft.fields.substrate = "одна";
  const saved = formatProductDescription(draft);
  for (const text of ["Микросхемы (аналоги: К130, К133)", "Корпус: особый вариант", "URL: https://example.com/a:b", "Дополнение без подписи"]) assert.ok(saved.includes(text));
  assert.equal(parseProductDescription(saved).fields.substrate, "одна");
});

test("empty fields are omitted, list punctuation within values is retained", () => {
  const draft = parseProductDescription(null);
  draft.fields = { name: "КМ", group: "H30; D;", size: "  ", type: "" };
  assert.equal(formatProductDescription(draft), "Наименование: КМ;\nГруппа: H30; D;");
});

test("admin placeholders stay out of stored and public description text", () => {
  for (const field of DESCRIPTION_FIELDS) {
    assert.doesNotMatch(field.placeholder, /КМ|Н90|N90|керамическ|железн|DIP-16/i);
  }
  const empty = formatProductDescription(parseProductDescription(""));
  assert.equal(empty, "");
  assert.equal(pageDescriptionText("  \n"), "");
  assert.equal(pageDescriptionText(null), "");
  for (const field of DESCRIPTION_FIELDS) assert.equal(empty.includes(field.placeholder), false);
});

test("multiline values remain inside their fields after saving and reopening", () => {
  const draft = parseProductDescription("");
  draft.fields.appearance = "Корпус: прямоугольный\nВыводы с двух сторон\nТип: керамический";
  assert.deepEqual(parseProductDescription(formatProductDescription(draft)).fields, draft.fields);
});

test("free text is preserved and blank input produces no description", () => {
  const text = "Принимаем транзисторы 2Т, КТ.\nИспользовались в блоках питания.";
  assert.equal(parseProductDescription(text).additionalText, text);
  assert.equal(formatProductDescription(parseProductDescription(text)), text);
  assert.equal(formatProductDescription(parseProductDescription("")), "");
});

test("known label aliases and bullet points are recognized without guessing arbitrary headings", () => {
  const draft = parseProductDescription("• Название: Деталь;\nУсловия приёма: без выводов;\nРазмеры упаковки: 10 см");
  assert.deepEqual(draft.fields, { name: "Деталь", acceptance: "без выводов" });
  assert.equal(draft.additionalText, "Размеры упаковки: 10 см");
});
