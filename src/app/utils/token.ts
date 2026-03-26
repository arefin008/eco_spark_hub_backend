import { CookieOptions, Response } from "express";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import ms, { StringValue } from "ms";
import { envVariables } from "../config/env";
import { CookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";

type TAuthTokenPayload = JwtPayload & {
  id: string;
  email: string;
  role: "MEMBER" | "ADMIN";
  status?: string;
  emailVerified?: boolean;
};

const getCookieCommonOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: envVariables.NODE_ENV === "production",
  sameSite: envVariables.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

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
  CookieUtils.setCookie(res, "accessToken", token, {
    ...getCookieCommonOptions(),
    maxAge: ms(envVariables.ACCESS_TOKEN_EXPIRES_IN as StringValue),
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, "refreshToken", token, {
    ...getCookieCommonOptions(),
    maxAge: ms(envVariables.REFRESH_TOKEN_EXPIRES_IN as StringValue),
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  CookieUtils.setCookie(res, "better-auth.session_token", token, {
    ...getCookieCommonOptions(),
    maxAge: ms(
      envVariables.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue,
    ),
  });
};

const clearAuthCookies = (res: Response) => {
  const options = getCookieCommonOptions();

  CookieUtils.clearCookie(res, "accessToken", options);
  CookieUtils.clearCookie(res, "refreshToken", options);
  CookieUtils.clearCookie(res, "better-auth.session_token", options);
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
