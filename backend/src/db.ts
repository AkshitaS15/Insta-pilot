import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (connectionString?.startsWith("libsql://") || connectionString?.startsWith("https://")) {
  const adapter = new PrismaLibSQL({
    url: connectionString,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

// SQLite optimizations for better performance
async function initSqlitePragmas(client: PrismaClient) {
  await client.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
  await client.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
  await client.$queryRawUnsafe("PRAGMA busy_timeout = 10000;");
  await client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
}

initSqlitePragmas(prisma);

export { prisma };
