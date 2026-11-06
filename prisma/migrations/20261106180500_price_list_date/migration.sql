BEGIN;
ALTER TABLE global_settings ADD COLUMN "priceListDate" DATE,
  ALTER COLUMN "showArrivalNotice" SET DEFAULT false,
  ALTER COLUMN "arrivalNoticeText" SET DEFAULT '';
-- Only move a notice that consists entirely of the price date. Keep genuine announcements intact.
WITH dated AS (
  SELECT id, substring(trim("arrivalNoticeText") from '^Цены в каталоге актуальны на ([0-9]{2}[.][0-9]{2}[.][0-9]{4})$') AS stamp
  FROM global_settings WHERE "showArrivalNotice"
)
UPDATE global_settings s SET "priceListDate"=to_date(d.stamp,'DD.MM.YYYY'),
  "arrivalNoticeText"='', "showArrivalNotice"=false
FROM dated d WHERE d.id=s.id AND d.stamp IS NOT NULL AND to_char(to_date(d.stamp,'DD.MM.YYYY'),'DD.MM.YYYY')=d.stamp;
COMMIT;
