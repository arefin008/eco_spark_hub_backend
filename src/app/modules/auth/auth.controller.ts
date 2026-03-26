import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { tokenUtils } from "../../utils/token";
import { AuthService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getNewToken(
    req.body,
    typeof req.cookies.refreshToken === "string"
      ? req.cookies.refreshToken
      : undefined,
    typeof req.cookies["better-auth.session_token"] === "string"
      ? req.cookies["better-auth.session_token"]
      : undefined,
  );

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

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

const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized");
  }

  const result = await AuthService.changePassword(
    req.user.id,
    req.body,
    typeof req.cookies["better-auth.session_token"] === "string"
      ? req.cookies["better-auth.session_token"]
      : undefined,
  );

  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);

  if (result.sessionToken) {
    tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logout(
    typeof req.cookies["better-auth.session_token"] === "string"
      ? req.cookies["better-auth.session_token"]
      : undefined,
  );

  tokenUtils.clearAuthCookies(res);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User logged out successfully",
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Email verified successfully",
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset OTP sent successfully",
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Password reset successfully",
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  me,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
