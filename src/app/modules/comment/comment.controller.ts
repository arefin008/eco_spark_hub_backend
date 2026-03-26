import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CommentService } from "./comment.service";

const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await CommentService.create(req.user.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Comment added successfully",
    data: result,
  });
});

const listByIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await CommentService.listByIdea(String(req.params.ideaId));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comments fetched successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await CommentService.remove(String(req.params.id), req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentController = {
  create,
  listByIdea,
  remove,
};

