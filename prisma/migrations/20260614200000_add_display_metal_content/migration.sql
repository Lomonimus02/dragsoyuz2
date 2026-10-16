-- AlterTable
ALTER TABLE "products" ADD COLUMN "displayContentGold" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "displayContentSilver" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "displayContentPlatinum" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "displayContentPalladium" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "displayContentCustomized" BOOLEAN NOT NULL DEFAULT false;

-- Существующие товары: отображение = расчётное содержание (новое)
UPDATE "products" SET
  "displayContentGold" = "contentGold",
  "displayContentSilver" = "contentSilver",
  "displayContentPlatinum" = "contentPlatinum",
  "displayContentPalladium" = "contentPalladium",
  "displayContentCustomized" = false;
