-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN "promoButtonUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "global_settings" ADD COLUMN "promoButtonLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "global_settings" ADD COLUMN "promoButtonCaption" TEXT NOT NULL DEFAULT '';

-- Backfill existing promo button from the contact VK link
UPDATE "global_settings"
SET
  "promoButtonUrl" = CASE
    WHEN TRIM("vkLink") <> '' THEN "vkLink"
    ELSE 'https://vk.com/dragsoyuz'
  END,
  "promoButtonLabel" = 'Условия акции во ВКонтакте',
  "promoButtonCaption" = 'Откроется страница сообщества в новой вкладке';
