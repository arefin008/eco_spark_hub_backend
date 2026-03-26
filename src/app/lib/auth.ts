import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVariables } from "../config/env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  baseURL: envVariables.BETTER_AUTH_URL,
  secret: envVariables.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.MEMBER,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 12,
  },
  trustedOrigins: [envVariables.FRONTEND_URL, envVariables.BETTER_AUTH_URL],
  plugins: [bearer()],
  advanced: {
    useSecureCookies: false,
  },
});
