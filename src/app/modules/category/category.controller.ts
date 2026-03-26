import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CategoryService } from "./category.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.create(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryService.getAll();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.update(String(req.params.id), req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.remove(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const CategoryController = {
  create,
  getAll,
  update,
  remove,
};

