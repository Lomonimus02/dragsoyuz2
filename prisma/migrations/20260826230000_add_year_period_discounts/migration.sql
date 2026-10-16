-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN "yearPeriodDiscounts" JSONB NOT NULL DEFAULT '{"until1990":10,"from1990":0,"from2000":20,"from2010":40}';
