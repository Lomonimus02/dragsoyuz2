export type ProductCopyInput = { name: string; categoryName: string; categorySlug: string };
export type PurchaseCopySettings = Partial<{
  groupGenitive: string; groupAccusative: string; title: string; introduction: string;
  acceptance: string; yearText: string; benefitsHeading: string; benefits: string;
  conclusion: string; metaDescription: string;
}>;

const yearAdjustedSlugs = new Set(["tranzistory", "mikroshemy", "raz-emy", "razemy", "diody"]);
const yearAdjustedNames = new Set(["транзисторы", "микросхемы", "разъемы", "диоды"]);
const groups: [string, string, string, string][] = [
  ["kondensatory", "конденсаторы", "конденсаторов", "конденсаторы"],
  ["mikroshemy", "микросхемы", "микросхем", "микросхемы"],
  ["tranzistory", "транзисторы", "транзисторов", "транзисторы"],
  ["razemy", "разъемы", "разъёмов", "разъёмы"],
  ["diody", "диоды", "диодов", "диоды"],
  ["rezistory", "резисторы", "резисторов", "резисторы"],
  ["rele", "реле", "реле", "реле"],
  ["pereklyuchateli", "переключатели", "переключателей", "переключатели"],
  ["potentsiometry", "потенциометры", "потенциометров", "потенциометры"],
  ["protsessory-i-platy", "процессоры и платы", "процессоров и плат", "процессоры и платы"],
  ["akkumulyatory", "аккумуляторы", "аккумуляторов", "аккумуляторы"],
  ["lampy", "лампы", "ламп", "лампы"],
  ["tehnicheskoe-serebro", "техническое серебро", "технического серебра", "техническое серебро"],
  ["platinovaya-gruppa", "платиновая группа", "металлов платиновой группы", "металлы платиновой группы"],
  ["korpusa-chasov", "корпуса часов", "корпусов часов", "корпуса часов"],
  ["tantal", "тантал", "тантала", "тантал"],
];

export const purchaseCopyTemplates = {
  title: "Скупка {группа} ({название}) — выгодные цены и быстрая оценка | {бренд}",
  introduction: "{бренд} осуществляет скупку {группа} ({название}) в любом количестве и состоянии.",
  acceptance: "Мы принимаем {детали} ({название}) б/у и новые.",
  yearText: "Цена зависит от года выпуска и состояния. До 1990 г. — цена по прайсу; с 1990 г. — минус 10%; с 2000 г. — минус 20%; с 2010 г. — минус 40%.",
  benefitsHeading: "Почему стоит сдать {детали} ({название}) именно нам",
  benefits: "Честная оценка по актуальному прайсу;\nОплата наличными или на карту в день сделки;\nБесплатная консультация по стоимости;\nРаботаем с частными лицами и организациями;\nПринимаем партии от 1 штуки;",
  conclusion: "Сдача {группа} ({название}) в {бренд} — это гарантия честной цены, быстрой оценки и удобной сделки.",
  metaDescription: "Скупка {группа} ({название}) в {бренд}. Принимаем новые и б/у детали в любом количестве. Честная оценка по актуальному прайсу, оплата в день сделки.",
};

/** Only known plain-text fields are persisted. Rendering remains React-escaped. */
export function parsePurchaseCopySettings(value: unknown): PurchaseCopySettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: PurchaseCopySettings = {};
  const input = value as Record<string, unknown>;
  for (const key of ["groupGenitive", "groupAccusative", ...Object.keys(purchaseCopyTemplates)] as (keyof PurchaseCopySettings)[]) {
    if (typeof input[key] === "string") result[key] = input[key].trim().slice(0, key.startsWith("group") ? 160 : 5000);
  }
  return result;
}

export function purchaseCopyDefaults(categoryName: string, categorySlug: string) {
  const normalized = categoryName.trim().toLowerCase().replaceAll("ё", "е");
  const slug = categorySlug.replace("raz-emy", "razemy");
  const group = groups.find(([, name]) => normalized === name) ?? groups.find(([key]) => slug === key || slug.startsWith(key + "-"));
  return { ...purchaseCopyTemplates, groupGenitive: group?.[2] ?? "радиодеталей", groupAccusative: group?.[3] ?? "радиодетали" };
}

export function productPurchaseCopy(product: ProductCopyInput, brand: string, overrides?: PurchaseCopySettings) {
  const settings = { ...purchaseCopyDefaults(product.categoryName, product.categorySlug), ...parsePurchaseCopySettings(overrides) };
  const defaults = purchaseCopyDefaults(product.categoryName, product.categorySlug);
  const tokens: Record<string, string> = {
    "название": product.name.trim(), "бренд": brand,
    "группа": settings.groupGenitive || defaults.groupGenitive,
    "детали": settings.groupAccusative || defaults.groupAccusative,
  };
  const render = (text: string) => text.replace(/\{(название|бренд|группа|детали)\}/g, (_, key: string) => tokens[key]);
  const categoryName = product.categoryName.trim().toLowerCase().replaceAll("ё", "е");
  const hasYearAdjustment = yearAdjustedSlugs.has(product.categorySlug) || yearAdjustedNames.has(categoryName);
  const introduction = render(settings.introduction);
  const acceptance = [render(settings.acceptance), hasYearAdjustment ? render(settings.yearText) : ""].filter(Boolean).join(" ");
  return {
    title: render(settings.title || defaults.title), introduction, acceptance, hasYearAdjustment,
    benefitsHeading: render(settings.benefitsHeading),
    benefits: settings.benefits.split(/\r?\n/).map(line => render(line.trim())).filter(Boolean),
    conclusion: render(settings.conclusion), metaDescription: render(settings.metaDescription),
    schemaDescription: [introduction, acceptance].filter(Boolean).join(" "),
  };
}
