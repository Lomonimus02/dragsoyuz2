export const DESCRIPTION_FIELDS = [
  { key: "name", label: "Наименование", placeholder: "Конденсаторы КМ зелёные", basic: true, multiline: false },
  { key: "group", label: "Группа", placeholder: "общая (Н90, F, U, M, L)", basic: true, multiline: false },
  { key: "size", label: "Размер", placeholder: "любой", basic: true, multiline: false },
  { key: "type", label: "Тип", placeholder: "керамические многослойные, герметичные", basic: true, multiline: false },
  { key: "appearance", label: "Внешний вид", placeholder: "прямоугольный корпус, выводы с двух сторон", basic: true, multiline: true },
  { key: "acceptance", label: "Принимаем", placeholder: "без железных выводов", basic: true, multiline: true },
  { key: "body", label: "Корпус", placeholder: "DIP-16 (16 выводов)", basic: false, multiline: false },
  { key: "substrate", label: "Подложка", placeholder: "отсутствует", basic: false, multiline: false },
  { key: "application", label: "Применение", placeholder: "измерительные приборы, системы связи", basic: false, multiline: true },
  { key: "metals", label: "Содержание драгметаллов", placeholder: "позолоченные выводы и контактные площадки", basic: false, multiline: true },
  { key: "condition", label: "Состояние", placeholder: "любое", basic: false, multiline: false },
] as const;

export type DescriptionFieldKey = typeof DESCRIPTION_FIELDS[number]["key"];
type FieldValues = Partial<Record<DescriptionFieldKey, string>>;
export type ProductDescriptionDraft = {
  fields: FieldValues;
  additionalText: string;
  originalText: string;
  initialFields: FieldValues;
  initialAdditionalText: string;
};

const normalize = (label: string) => label.trim().toLowerCase().replaceAll("ё", "е");
const labelKeys = new Map<string, DescriptionFieldKey>(DESCRIPTION_FIELDS.map(field => [normalize(field.label), field.key]));
labelKeys.set("название", "name");
labelKeys.set("условия приема", "acceptance");

// Existing descriptions stay plain text in storage. Recognize only whole, known
// labels at the start of a line; leave unfamiliar prose and repeated labels intact.
export function parseProductDescription(text: string | null | undefined): ProductDescriptionDraft {
  const originalText = text ?? "";
  const fields: FieldValues = {};
  const otherLines: string[] = [];
  let activeField: DescriptionFieldKey | undefined;
  for (const line of originalText.split(/\r?\n/)) {
    if (activeField && line.startsWith("\t")) {
      fields[activeField] += `\n${line.slice(1)}`;
      continue;
    }
    const match = line.match(/^\s*(?:[·•*\-]\s*)?([^:\r\n]+):\s*(.*)$/);
    const key = match ? labelKeys.get(normalize(match[1])) : undefined;
    if (match && key && !(key in fields)) {
      fields[key] = match[2].trim();
      activeField = key;
    } else {
      otherLines.push(line);
      activeField = undefined;
    }
  }
  for (const { key } of DESCRIPTION_FIELDS) {
    if (fields[key] !== undefined) fields[key] = fields[key].trim().replace(/;$/, "").trimEnd();
  }
  const additionalText = otherLines.join("\n").trim();
  return { fields, additionalText, originalText, initialFields: { ...fields }, initialAdditionalText: additionalText };
}

export function formatProductDescription(draft: ProductDescriptionDraft): string {
  const fieldsUnchanged = DESCRIPTION_FIELDS.every(({ key }) => (draft.fields[key] ?? "") === (draft.initialFields[key] ?? ""));
  // Opening a legacy description and saving unrelated fields must not rewrite it.
  if (fieldsUnchanged && draft.additionalText === draft.initialAdditionalText) return draft.originalText;
  const lines = DESCRIPTION_FIELDS.flatMap(({ key, label }) => {
    const value = draft.fields[key]?.trim().replace(/;$/, "").trimEnd().replace(/\r\n?/g, "\n").replaceAll("\n", "\n\t");
    return value ? [`${label}: ${value};`] : [];
  });
  return [lines.join("\n"), draft.additionalText.trim()].filter(Boolean).join("\n\n");
}
