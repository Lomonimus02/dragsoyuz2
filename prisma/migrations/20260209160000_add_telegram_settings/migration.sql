-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN "telegramBotToken" TEXT NOT NULL DEFAULT '';
ALTER TABLE "global_settings" ADD COLUMN "telegramChatId" TEXT NOT NULL DEFAULT '';
