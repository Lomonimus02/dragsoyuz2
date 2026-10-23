import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { assertLocalPreviewDatabase } from "../src/lib/local-preview";

if (process.env.LOCAL_PREVIEW !== "1") throw new Error("This script only runs in LOCAL_PREVIEW=1.");
assertLocalPreviewDatabase(process.env.DATABASE_URL);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const identity = (await pool.query("SELECT current_database() AS name, inet_server_port() AS port")).rows[0];
  if (identity.name !== "dragsoyuz2" || identity.port !== 5478) throw new Error("Unexpected database identity.");
  const demoImages = { startsWith: "/local-demo/" };
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { image: demoImages }, select: { id: true, name: true, image: true, pageDescription: true } }),
    prisma.category.findMany({ where: { imageUrl: demoImages }, select: { id: true, name: true, imageUrl: true } }),
  ]);
  const backupDir = path.join(process.cwd(), ".git", "local-preview");
  await mkdir(backupDir, { recursive: true });
  await writeFile(path.join(backupDir, `demo-photos-before-${Date.now()}.json`), JSON.stringify({ products, categories }, null, 2), "utf8");
  await prisma.$transaction(async tx => {
    for (const product of products) {
      await tx.product.update({ where: { id: product.id }, data: {
        image: null,
        pageDescription: product.pageDescription?.replace("Изображение — схематическая иллюстрация. ", ""),
      } });
    }
    await tx.category.updateMany({ where: { imageUrl: demoImages }, data: { imageUrl: null } });
  });
  console.log(JSON.stringify({
    removedProductIllustrations: products.length,
    removedCategoryIllustrations: categories.length,
    remainingDemoImages: await prisma.product.count({ where: { image: demoImages } }),
    realProductPhotos: await prisma.product.count({ where: { image: { startsWith: "/images/catalog-photos/" } } }),
    totalProducts: await prisma.product.count(),
  }, null, 2));
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
