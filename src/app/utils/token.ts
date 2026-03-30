import { CookieOptions, Response } from "express";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { envVariables } from "../config/env";
import { authCookieSettings } from "./authCookie";
import { CookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";

type TAuthTokenPayload = JwtPayload & {
  id: string;
  email: string;
  role: "MEMBER" | "ADMIN";
  status?: string;
  emailVerified?: boolean;
};

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieCommonOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: authCookieSettings.sameSite,
  path: "/",
  maxAge: SEVEN_DAYS_IN_MS,
});

const logCookieOperation = (
  action: "set" | "clear",
  key: string,
  options: CookieOptions,
) => {
  if (envVariables.NODE_ENV !== "production") {
    console.log("auth cookie", {
      action,
      key,
      domain: options.domain ?? null,
      path: options.path ?? null,
      sameSite: options.sameSite ?? null,
      secure: options.secure ?? null,
      httpOnly: options.httpOnly ?? null,
      maxAge: options.maxAge ?? null,
    });
  }
};

const getAccessToken = (payload: TAuthTokenPayload) => {
  return jwtUtils.createToken(payload, envVariables.ACCESS_TOKEN_SECRET, {
    expiresIn: envVariables.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const getRefreshToken = (payload: TAuthTokenPayload) => {
  return jwtUtils.createToken(payload, envVariables.REFRESH_TOKEN_SECRET, {
    expiresIn: envVariables.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions);
};

const setAccessTokenCookie = (res: Response, token: string) => {
  const options = getCookieCommonOptions();

  logCookieOperation("set", "accessToken", options);
  CookieUtils.setCookie(res, "accessToken", token, options);
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  const options = getCookieCommonOptions();

  logCookieOperation("set", "refreshToken", options);
  CookieUtils.setCookie(res, "refreshToken", token, options);
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  const options = getCookieCommonOptions();

  logCookieOperation("set", "better-auth.session_token", options);
  CookieUtils.setCookie(res, "better-auth.session_token", token, options);
};

const clearCookieWithLogging = (
  res: Response,
  key: string,
  options: CookieOptions,
) => {
  logCookieOperation("clear", key, options);
  CookieUtils.clearCookie(res, key, options);
};

const clearAuthCookies = (res: Response) => {
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: authCookieSettings.sameSite,
    path: "/",
  } satisfies CookieOptions;

  clearCookieWithLogging(res, "accessToken", options);
  clearCookieWithLogging(res, "refreshToken", options);
  clearCookieWithLogging(res, "__Secure-better-auth.session_token", options);
  clearCookieWithLogging(res, "better-auth.session_token", options);
  clearCookieWithLogging(res, "session_token", options);
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
  clearAuthCookies,
};

export type { TAuthTokenPayload };
