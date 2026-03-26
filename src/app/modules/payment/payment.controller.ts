import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const confirm = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.confirmPayment(
    req.body.purchaseId,
    req.body.transactionId,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment confirmed successfully",
    data: result,
  });
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Webhook received",
    data: req.body,
  });
});

export const PaymentController = {
  confirm,
  webhook,
};
