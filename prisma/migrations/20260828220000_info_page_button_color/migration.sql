-- AlterTable
ALTER TABLE "categories" ADD COLUMN "infoPageButtonColor" TEXT;
ALTER TABLE "global_settings" ADD COLUMN "infoPageButtonColorPresets" JSONB NOT NULL DEFAULT '[]';
