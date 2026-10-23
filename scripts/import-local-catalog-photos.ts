import "dotenv/config";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { assertLocalPreviewDatabase } from "../src/lib/local-preview";
import { categoryPhotos, productPhotos } from "./local-catalog-photos";

if (process.env.LOCAL_PREVIEW !== "1") throw new Error("This importer only runs in LOCAL_PREVIEW=1.");
assertLocalPreviewDatabase(process.env.DATABASE_URL);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const identity = (await pool.query("SELECT current_database() AS name, inet_server_port() AS port")).rows[0];
  if (identity.name !== "dragsoyuz2" || identity.port !== 5478) throw new Error("Unexpected database identity.");
  for (const file of new Set([...Object.values(categoryPhotos), ...Object.values(productPhotos)])) {
    await access(path.join(process.cwd(), "public", file));
  }
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true, name: true, imageUrl: true } }),
    prisma.product.findMany({ select: { id: true, slug: true, name: true, image: true, pageDescription: true } }),
  ]);
  const replaceable = (value: string | null, target: string) => !value || value.startsWith("/local-demo/") || value === target;
  const categoryUpdates = categories.filter(c => categoryPhotos[c.slug] && replaceable(c.imageUrl, categoryPhotos[c.slug]));
  const productUpdates = products.filter(p => productPhotos[p.slug] && replaceable(p.image, productPhotos[p.slug]));
  console.log(JSON.stringify({
    categories: categoryUpdates.map(c => ({ name: c.name, image: categoryPhotos[c.slug] })),
    products: productUpdates.map(p => ({ name: p.name, image: productPhotos[p.slug] })),
    totalProducts: products.length,
    apply: process.argv.includes("--apply"),
  }, null, 2));
  if (!process.argv.includes("--apply")) return;

  const backupDir = path.join(process.cwd(), ".git", "local-preview");
  await mkdir(backupDir, { recursive: true });
  const backup = path.join(backupDir, `catalog-photos-before-${Date.now()}.json`);
  await writeFile(backup, JSON.stringify({ categories: categoryUpdates, products: productUpdates }, null, 2), "utf8");
  await prisma.$transaction(async tx => {
    for (const category of categoryUpdates) {
      await tx.category.update({ where: { id: category.id }, data: { imageUrl: categoryPhotos[category.slug] } });
    }
    for (const product of productUpdates) {
      await tx.product.update({ where: { id: product.id }, data: {
        image: productPhotos[product.slug],
        pageDescription: product.pageDescription?.replace("Изображение — схематическая иллюстрация.", "Изображение — фотография детали из предоставленного набора."),
      } });
    }
  });
  console.log(`Updated ${categoryUpdates.length} categories and ${productUpdates.length} products. Backup: ${backup}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
