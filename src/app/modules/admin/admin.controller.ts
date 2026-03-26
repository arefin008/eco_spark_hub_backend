import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getStats();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin stats fetched successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(String(req.params.id), req.body.status);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

export const AdminController = {
  getStats,
  updateUserStatus,
};

