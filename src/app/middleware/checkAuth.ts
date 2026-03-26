import { NextFunction, Request, Response } from "express";

export const checkAuth = (...roles: Array<"MEMBER" | "ADMIN">) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return next();
  };
};
