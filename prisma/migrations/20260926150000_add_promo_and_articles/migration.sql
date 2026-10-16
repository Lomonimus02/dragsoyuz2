-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN "promoEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "global_settings" ADD COLUMN "promoText" TEXT NOT NULL DEFAULT 'Подпишитесь на сообщество ВКонтакте — получите +1% к выплате';
ALTER TABLE "global_settings" ADD COLUMN "promoTerms" TEXT NOT NULL DEFAULT 'Подпишитесь на наше сообщество ВКонтакте и напишите нам сообщение. Акция действует до указанной даты. Подробности уточняйте у менеджера.';
ALTER TABLE "global_settings" ADD COLUMN "promoUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_published_createdAt_idx" ON "articles"("published", "createdAt");
