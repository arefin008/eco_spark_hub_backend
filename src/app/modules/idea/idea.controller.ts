import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { IdeaService } from "./idea.service";

const create = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await IdeaService.create(req.user.id, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Idea created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.getAll(req.query, req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Ideas fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.getById(String(req.params.id), req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea fetched successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await IdeaService.update(String(req.params.id), req.user.id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await IdeaService.remove(String(req.params.id), req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea deleted successfully",
    data: result,
  });
});

const submitForReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await IdeaService.submitForReview(String(req.params.id), req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea submitted for review successfully",
    data: result,
  });
});

const review = catchAsync(async (req: Request, res: Response) => {
  const result = await IdeaService.review(String(req.params.id), req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Idea review action completed",
    data: result,
  });
});

const getMine = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await IdeaService.getMine(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My ideas fetched successfully",
    data: result,
  });
});

export const IdeaController = {
  create,
  getAll,
  getById,
  update,
  remove,
  submitForReview,
  review,
  getMine,
};

