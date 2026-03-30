import { CookieOptions, Request, Response } from "express";

const setCookie = (
  res: Response,
  key: string,
  value: string,
  options: CookieOptions,
) => {
  res.cookie(key, value, options);
};

const getCookie = (req: Request, key: string): string | undefined => {
  const value = req.cookies?.[key];
  return typeof value === "string" ? value : undefined;
};

const getBetterAuthSessionCookie = (req: Request): string | undefined => {
  return (
    getCookie(req, "__Secure-better-auth.session_token") ||
    getCookie(req, "better-auth.session_token") ||
    getCookie(req, "session_token")
  );
};

const clearCookie = (res: Response, key: string, options: CookieOptions) => {
  res.clearCookie(key, options);
};

export const CookieUtils = {
  setCookie,
  getCookie,
  getBetterAuthSessionCookie,
  clearCookie,
};
