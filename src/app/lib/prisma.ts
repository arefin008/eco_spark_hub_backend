import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { envVariables } from "../config/env";

type TPrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const prismaGlobal = globalThis as TPrismaGlobal;
const adapter = new PrismaPg({
  connectionString: envVariables.DATABASE_URL,
});

export const prisma =
  prismaGlobal.prisma ??
  new PrismaClient({
    adapter,
  });

if (envVariables.NODE_ENV !== "production") {
  prismaGlobal.prisma = prisma;
}

export const connectPrisma = async () => {
  await prisma.$connect();
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};
