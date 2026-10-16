-- AlterTable
ALTER TABLE "categories" ADD COLUMN "infoPageEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN "infoPageButtonLabel" TEXT;
ALTER TABLE "categories" ADD COLUMN "infoPageBlocks" JSONB NOT NULL DEFAULT '[]';
