-- AlterTable
ALTER TABLE "products" ADD COLUMN "hasModifications" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "product_modifications" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentAu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentAg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentPt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentPd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentAuUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentAgUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentPtUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentPdUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "product_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_modifications_productId_idx" ON "product_modifications"("productId");

-- AddForeignKey
ALTER TABLE "product_modifications" ADD CONSTRAINT "product_modifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
