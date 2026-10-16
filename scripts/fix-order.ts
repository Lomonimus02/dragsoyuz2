/**
 * Скрипт для исправления sortOrder у категорий и товаров.
 * 
 * Запуск: npx tsx scripts/fix-order.ts
 * 
 * Скрипт присваивает последовательные sortOrder (1, 2, 3, ...) 
 * всем категориям и товарам, у которых sortOrder = 0 или дублируется.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Используем тот же способ подключения, что и в проекте
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixCategorySortOrders() {
  console.log("📂 Исправление sortOrder для категорий...");
  console.log("   (ПРИНУДИТЕЛЬНАЯ нумерация по parentId)\n");

  // Получаем все категории, отсортированные по parentId и дате создания
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, parentId: true, sortOrder: true },
  });

  console.log(`   Найдено категорий: ${categories.length}`);

  // Группируем категории по parentId
  const groupedByParent = new Map<string | null, typeof categories>();
  for (const cat of categories) {
    const key = cat.parentId;
    if (!groupedByParent.has(key)) {
      groupedByParent.set(key, []);
    }
    groupedByParent.get(key)!.push(cat);
  }

  // ПРИНУДИТЕЛЬНО обновляем sortOrder для каждой группы
  let totalUpdated = 0;
  for (const [parentId, cats] of groupedByParent) {
    const groupName = parentId === null ? "Корневые" : `Подкатегории (parent: ${parentId})`;
    console.log(`\n   📁 ${groupName}:`);
    
    for (let i = 0; i < cats.length; i++) {
      const category = cats[i];
      const newSortOrder = i + 1;

      // Всегда обновляем для гарантии правильного порядка
      await prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: newSortOrder },
      });
      console.log(`      ✓ "${category.name}": ${category.sortOrder} → ${newSortOrder}`);
      totalUpdated++;
    }
  }

  console.log(`\n✅ Категории обновлены! (${totalUpdated}/${categories.length})\n`);
}

async function fixProductSortOrders() {
  console.log("📦 Исправление sortOrder для товаров...");
  console.log("   (ПРИНУДИТЕЛЬНАЯ нумерация по категориям)\n");

  // Получаем все товары с информацией о категории, отсортированные по categoryId и дате создания
  const products = await prisma.product.findMany({
    orderBy: [{ categoryId: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, categoryId: true, sortOrder: true, category: { select: { name: true } } },
  });

  console.log(`   Найдено товаров: ${products.length}`);

  // Группируем товары по categoryId
  const groupedByCategory = new Map<string, typeof products>();
  for (const product of products) {
    const key = product.categoryId;
    if (!groupedByCategory.has(key)) {
      groupedByCategory.set(key, []);
    }
    groupedByCategory.get(key)!.push(product);
  }

  // ПРИНУДИТЕЛЬНО обновляем sortOrder для каждой группы
  let totalUpdated = 0;
  for (const [categoryId, prods] of groupedByCategory) {
    const categoryName = prods[0]?.category?.name || categoryId;
    console.log(`\n   📁 Категория "${categoryName}":`);
    
    for (let i = 0; i < prods.length; i++) {
      const product = prods[i];
      const newSortOrder = i + 1;

      // Всегда обновляем для гарантии правильного порядка
      await prisma.product.update({
        where: { id: product.id },
        data: { sortOrder: newSortOrder },
      });
      totalUpdated++;
      // Выводим только первые 5 обновлений в каждой категории
      if (i < 5) {
        console.log(`      ✓ "${product.name}": ${product.sortOrder} → ${newSortOrder}`);
      } else if (i === 5) {
        console.log(`      ... и ещё ${prods.length - 5} товаров`);
      }
    }
  }

  console.log(`\n✅ Товары обновлены! (${totalUpdated}/${products.length})\n`);
}

async function main() {
  console.log("\n🔧 Запуск скрипта исправления sortOrder\n");
  console.log("=".repeat(50) + "\n");

  try {
    await fixCategorySortOrders();
    await fixProductSortOrders();

    console.log("=".repeat(50));
    console.log("🎉 Все данные успешно обновлены!");
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
