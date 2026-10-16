ALTER TABLE "global_settings" ALTER COLUMN "yearPeriodDiscounts" SET DEFAULT '{"until1990":10,"from1990":0,"from2000":20,"from2010":30}';

UPDATE "global_settings"
SET "yearPeriodDiscounts" = jsonb_set(COALESCE("yearPeriodDiscounts", '{}'::jsonb), '{from2010}', '30'::jsonb, true);
