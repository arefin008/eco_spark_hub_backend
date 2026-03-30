import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { envVariables } from "../config/env";
import { authCookieSettings } from "../utils/authCookie";
import { sendEmail } from "../utils/email";
import { prisma } from "./prisma";

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
const toOrigin = (value: string) => new URL(value).origin;
const AUTH_PUBLIC_URL = envVariables.FRONTEND_URL.replace(/\/$/, "");
const GOOGLE_REDIRECT_URI = `${AUTH_PUBLIC_URL}/api/auth/callback/google`;

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
  baseURL: AUTH_PUBLIC_URL,
  secret: envVariables.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  account: {
    // Local Google OAuth can lose the temporary state cookie across redirects.
    // Keep the security check enabled in production.
    skipStateCookieCheck: envVariables.NODE_ENV === "development",
  },
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
      redirectURI: GOOGLE_REDIRECT_URI,
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
    expiresIn: SEVEN_DAYS_IN_SECONDS,
    updateAge: 60 * 60 * 12,
  },
  trustedOrigins: [
    toOrigin(envVariables.FRONTEND_URL),
    toOrigin(envVariables.BETTER_AUTH_URL),
  ],
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
    useSecureCookies: authCookieSettings.shouldUseSecureCookies,
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: authCookieSettings.sameSite,
          path: "/",
          maxAge: SEVEN_DAYS_IN_SECONDS,
        },
      },
    },
  },
});
