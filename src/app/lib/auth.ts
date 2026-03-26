import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVariables } from "../config/env";
import { sendEmail } from "../utils/email";
import { prisma } from "./prisma";

const userAdditionalFields = {
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
} as const;

export const auth = betterAuth({
  baseURL: envVariables.BETTER_AUTH_URL,
  secret: envVariables.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your EcoSpark password",
        templateName: "resetPassword",
        templateData: {
          name: user.name,
          resetUrl: url,
        },
      });
    },
  },
  socialProviders: {
    google: {
      clientId: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: () => ({
        role: UserRole.MEMBER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      }),
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your EcoSpark email",
        templateName: "verification",
        templateData: {
          name: user.name,
          verifyUrl: url,
        },
      });
    },
  },
  user: {
    additionalFields: userAdditionalFields,
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 12,
  },
  redirectURLs: {
    signIn: `${envVariables.BETTER_AUTH_URL}/api/v1/auth/me`,
  },
  trustedOrigins: [envVariables.FRONTEND_URL, envVariables.BETTER_AUTH_URL],
  plugins: [
    bearer(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true },
        });

        const subject =
          type === "forget-password"
            ? "EcoSpark password reset OTP"
            : "EcoSpark email verification OTP";

        await sendEmail({
          to: email,
          subject,
          templateName: "otp",
          templateData: {
            title: subject,
            heading: type === "forget-password" ? "Password Reset OTP" : "Email Verification OTP",
            name: user?.name || "EcoSpark User",
            otp,
            expiresInMinutes: 2,
          },
        });
      },
      expiresIn: 2 * 60,
      otpLength: 6,
    }),
  ],
  advanced: {
    useSecureCookies: false,
  },
});
