import type { ProductWithPrice } from "@/app/actions/products";
import { productPurchaseCopy, purchaseCopyDefaults, type PurchaseCopySettings } from "./product-purchase-copy";

export function productCatalogPath(product: Pick<ProductWithPrice, "categorySlug" | "slug">) {
  return `/catalog/${encodeURIComponent(product.categorySlug)}/${encodeURIComponent(product.slug)}`;
}

export function purchaseUnit(unit: ProductWithPrice["unitType"]) {
  return unit === "KG" ? "1 кг" : unit === "GRAM" ? "1 г" : "1 шт.";
}

// Current category names take precedence over historic, sometimes repurposed slugs.
export function categoryPreparation(name: string) {
  const key = name.toLowerCase().replaceAll("ё", "е");
  if (key.includes("конденсатор") && key.includes("км")) return {
    identify: "Сравните цвет корпуса и буквенную группу с карточкой: зелёные и рыжие КМ, H90, F, U, M, L, H30 и другие группы перечислены отдельно.",
    photos: "Сфотографируйте общий вид партии, маркировку крупным планом и выводы. Укажите вес каждой группы отдельно.",
    preparation: "Проверьте требования к выводам в описании выбранной позиции. Например, для зелёных КМ общей группы в каталоге указан приём без железных выводов.",
  };
  if (key.includes("конденсатор")) return {
    identify: "Сопоставьте серию конденсатора и исполнение с карточкой. При наличии нескольких вариантов выберите нужную строку таблицы.",
    photos: "Покажите полную маркировку, корпус и выводы. Укажите количество или вес по единице расчёта выбранной позиции.",
    preparation: "Не разбирайте конденсаторы до согласования оценки. Требования к корпусу и выводам проверяйте в описании конкретной позиции.",
  };
  if (key.includes("микросхем")) return {
    identify: "Сопоставьте серию, корпус, число выводов и подложек с названием позиции. Одной серии, например 130 или 133, недостаточно для выбора цены.",
    photos: "Покажите маркировку, верхнюю и нижнюю стороны корпуса. Укажите количество и год выпуска, если он читается.",
    preparation: "Разделите разные исполнения и новые и б/у детали. Если микросхемы ещё на платах, покажите плату целиком до демонтажа.",
  };
  if (key.includes("транзистор")) return {
    identify: "Проверьте полное обозначение, включая буквы после номера, корпус и исполнение выводов. КТ 970А и другие исполнения нужно сопоставлять с отдельными позициями.",
    photos: "Сделайте фото маркировки и выводов, сообщите количество, состояние и год выпуска, если он известен.",
    preparation: "Не смешивайте разные обозначения в одну расчётную позицию. Период выпуска выбирается в калькуляторе там, где он предусмотрен.",
  };
  if (key.includes("реле")) return {
    identify: "Для выбора позиции проверьте обозначение реле и полный номер паспорта. У одного семейства РЭС могут быть разные исполнения.",
    photos: "Покажите надписи на корпусе, паспорт и дату выпуска. Сообщите количество реле с одинаковой маркировкой.",
    preparation: "До согласования оценки сохраните читаемую маркировку и не смешивайте реле с разными паспортами.",
  };
  if (key.includes("разъем")) return {
    identify: "Проверьте тип разъёма, количество контактов и исполнение. ОНП, РППМ и другие серии сверяйте с соответствующей карточкой.",
    photos: "Сфотографируйте маркировку и обе стороны контактной части. Укажите количество и состояние деталей.",
    preparation: "Сохраняйте разъёмы целиком до согласования оценки. Условия для целого разъёма и отделённых контактов уточняются отдельно.",
  };
  if (key.includes("серебр")) return {
    identify: "Сопоставьте материал с карточкой: контакты на подложке и отделённые контакты могут относиться к разным позициям.",
    photos: "Покажите материал с обеих сторон и место соединения с подложкой. Укажите вес и наличие маркировки.",
    preparation: "Не определяйте состав только по цвету металла. Если точная позиция неизвестна, сначала согласуйте её по фото.",
  };
  if (key.includes("тантал")) return {
    identify: "Сравните тип материала и полную маркировку с карточкой. Для конденсаторов укажите серию и исполнение, для фольги или другого материала его вид.",
    photos: "Покажите маркировку и общий вид партии. Укажите вес или количество согласно единице в выбранной карточке.",
    preparation: "Согласуйте необходимость разборки до подготовки партии. Цену конкретной позиции нельзя переносить на материал неизвестного состава.",
  };
  return {
    identify: "Сопоставьте полное обозначение, внешний вид и исполнение с карточкой. Условия отдельных позиций могут различаться.",
    photos: "Подготовьте общий вид партии и крупное фото маркировки. Укажите количество или вес согласно единице в карточке.",
    preparation: "До разборки и отправки согласуйте выбранную позицию и способ передачи. Неизвестные детали покажите отдельно.",
  };
}

export function catalogPurchaseCopy(product: ProductWithPrice, brand: string, overrides?: PurchaseCopySettings) {
  const unit = purchaseUnit(product.unitType);
  const acceptance = product.isSingleType
    ? "В карточке используется единая цена без разделения на новые и б/у. Требования к состоянию и подготовке смотрите в описании позиции."
    : product.isNewAvailable && product.isUsedAvailable
      ? "В каталоге предусмотрены отдельные цены для новых и б/у деталей. Требования к подготовке смотрите в описании позиции."
      : product.isNewAvailable ? "В каталоге указана цена для новых деталей. Приём б/у для этой позиции не указан."
      : product.isUsedAvailable ? "В каталоге указана цена для б/у деталей. Приём новых для этой позиции не указан."
      : "Для этой позиции приём сейчас не указан. Уточните возможность оценки перед отправкой.";
  const description = `${product.name}: ${product.isPriceOnRequest ? "стоимость скупки по запросу" : `цены скупки за ${unit}`} в Санкт-Петербурге. ${product.hasModifications ? "Исполнения и цены приведены в таблице. " : ""}Условия приёма и оценка по фото в ${brand}.`;
  // Keep genuinely edited category copy. Old saved default templates do not
  // override factual defaults, which follow the flags of this exact product.
  const defaults = purchaseCopyDefaults(product.categoryName, product.categorySlug);
  const custom = Object.fromEntries(Object.entries(overrides ?? {}).filter(([key, value]) => value && value !== defaults[key as keyof typeof defaults]));
  const copy = productPurchaseCopy(product, brand, {
    title: `${product.name}: скупка в Санкт-Петербурге | ${brand}`,
    introduction: `${brand}: скупка «${product.name}» в Санкт-Петербурге. Расчёт в этой карточке указан за ${unit}.`,
    acceptance,
    yearText: "Если в калькуляторе предусмотрен период выпуска, выберите его для расчёта суммы.",
    benefitsHeading: "Что прислать для оценки",
    benefits: [categoryPreparation(product.categoryName).photos, "Сообщите выбранную позицию и состояние партии.", "Согласуйте оценку и способ передачи до поездки или отправки."].join("\n"),
    conclusion: "Итоговая сумма согласуется после проверки соответствия деталей выбранной позиции.",
    metaDescription: description,
    ...custom,
  });
  return copy;
}

export function productCatalogSchema(product: ProductWithPrice, baseUrl: string, description: string) {
  const url = baseUrl + productCatalogPath(product);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`, url, name: product.name, description,
    about: {
      "@type": "Product", name: product.name,
      category: product.categoryName,
      ...(product.image ? { image: new URL(product.image, baseUrl).toString() } : {}),
    },
  };
}
