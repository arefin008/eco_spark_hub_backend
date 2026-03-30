import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { UserStatus } from "../../../generated/prisma/enums";
import { envVariables } from "../../config/env";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import { tokenUtils, TAuthTokenPayload } from "../../utils/token";
import {
  TChangePasswordPayload,
  TForgotPasswordPayload,
  TLoginPayload,
  TRefreshTokenPayload,
  TRegisterPayload,
  TResetPasswordPayload,
  TVerifyEmailPayload,
} from "./auth.interface";

type TAuthApiUser = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "ADMIN";
  status?: UserStatus;
  emailVerified?: boolean;
};

type TSignInOrSignUpApiResponse = {
  user?: TAuthApiUser;
  token?: string;
};

const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });
};

const getUserBySessionToken = async (sessionToken: string) => {
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: {
      token: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  return session.user;
};

const getTrustedCallbackUrl = (callbackUrl?: string) => {
  const defaultCallbackUrl = envVariables.FRONTEND_URL;

  if (!callbackUrl) {
    return defaultCallbackUrl;
  }

  try {
    const requestedUrl = new URL(callbackUrl);
    const allowedOrigin = new URL(defaultCallbackUrl).origin;

    if (requestedUrl.origin !== allowedOrigin) {
      return defaultCallbackUrl;
    }

    return requestedUrl.toString();
  } catch {
    return defaultCallbackUrl;
  }
};

const getGoogleCallbackHandlerUrl = (redirectTo?: string) => {
  const callbackUrl = new URL(
    `${envVariables.BETTER_AUTH_URL.replace(/\/$/, "")}/api/v1/auth/google/callback`,
  );

  callbackUrl.searchParams.set("redirectTo", getTrustedCallbackUrl(redirectTo));

  return callbackUrl.toString();
};

const toTokenPayload = (user: TAuthApiUser): TAuthTokenPayload => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status || UserStatus.ACTIVE,
  emailVerified: user.emailVerified ?? false,
});

const parseSignInOrSignUpResponse = (
  value: unknown,
): TSignInOrSignUpApiResponse => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const token =
    "token" in value && typeof value.token === "string" ? value.token : undefined;

  if (!("user" in value) || !value.user || typeof value.user !== "object") {
    return { token };
  }

  const userObject = value.user as Record<string, unknown>;

  if (
    typeof userObject.id !== "string" ||
    typeof userObject.name !== "string" ||
    typeof userObject.email !== "string" ||
    (userObject.role !== "MEMBER" && userObject.role !== "ADMIN")
  ) {
    return { token };
  }

  const statusValue =
    userObject.status === UserStatus.ACTIVE ||
    userObject.status === UserStatus.DEACTIVATED
      ? userObject.status
      : undefined;

  return {
    token,
    user: {
      id: userObject.id,
      name: userObject.name,
      email: userObject.email,
      role: userObject.role,
      status: statusValue,
      emailVerified:
        typeof userObject.emailVerified === "boolean"
          ? userObject.emailVerified
          : undefined,
    },
  };
};

const getCurrentUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  }

  return user;
};

const register = async (payload: TRegisterPayload) => {
  const result = await auth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    },
  });

  const parsed = parseSignInOrSignUpResponse(result);

  if (!parsed.user) {
    throw new AppError(status.BAD_REQUEST, "Failed to register user");
  }

  const accessToken = tokenUtils.getAccessToken(toTokenPayload(parsed.user));
  const refreshToken = tokenUtils.getRefreshToken(toTokenPayload(parsed.user));

  return {
    accessToken,
    refreshToken,
    sessionToken: parsed.token,
    user: parsed.user,
  };
};

const login = async (payload: TLoginPayload) => {
  const result = await auth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password,
    },
  });

  const parsed = parseSignInOrSignUpResponse(result);

  if (!parsed.user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
  }

  if (parsed.user.status === UserStatus.DEACTIVATED) {
    throw new AppError(status.FORBIDDEN, "User account is deactivated");
  }

  const accessToken = tokenUtils.getAccessToken(toTokenPayload(parsed.user));
  const refreshToken = tokenUtils.getRefreshToken(toTokenPayload(parsed.user));

  return {
    accessToken,
    refreshToken,
    sessionToken: parsed.token,
    user: parsed.user,
  };
};

