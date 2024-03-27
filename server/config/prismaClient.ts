import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
  var tradeCheck: string | undefined;
}
export const db = globalThis.prisma || new PrismaClient();

//if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
globalThis.prisma = db;
globalThis.tradeCheck = "global this passed!";