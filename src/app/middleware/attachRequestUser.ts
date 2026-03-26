import { NextFunction, Request, Response } from "express";
import { envVariables } from "../config/env";
import { auth } from "../lib/auth";
import { jwtUtils } from "../utils/jwt";

const toWebHeaders = (req: Request): Headers => {
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

export const attachRequestUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: toWebHeaders(req),
    });

    if (session?.user) {
      const role = String(session.user.role);

      if (role === "MEMBER" || role === "ADMIN") {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          role,
        };
      }
    }

    if (!req.user) {
      const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined;
      const accessToken =
        bearerToken ||
        (typeof req.cookies?.accessToken === "string"
          ? req.cookies.accessToken
          : undefined);

      if (accessToken) {
        const verified = jwtUtils.verifyToken(
          accessToken,
          envVariables.ACCESS_TOKEN_SECRET,
        );

        if (verified.success) {
          const role = verified.data.role;

          if (
            (role === "MEMBER" || role === "ADMIN") &&
            typeof verified.data.id === "string" &&
            typeof verified.data.email === "string"
          ) {
            req.user = {
              id: verified.data.id,
              email: verified.data.email,
              role,
            };
          }
        }
      }
    }
  } catch {
    // No-op: unauthenticated requests should continue to public routes.
  }

  next();
};
