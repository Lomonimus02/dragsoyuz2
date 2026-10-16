-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN "storePhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "isShowcaseFace" BOOLEAN NOT NULL DEFAULT false;
