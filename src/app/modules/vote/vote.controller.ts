import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { VoteService } from "./vote.service";

const upsert = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await VoteService.upsert(req.user.id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vote saved successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await VoteService.remove(req.user.id, req.body.ideaId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vote removed successfully",
    data: result,
  });
});

export const VoteController = {
  upsert,
  remove,
};
