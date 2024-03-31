import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined //add prisma to global so it is accessible on globalThis
}

const prismadb = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalThis.prisma = prismadb

export default prismadb;