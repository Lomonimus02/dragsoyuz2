-- CreateEnum
CREATE TYPE "CategoryBannerAlign" AS ENUM ('LEFT', 'CENTER', 'RIGHT');

-- CreateEnum
CREATE TYPE "CategoryBannerTheme" AS ENUM ('SOFT', 'BRAND', 'ACCENT', 'NOTICE', 'IMAGE');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "bannerEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "bannerTitle" TEXT;
ALTER TABLE "categories" ADD COLUMN "bannerText" TEXT;
ALTER TABLE "categories" ADD COLUMN "bannerAlign" "CategoryBannerAlign" NOT NULL DEFAULT 'LEFT';
ALTER TABLE "categories" ADD COLUMN "bannerTheme" "CategoryBannerTheme" NOT NULL DEFAULT 'SOFT';
ALTER TABLE "categories" ADD COLUMN "bannerImageUrl" TEXT;
ALTER TABLE "categories" ADD COLUMN "bannerLinkUrl" TEXT;
ALTER TABLE "categories" ADD COLUMN "bannerLinkLabel" TEXT;
ALTER TABLE "categories" ADD COLUMN "bannerShowGuide" BOOLEAN NOT NULL DEFAULT true;
