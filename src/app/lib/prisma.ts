import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { envVariables } from "../config/env";

const adapter = new PrismaPg({ connectionString: envVariables.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
