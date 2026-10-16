ALTER TABLE "global_settings" ALTER COLUMN "yearPeriodDiscounts"
  SET DEFAULT '{"until1990":0,"from1990":10,"from2000":20,"from2010":40}';
UPDATE "global_settings"
SET "yearPeriodDiscounts" = jsonb_set(
  COALESCE("yearPeriodDiscounts", '{"until1990":0,"from1990":10,"from2000":20,"from2010":40}'::jsonb),
  '{from2010}',
  '40'::jsonb,
  true
);
