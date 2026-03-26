import type { TRequestUser } from "./requestUser.interface";

declare global {
  namespace Express {
    interface Request {
      user?: TRequestUser;
    }
  }
}

export {};
