import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AiService } from "./ai.service";

const assistant = catchAsync(async (req: Request, res: Response) => {
  const result = await AiService.askAssistant(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "AI assistant response generated successfully",
    data: result,
  });
});

const draft = catchAsync(async (req: Request, res: Response) => {
  const result = await AiService.generateDraft(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "AI draft generated successfully",
    data: result,
  });
});

export const AiController = {
  assistant,
  draft,
};
