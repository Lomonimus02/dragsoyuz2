import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { assertLocalPreviewDatabase } from "./local-preview";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaFingerprint?: string;
};

/** Отпечаток всей схемы — при любом изменении model/полей сбрасывает кэш клиента в dev */
function getSchemaFingerprint(): string {
  return Prisma.dmmf.datamodel.models
    .map(
      (model) =>
        `${model.name}:${model.fields
          .map((field) => field.name)
          .sort()
          .join(",")}`,
    )
    .sort()
    .join("|");
}

function createPrismaClient() {
  if (process.env.LOCAL_PREVIEW === "1") {
    assertLocalPreviewDatabase(process.env.DATABASE_URL);
  }
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_SIZE || 10),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const fingerprint = getSchemaFingerprint();
  const cached = globalForPrisma.prisma;
  const cachedFingerprint = globalForPrisma.prismaSchemaFingerprint;

  if (cached && cachedFingerprint === fingerprint) {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaFingerprint = fingerprint;
  return client;
}

export const prisma = getPrismaClient();

export default prisma;
