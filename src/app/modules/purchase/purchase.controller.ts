import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PurchaseService } from "./purchase.service";

const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await PurchaseService.create(
    { id: req.user.id, email: req.user.email },
    req.body,
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Purchase initialized successfully",
    data: result,
  });
});

const getMine = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await PurchaseService.getMine(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My purchases fetched successfully",
    data: result,
  });
});

export const PurchaseController = {
  create,
  getMine,
};
