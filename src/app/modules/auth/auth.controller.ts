import status from "http-status";
import { Request, Response } from "express";
import { envVariables } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { authCookieSettings } from "../../utils/authCookie";
import { CookieUtils } from "../../utils/cookie";
import { tokenUtils } from "../../utils/token";
import { AuthService } from "./auth.service";

const getRefreshTokenFromHeader = (req: Request) => {
  const headerValue = req.headers["x-refresh-token"];

  if (typeof headerValue === "string") {
    return headerValue;
  }

  if (Array.isArray(headerValue) && typeof headerValue[0] === "string") {
    return headerValue[0];
  }

  return undefined;
};

const getGoogleCallbackUrlFromRequest = (req: Request) => {
  if (typeof req.query.callbackUrl === "string") {
    return req.query.callbackUrl;
  }

  if (typeof req.body?.callbackUrl === "string") {
    return req.body.callbackUrl;
  }

  return envVariables.FRONTEND_URL;
};

const toWebHeaders = (req: Request) => {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(","));
    }
  });

  return headers;
};

const getSetCookieHeaders = (headers: Headers) => {
  const getSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }

  const cookieHeader = headers.get("set-cookie");

  if (!cookieHeader) {
    return [];
  }

  const cookies: string[] = [];
  let start = 0;
  let inExpiresAttribute = false;

  for (let index = 0; index < cookieHeader.length; index += 1) {
    const current = cookieHeader[index];
    const ahead = cookieHeader.slice(index, index + 8).toLowerCase();

    if (ahead === "expires=") {
      inExpiresAttribute = true;
      continue;
    }

    if (inExpiresAttribute && current === ";") {
      inExpiresAttribute = false;
      continue;
    }

    if (!inExpiresAttribute && current === ",") {
      const next = cookieHeader.slice(index + 1);

      if (/^\s*[^=;, ]+=/.test(next)) {
        cookies.push(cookieHeader.slice(start, index).trim());
        start = index + 1;
      }
    }
  }

  cookies.push(cookieHeader.slice(start).trim());

  return cookies.filter(Boolean);
};

const applyResponseCookies = (res: Response, headers: Headers) => {
  const cookies = getSetCookieHeaders(headers);

  if (cookies.length > 0) {
    res.setHeader("set-cookie", cookies);
  }
};

const logGoogleCallbackDiagnostics = (
  req: Request,
  redirectTo: string,
  sessionToken?: string,
) => {
  console.log("google callback", {
    url: req.originalUrl,
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    xForwardedHost: req.headers["x-forwarded-host"],
    xForwardedProto: req.headers["x-forwarded-proto"],
    callbackOrigin: `${req.protocol}://${req.get("host")}`,
    resolvedRedirectTo: redirectTo,
    hasSessionTokenCookie: Boolean(sessionToken),
    redirectingToFrontend: redirectTo.startsWith(envVariables.FRONTEND_URL),
  });

  console.log("google callback cookie config", {
    domain: null,
    path: "/",
    sameSite: authCookieSettings.sameSite,
    secure: authCookieSettings.shouldUseSecureCookies,
    httpOnly: true,
  });
};

const register = catchAsync(async (req: Request, res: Response) => {
  if (req.body?.role === "ADMIN") {
    throw new AppError(
      status.FORBIDDEN,
      "Admin accounts can only be created through seeding",
    );
  }

  const result = await AuthService.register(req.body);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getNewToken(
    req.body,
    typeof req.cookies.refreshToken === "string"
      ? req.cookies.refreshToken
      : undefined,
    getRefreshTokenFromHeader(req),
    CookieUtils.getBetterAuthSessionCookie(req),
  );

  if (!result) {
    tokenUtils.clearAuthCookies(res);

    return sendResponse(res, {
      statusCode: status.UNAUTHORIZED,
      success: false,
      message: "Refresh token or session token is required",
    });
  }

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

const googleSignIn = catchAsync(async (req: Request, res: Response) => {
  const callbackUrl = getGoogleCallbackUrlFromRequest(req);
  const authResponse = await AuthService.startGoogleSignIn(callbackUrl);

  applyResponseCookies(res, authResponse.headers);

  const location = authResponse.headers.get("location");

  if (location) {
    return res.redirect(
      authResponse.status >= 300 && authResponse.status < 400
        ? authResponse.status
        : status.TEMPORARY_REDIRECT,
      location,
    );
  }

  const payload = await authResponse.text();
  return res
    .status(authResponse.status)
    .type(authResponse.headers.get("content-type") || "application/json")
    .send(payload);
});

const googleSignInUrl = catchAsync(async (req: Request, res: Response) => {
  const callbackUrl = getGoogleCallbackUrlFromRequest(req);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Google sign-in URL generated successfully",
    data: {
      url: await AuthService.getGoogleSignInUrl(callbackUrl),
    },
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const sessionToken = CookieUtils.getBetterAuthSessionCookie(req);

  if (!sessionToken) {
    throw new AppError(status.UNAUTHORIZED, "Session token is required");
  }

  const result = await AuthService.completeSocialLogin(
    toWebHeaders(req),
    sessionToken,
  );

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);

  const redirectTo =
    typeof req.query.redirectTo === "string"
      ? req.query.redirectTo
      : envVariables.FRONTEND_URL;

  logGoogleCallbackDiagnostics(req, redirectTo, sessionToken);

  res.redirect(status.TEMPORARY_REDIRECT, redirectTo);
});

const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthService.getCurrentUser(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Current user fetched successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthService.changePassword(
    req.user.id,
    req.body,
    CookieUtils.getBetterAuthSessionCookie(req),
  );

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const authResponse = await AuthService.logout(
    CookieUtils.getBetterAuthSessionCookie(req),
  );

  if (authResponse) {
    applyResponseCookies(res, authResponse.headers);
  }

  tokenUtils.clearAuthCookies(res);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged out successfully",
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Email verified successfully",
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset OTP sent successfully",
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successfully",
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  googleSignIn,
  googleSignInUrl,
  googleCallback,
  me,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

