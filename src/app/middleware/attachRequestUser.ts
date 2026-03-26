import { NextFunction, Request, Response } from "express";

// Dev-friendly auth bridge: attach user from headers set by client/gateway.
export const attachRequestUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = req.header("x-user-id");
  const email = req.header("x-user-email");
  const role = req.header("x-user-role");

  if (id && email && (role === "MEMBER" || role === "ADMIN")) {
    req.user = { id, email, role };
  }

  next();
};
