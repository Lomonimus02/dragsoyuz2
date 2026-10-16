-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PIECE', 'GRAM', 'KG');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "unitType" "UnitType" NOT NULL DEFAULT 'PIECE';
