BEGIN;
ALTER TABLE global_settings
  ALTER COLUMN "priceListDateLabel" SET DEFAULT 'Цены в прайсе действительны на';

UPDATE global_settings
SET "priceListDateLabel" = 'Цены в прайсе действительны на'
WHERE "priceListDateLabel" = 'Цены в прайсе действительны на:';
COMMIT;
