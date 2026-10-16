import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
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
