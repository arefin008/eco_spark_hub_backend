/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { Prisma } from "../../generated/prisma/client";
import { envVariables } from "../config/env";
import AppError from "../errorHelpers/AppError";
import {
  handlePrismaClientKnownRequestError,
  handlePrismaClientUnknownError,
  handlePrismaClientValidationError,
  handlerPrismaClientInitializationError,
  handlerPrismaClientRustPanicError,
} from "../errorHelpers/handlePrismaErrors";
import { handleZodError } from "../errorHelpers/handleZodError";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVariables.NODE_ENV === "development") {
    console.log("Error from Global Error Handler", err);
  }

  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack: string | undefined;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplified = handlePrismaClientKnownRequestError(err);
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplified = handlePrismaClientUnknownError(err);
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplified = handlePrismaClientValidationError(err);
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    const simplified = handlerPrismaClientInitializationError(err);
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    const simplified = handlerPrismaClientRustPanicError();
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof z.ZodError) {
    const simplified = handleZodError(err);
    statusCode = simplified.statusCode as number;
    message = simplified.message;
    errorSources = simplified.errorSources;
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
    stack = err.stack;
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
    stack = err.stack;
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    errorSources,
    error: envVariables.NODE_ENV === "development" ? err : undefined,
    stack: envVariables.NODE_ENV === "development" ? stack : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
