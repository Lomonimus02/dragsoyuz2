import "dotenv/config";
import { PrismaClient, Prisma, UnitType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { assertLocalPreviewDatabase } from "../src/lib/local-preview";
import { categoryPhotos, productPhotos } from "./local-catalog-photos";

// This script only populates the isolated local preview; all values are fictional.
if (process.env.LOCAL_PREVIEW !== "1") {
  throw new Error("Set LOCAL_PREVIEW=1 in the local .env before seeding.");
}
assertLocalPreviewDatabase(process.env.DATABASE_URL);

type Family = "chip" | "capacitor" | "transistor" | "connector" | "relay" | "resistor" | "board";
type Entry = readonly [name: string, slug: string];
const groups: { name: string; slug: string; family: Family; price: number; products: Entry[] }[] = [
  { name: "Микросхемы", slug: "mikroshemy", family: "chip", price: 120, products: [
    ["133ЛА3", "133la3"], ["К155ИЕ2", "k155ie2"], ["К155ЛА3", "k155la3"],
    ["К555ТМ2", "k555tm2"], ["К561ЛА7", "k561la7"], ["К176ИЕ12", "k176ie12"],
    ["К573РФ2", "k573rf2"], ["КР580ВМ80А", "kr580vm80a"], ["К140УД7", "k140ud7"],
    ["К1533ИД7", "k1533id7"],
  ] },
  { name: "Конденсаторы", slug: "kondensatory", family: "capacitor", price: 180, products: [
    ["КМ-5 зеленый", "km-5-zelenyy"], ["КМ-6 оранжевый", "km-6-oranzhevyy"],
    ["К10-17 синий корпус", "k10-17-siniy"], ["Конденсатор КМ-4 (только б/у)", "km-4-bu"],
    ["КМ-3 зеленый", "km-3-zelenyy"], ["К52-1", "k52-1"], ["К53-4", "k53-4"],
    ["К50-6", "k50-6"], ["К73-17", "k73-17"], ["К15-5", "k15-5"],
  ] },
  { name: "Транзисторы", slug: "tranzistory", family: "transistor", price: 45, products: [
    ["Транзистор КТ315 (позолота)", "kt315-pozolota"], ["КТ361", "kt361"],
    ["КТ603", "kt603"], ["КТ608", "kt608"], ["КТ630", "kt630"],
    ["КТ805", "kt805"], ["КТ819", "kt819"], ["2Т312", "2t312"],
  ] },
  { name: "Разъемы", slug: "razemy", family: "connector", price: 950, products: [
    ["Разъем СНП59-64", "snp59-64"], ["Разъем 2РМ", "2rm"], ["СНП34-69", "snp34-69"],
    ["СНП14-72", "snp14-72"], ["ГРПМ1-31", "grpm1-31"], ["РП10-15", "rp10-15"],
    ["ШР20П4", "shr20p4"], ["РС32ТВ", "rs32tv"],
  ] },
  { name: "Реле", slug: "rele", family: "relay", price: 230, products: [
    ["РЭС-9", "res-9"], ["РЭС-10", "res-10"], ["РЭС-22", "res-22"],
    ["РЭС-49", "res-49"], ["РПС-20", "rps-20"], ["РЭС-64", "res-64"],
  ] },
  { name: "Резисторы", slug: "rezistory", family: "resistor", price: 75, products: [
    ["ПП3-43", "pp3-43"], ["ППБ-3", "ppb-3"], ["СП5-2", "sp5-2"], ["СП3-19", "sp3-19"],
  ] },
  { name: "Платы и модули", slug: "platy-i-moduli", family: "board", price: 2400, products: [
    ["Модули памяти DDR2", "memory-ddr2"], ["Модули памяти DDR3", "memory-ddr3"],
    ["Материнские платы", "motherboards"], ["Платы связи", "telecom-boards"],
  ] },
];


const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const identity = (await pool.query("SELECT current_database() AS name, inet_server_port() AS port")).rows[0];
  if (identity.name !== "dragsoyuz2" || identity.port !== 5478) throw new Error("Unexpected database identity.");
  const slugs = groups.flatMap(g => g.products.map(p => p[1]));
  if (slugs.length !== 50 || new Set(slugs).size !== 50) throw new Error("Expected 50 unique demo products.");
  const unknown = await prisma.product.count({ where: { slug: { notIn: slugs } } });
  if (unknown) throw new Error("The database contains other products; refusing to overwrite or delete them.");


  await prisma.$transaction(async tx => {
    await tx.globalSettings.upsert({
      where: { id: "global" },
      create: { id: "global", storePhotoUrls: [] },
      update: {},
    });
    await tx.globalSettings.update({ where: { id: "global" }, data: {
      telegramBotToken: "", telegramChatId: "", promoEnabled: false,
      showArrivalNotice: true,
      arrivalNoticeText: "Локальный демокаталог · 50 товаров · цены и состав условные",
    } });
    const rates = { gold: 6000, silver: 80, platinum: 2800, palladium: 3500, tantalum: 20 };
    await tx.metalRate.upsert({ where: { id: "current" }, create: { id: "current", ...rates }, update: rates });
    let number = 0;
    for (const [groupIndex, group] of groups.entries()) {
      const categoryData = {
        name: group.name, sortOrder: groupIndex,
        imageUrl: categoryPhotos[group.slug] ?? null,
        warningMessage: "Демонстрационные данные. Цены и содержание металлов указаны только для проверки сайта.",
      };
      const category = await tx.category.upsert({
        where: { slug: group.slug }, create: { slug: group.slug, ...categoryData }, update: categoryData,
      });
      let childId = category.id;
      if (group.family === "chip" || group.family === "capacitor") {
        const childSlug = group.family === "chip" ? "mikroshemy-voennye" : "kondensatory-km";
        const childData = {
          name: group.family === "chip" ? "Военные микросхемы" : "Конденсаторы КМ",
          parentId: category.id, imageUrl: categoryData.imageUrl,
          warningMessage: categoryData.warningMessage,
        };
        childId = (await tx.category.upsert({ where: { slug: childSlug }, create: { slug: childSlug, ...childData }, update: childData })).id;
      }
      for (const [position, [name, slug]] of group.products.entries()) {
        const price = group.price + position * (group.family === "board" ? 450 : 35);
        const gold = new Prisma.Decimal(((number % 7 + 1) * 0.002).toFixed(4));
        const silver = new Prisma.Decimal(((number % 9 + 1) * 0.015).toFixed(4));
        const data = {
          name, categoryId: position < (group.family === "chip" ? 2 : 5) ? childId : category.id,
          description: "Демонстрационная карточка для локального просмотра. Цены и содержание металлов условные.",
          pageDescription: `${name}. Тестовый товар для проверки каталога, поиска, корзины и редактирования. ${productPhotos[slug] ? "Изображение — фотография детали из предоставленного набора. " : ""}Эти данные не являются предложением скупки или справочными характеристиками детали.`,
          image: productPhotos[slug] ?? null, sortOrder: position,
          unitType: group.family === "board" ? UnitType.KG : UnitType.PIECE,
          isSingleType: group.family === "board", isPriceOnRequest: false,
          isNewAvailable: slug !== "km-4-bu", isUsedAvailable: true,
          isShowcaseFace: position === 0,
          manualPriceNew: new Prisma.Decimal(price), manualPriceUsed: new Prisma.Decimal(Math.round(price * 0.72)),
          contentGold: gold, contentSilver: silver, contentPlatinum: new Prisma.Decimal(0), contentPalladium: new Prisma.Decimal(0),
          contentGoldUsed: gold.mul(0.8), contentSilverUsed: silver.mul(0.8),
          displayContentGold: gold, displayContentSilver: silver,
        };
        await tx.product.upsert({ where: { slug }, create: { slug, ...data }, update: data });
        number++;
      }
    }
    if (await tx.product.count() !== 50) throw new Error("Final product count does not equal 50.");
  }, { timeout: 60000 });
  console.log(`Локальный демокаталог готов: ${await prisma.product.count()} товаров, ${await prisma.category.count()} категорий. Повторный запуск не создаёт дубликаты.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