const getNewToken = async (
  payload: TRefreshTokenPayload | undefined,
  cookieRefreshToken?: string,
  headerRefreshToken?: string,
  sessionToken?: string,
) => {
  const refreshToken =
    payload?.refreshToken || cookieRefreshToken || headerRefreshToken;
  if (!refreshToken && !sessionToken) {
    return null;
  }

  const user = await (async () => {
    if (refreshToken) {
      const verifiedRefreshToken = jwtUtils.verifyToken(
        refreshToken,
        envVariables.REFRESH_TOKEN_SECRET,
      );

      if (!verifiedRefreshToken.success) {
        return null;
      }

      if (
        typeof verifiedRefreshToken.data.id !== "string" ||
        typeof verifiedRefreshToken.data.email !== "string" ||
        (verifiedRefreshToken.data.role !== "MEMBER" &&
          verifiedRefreshToken.data.role !== "ADMIN")
      ) {
        return null;
      }

      return getUserById(verifiedRefreshToken.data.id);
    }

    if (sessionToken) {
      try {
        return await getUserBySessionToken(sessionToken);
      } catch {
        return null;
      }
    }

    return null;
  })();

  if (!user) {
    return null;
  }

  if (user.status === UserStatus.DEACTIVATED) {
    throw new AppError(status.FORBIDDEN, "User account is deactivated");
  }

  if (sessionToken && refreshToken) {
    let sessionUser: Awaited<ReturnType<typeof getUserBySessionToken>> | null =
      null;

    try {
      sessionUser = await getUserBySessionToken(sessionToken);
    } catch {
      return null;
    }

    if (!sessionUser || sessionUser.id !== user.id) {
      return null;
    }
  }

  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  });

  const newAccessToken = tokenUtils.getAccessToken(tokenPayload);
  const newRefreshToken = tokenUtils.getRefreshToken(tokenPayload);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken,
  };
};

const getGoogleSignInUrl = async (callbackUrl?: string) => {
  const payload = (await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: getGoogleCallbackHandlerUrl(callbackUrl),
    },
  })) as { url?: string };

  if (!payload.url) {
    throw new AppError(status.BAD_REQUEST, "Google sign-in URL was not returned");
  }

  return payload.url;
};

const completeSocialLogin = async (
  requestHeaders: Headers,
  sessionToken: string,
) => {
  let user = null;

  try {
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (session?.user) {
      const role = String(session.user.role);

      if (
        (role === "MEMBER" || role === "ADMIN") &&
        typeof session.user.id === "string" &&
        typeof session.user.email === "string"
      ) {
        user = await getUserById(session.user.id);
      }
    }
  } catch {
    user = null;
  }

  if (!user) {
    user = await getUserBySessionToken(sessionToken);
  }

  if (user.status === UserStatus.DEACTIVATED) {
    throw new AppError(status.FORBIDDEN, "User account is deactivated");
  }

  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  });

  return {
    accessToken: tokenUtils.getAccessToken(tokenPayload),
    refreshToken: tokenUtils.getRefreshToken(tokenPayload),
    sessionToken,
    user,
  };
};

const changePassword = async (
  userId: string,
  payload: TChangePasswordPayload,
  sessionToken?: string,
) => {
  if (!sessionToken) {
    throw new AppError(status.UNAUTHORIZED, "Session token is required");
  }

  await auth.api.changePassword({
    body: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const tokenPayload = toTokenPayload({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
  });

  return {
    accessToken: tokenUtils.getAccessToken(tokenPayload),
    refreshToken: tokenUtils.getRefreshToken(tokenPayload),
    sessionToken,
  };
};

const logout = async (sessionToken?: string) => {
  if (!sessionToken) {
    return;
  }

  await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
};

const verifyEmail = async (payload: TVerifyEmailPayload) => {
  await auth.api.verifyEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp,
    },
  });
};

const forgotPassword = async (payload: TForgotPasswordPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email: payload.email,
    },
  });
};

const resetPassword = async (payload: TResetPasswordPayload) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  await auth.api.resetPasswordEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp,
      password: payload.newPassword,
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
    },
  });
};

export const AuthService = {
  register,
  login,
  getNewToken,
  getGoogleSignInUrl,
  completeSocialLogin,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};




