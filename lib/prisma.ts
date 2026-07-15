import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var _hygienePrisma: PrismaClient | undefined;
}

export function db(): PrismaClient {
  if (!global._hygienePrisma) {
    const adapter = new PrismaMariaDb({
      host: process.env.HH_DB_HOST || "127.0.0.1",
      port: Number(process.env.HH_DB_PORT || 3306),
      user: process.env.HH_DB_USER,
      password: process.env.HH_DB_PASSWORD,
      database: process.env.HH_DB_NAME || "hygiene",
      connectionLimit: 10,
    });
    global._hygienePrisma = new PrismaClient({ adapter });
  }
  return global._hygienePrisma;
}

// ตัวช่วยแปลงวันที่จาก Prisma (Date object) → "YYYY-MM-DD"
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
