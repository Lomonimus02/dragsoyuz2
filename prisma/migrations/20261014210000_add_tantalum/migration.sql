-- Тантал (Ta): курс за 1 г, содержание в граммах. Ноль не меняет уже посчитанные цены.
ALTER TABLE "metal_rates" ADD COLUMN "tantalum" DECIMAL(18,10) NOT NULL DEFAULT 0;

ALTER TABLE "categories" ADD COLUMN "customRateTa" DOUBLE PRECISION;

ALTER TABLE "products" ADD COLUMN "contentTantalum" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "contentTantalumUsed" DECIMAL(18,10) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "displayContentTantalum" DECIMAL(18,10) NOT NULL DEFAULT 0;

ALTER TABLE "product_modifications" ADD COLUMN "contentTa" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "product_modifications" ADD COLUMN "contentTaUsed" DOUBLE PRECISION NOT NULL DEFAULT 0;
