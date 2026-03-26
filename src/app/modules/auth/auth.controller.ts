import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthService.getCurrentUser(req.user.id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Current user fetched successfully",
    data: result,
  });
});

export const AuthController = {
  me,
};
