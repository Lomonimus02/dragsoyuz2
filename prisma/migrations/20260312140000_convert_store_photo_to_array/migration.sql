-- AlterTable: Convert storePhotoUrl (TEXT) to storePhotoUrls (TEXT[])

-- Add new column
ALTER TABLE "global_settings" ADD COLUMN "storePhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing data: if storePhotoUrl is not null, put it into the array
UPDATE "global_settings" SET "storePhotoUrls" = ARRAY["storePhotoUrl"] WHERE "storePhotoUrl" IS NOT NULL;

-- Drop old column
ALTER TABLE "global_settings" DROP COLUMN "storePhotoUrl";
