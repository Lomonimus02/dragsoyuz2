-- CreateEnum
CREATE TYPE "InventoryMetalsMode" AS ENUM ('AUTO', 'INCLUDE', 'EXCLUDE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "inventoryMetalsMode" "InventoryMetalsMode" NOT NULL DEFAULT 'AUTO';
