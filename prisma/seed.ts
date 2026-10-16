import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // 0. Создаем или обновляем глобальные настройки (единственная запись с id="global")
  // Хешируем дефолтный пароль admin123 для первоначальной настройки
  const defaultPassword = "admin123";
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
  
  // Проверяем, есть ли уже запись и установлен ли пароль
  const existingSettings = await prisma.globalSettings.findUnique({
    where: { id: "global" },
    select: { adminPasswordHash: true },
  });
  
  const globalSettings = await prisma.globalSettings.upsert({
    where: { id: "global" },
    update: existingSettings?.adminPasswordHash ? {} : { adminPasswordHash: defaultPasswordHash },
    create: {
      id: "global",
      priceMarkup: 1.0, // Дефолтная наценка 0% (коэффициент 1.0)
      adminPasswordHash: defaultPasswordHash, // Дефолтный пароль: admin123
    },
  });
  console.log("✅ Глобальные настройки созданы: priceMarkup =", globalSettings.priceMarkup);
  if (!existingSettings?.adminPasswordHash) {
    console.log("   📌 Дефолтный пароль администратора: admin123 (рекомендуется сменить после первого входа)");
  }

  // 1. Создаем или обновляем курсы металлов (единственная запись с id="current")
  const metalRate = await prisma.metalRate.upsert({
    where: { id: "current" },
    update: {},
    create: {
      id: "current",
      gold: new Prisma.Decimal(0),
      silver: new Prisma.Decimal(0),
      platinum: new Prisma.Decimal(0),
      palladium: new Prisma.Decimal(0),
    },
  });
  console.log("✅ Курсы металлов созданы:", metalRate);

  // 2. Создаем корневые категории
  const categoryMicrocircuits = await prisma.category.upsert({
    where: { slug: "mikroshemy" },
    update: {},
    create: {
      name: "Микросхемы",
      slug: "mikroshemy",
    },
  });

  const categoryConnectors = await prisma.category.upsert({
    where: { slug: "razemy" },
    update: {},
    create: {
      name: "Разъемы",
      slug: "razemy",
    },
  });

  const categoryTransistors = await prisma.category.upsert({
    where: { slug: "tranzistory" },
    update: {},
    create: {
      name: "Транзисторы",
      slug: "tranzistory",
    },
  });

  const categoryCapacitors = await prisma.category.upsert({
    where: { slug: "kondensatory" },
    update: {},
    create: {
      name: "Конденсаторы",
      slug: "kondensatory",
    },
  });

  console.log("✅ Категории созданы:", [
    categoryMicrocircuits.name,
    categoryConnectors.name,
    categoryTransistors.name,
    categoryCapacitors.name,
  ]);

  // 3. Создаем подкатегории
  const subcategoryKM = await prisma.category.upsert({
    where: { slug: "kondensatory-km" },
    update: {},
    create: {
      name: "Конденсаторы КМ",
      slug: "kondensatory-km",
      parentId: categoryCapacitors.id,
    },
  });

  const subcategoryMilitaryIC = await prisma.category.upsert({
    where: { slug: "mikroshemy-voennye" },
    update: {},
    create: {
      name: "Военные микросхемы",
      slug: "mikroshemy-voennye",
      parentId: categoryMicrocircuits.id,
    },
  });

  console.log("✅ Подкатегории созданы:", [subcategoryKM.name, subcategoryMilitaryIC.name]);

  // 4. Создаем тестовые товары
  const products = [
    {
      name: "КМ-5 зеленый",
      slug: "km-5-zelenyy",
      categoryId: subcategoryKM.id,
      contentGold: new Prisma.Decimal(0.0023),
      contentSilver: new Prisma.Decimal(0.015),
      contentPlatinum: new Prisma.Decimal(0.0001),
      contentPalladium: new Prisma.Decimal(0.0085),
    },
    {
      name: "КМ-6 оранжевый",
      slug: "km-6-oranzhevyy",
      categoryId: subcategoryKM.id,
      contentGold: new Prisma.Decimal(0.0018),
      contentSilver: new Prisma.Decimal(0.012),
      contentPlatinum: new Prisma.Decimal(0.0002),
      contentPalladium: new Prisma.Decimal(0.0092),
    },
    {
      name: "К10-17 синий корпус",
      slug: "k10-17-siniy",
      categoryId: subcategoryKM.id,
      contentGold: new Prisma.Decimal(0),
      contentSilver: new Prisma.Decimal(0.008),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0.0045),
    },
    {
      name: "133ЛА3",
      slug: "133la3",
      categoryId: subcategoryMilitaryIC.id,
      contentGold: new Prisma.Decimal(0.152),
      contentSilver: new Prisma.Decimal(0.021),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0),
    },
    {
      name: "К155ИЕ2",
      slug: "k155ie2",
      categoryId: subcategoryMilitaryIC.id,
      contentGold: new Prisma.Decimal(0.089),
      contentSilver: new Prisma.Decimal(0.015),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0),
    },
    {
      name: "Транзистор КТ315 (позолота)",
      slug: "kt315-pozolota",
      categoryId: categoryTransistors.id,
      contentGold: new Prisma.Decimal(0.0003),
      contentSilver: new Prisma.Decimal(0),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0),
    },
    {
      name: "Разъем СНП59-64",
      slug: "snp59-64",
      categoryId: categoryConnectors.id,
      contentGold: new Prisma.Decimal(0.85),
      contentSilver: new Prisma.Decimal(0.12),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0),
    },
    {
      name: "Разъем 2РМ (с фиксированными ценами)",
      slug: "2rm",
      categoryId: categoryConnectors.id,
      contentGold: new Prisma.Decimal(0.5),
      contentSilver: new Prisma.Decimal(0.08),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0),
      isNewAvailable: true,
      isUsedAvailable: true,
      manualPriceNew: new Prisma.Decimal(1800.0), // Фиксированная цена для нового
      manualPriceUsed: new Prisma.Decimal(1500.0), // Фиксированная цена для б/у
    },
    {
      name: "Конденсатор КМ-4 (только б/у)",
      slug: "km-4-bu",
      categoryId: subcategoryKM.id,
      contentGold: new Prisma.Decimal(0.0015),
      contentSilver: new Prisma.Decimal(0.010),
      contentPlatinum: new Prisma.Decimal(0),
      contentPalladium: new Prisma.Decimal(0.0065),
      isNewAvailable: false, // Не принимаем новые
      isUsedAvailable: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log(`✅ Создано ${products.length} тестовых товаров`);

  console.log("\n🎉 База данных успешно заполнена!");
  console.log("\n📊 Статистика:");
  console.log(`   - Глобальные настройки: 1 запись (priceMarkup: ${globalSettings.priceMarkup})`);
  console.log(`   - Курсы металлов: 1 запись`);
  console.log(`   - Категорий: ${await prisma.category.count()}`);
  console.log(`   - Товаров: ${await prisma.product.count()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Ошибка при заполнении базы:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
