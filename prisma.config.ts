import "dotenv/config";
import { defineConfig } from "prisma/config";

function datasourceUrl(): string {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to configure Prisma.");
  }

  const lower = url.toLowerCase();
  if (lower.includes("sslmode=")) return url;

  // Managed/remote Postgres (e.g. Railway) requires TLS. The CLI's own
  // connection honors an explicit sslmode; localhost keeps plain TCP.
  const host = url.match(/@([^:/]+)/)?.[1]?.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  return isLocal ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: datasourceUrl(),
  },
});
