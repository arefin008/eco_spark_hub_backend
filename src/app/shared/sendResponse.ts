import { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: Record<string, unknown>;
  data?: T;
};

export const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
  const { statusCode, ...rest } = payload;
  return res.status(statusCode).json(rest);
};
