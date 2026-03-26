import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { NewsletterService } from "./newsletter.service";

const subscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsletterService.subscribe(req.body.email);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Subscribed successfully",
    data: result,
  });
});

const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsletterService.unsubscribe(String(req.params.email));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Unsubscribed successfully",
    data: result,
  });
});

const getAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await NewsletterService.getAll();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Subscribers fetched successfully",
    data: result,
  });
});

export const NewsletterController = {
  subscribe,
  unsubscribe,
  getAll,
};

