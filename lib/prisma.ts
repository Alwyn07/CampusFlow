import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

function resolveSslOptions(
  connectionString: string,
): { rejectUnauthorized: boolean } | undefined {
  const lower = connectionString.toLowerCase();

  if (lower.includes("sslmode=disable")) return undefined;
  if (lower.includes("sslmode=no-verify")) return { rejectUnauthorized: false };
  if (lower.includes("sslmode=require") || lower.includes("sslmode=prefer")) {
    return { rejectUnauthorized: false };
  }
  if (lower.includes("sslmode=verify-ca") || lower.includes("sslmode=verify-full")) {
    return undefined;
  }

  // No explicit sslmode in the URL. Managed/remote Postgres (e.g. Railway)
  // requires TLS; localhost keeps plain TCP so local development is unaffected.
  const host = connectionString.match(/@([^:/]+)/)?.[1]?.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  return isLocal ? undefined : { rejectUnauthorized: false };
}

const pool =
  globalForPrisma.prismaPool ??
  new Pool({
    connectionString,
    ssl: resolveSslOptions(connectionString),
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
