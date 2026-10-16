-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "contentGoldUsed" DECIMAL(10,6) NOT NULL DEFAULT 0,
ADD COLUMN     "contentPalladiumUsed" DECIMAL(10,6) NOT NULL DEFAULT 0,
ADD COLUMN     "contentPlatinumUsed" DECIMAL(10,6) NOT NULL DEFAULT 0,
ADD COLUMN     "contentSilverUsed" DECIMAL(10,6) NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
