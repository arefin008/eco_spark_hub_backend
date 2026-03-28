import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    });

    next();
  };
};
