BEGIN;
ALTER TYPE "UnitType" ADD VALUE IF NOT EXISTS 'CONTACT';
ALTER TABLE categories ADD COLUMN "infoPageButtonSubtitle" TEXT;
ALTER TABLE product_modifications ADD COLUMN "unitType" "UnitType", ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
WITH ranked AS (
 SELECT id, row_number() OVER (PARTITION BY "productId" ORDER BY ctid)::int AS pos FROM product_modifications
) UPDATE product_modifications m SET position=ranked.pos FROM ranked WHERE ranked.id=m.id;
CREATE INDEX "product_modifications_productId_position_id_idx" ON product_modifications ("productId",position,id);
COMMIT;
