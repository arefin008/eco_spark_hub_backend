import status from "http-status";
import { Request, Response } from "express";
import AppError from "../../errorHelpers/AppError";
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

const statusById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await PaymentService.getPurchaseStatus(
    String(req.params.purchaseId),
    req.user.id,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payment status fetched successfully",
    data: result,
  });
});

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new AppError(status.UNAUTHORIZED, "Unauthorized");

  const result = await PaymentService.createCheckoutForPurchase(
    String(req.params.purchaseId),
    req.user.id,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const stripeSuccess = catchAsync(async (req: Request, res: Response) => {
  const sessionId = String(req.query.session_id || "");
  if (!sessionId) throw new AppError(status.BAD_REQUEST, "session_id is required");

  const purchase = await PaymentService.confirmStripeSession(sessionId);
  const purchaseForTemplate = await PaymentService.getPurchaseForTemplate(purchase.id);

  return res.status(status.OK).render("payment", {
    paymentStatus: purchaseForTemplate.status,
    name: purchaseForTemplate.user.name || purchaseForTemplate.user.email,
    ideaTitle: purchaseForTemplate.idea.title,
    amount: purchaseForTemplate.amount.toString(),
    currency: purchaseForTemplate.currency,
    transactionId: purchaseForTemplate.transactionId || "N/A",
    paymentProvider: purchaseForTemplate.paymentProvider,
    paidAt: purchaseForTemplate.purchasedAt
      ? purchaseForTemplate.purchasedAt.toISOString()
      : "Pending",
  });
});

const stripeCancel = catchAsync(async (req: Request, res: Response) => {
  const purchaseId = String(req.query.purchaseId || "");
  if (!purchaseId) throw new AppError(status.BAD_REQUEST, "purchaseId is required");

  await PaymentService.markPaymentFailed(purchaseId);
  const purchaseForTemplate = await PaymentService.getPurchaseForTemplate(purchaseId);

  return res.status(status.OK).render("payment", {
    paymentStatus: purchaseForTemplate.status,
    name: purchaseForTemplate.user.name || purchaseForTemplate.user.email,
    ideaTitle: purchaseForTemplate.idea.title,
    amount: purchaseForTemplate.amount.toString(),
    currency: purchaseForTemplate.currency,
    transactionId: purchaseForTemplate.transactionId || "N/A",
    paymentProvider: purchaseForTemplate.paymentProvider,
    paidAt: purchaseForTemplate.purchasedAt
      ? purchaseForTemplate.purchasedAt.toISOString()
      : "Not paid yet",
  });
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    throw new AppError(status.BAD_REQUEST, "Missing stripe-signature header");
  }

  if (!req.rawBody) {
    throw new AppError(status.BAD_REQUEST, "Missing raw request body for webhook");
  }

  const event = await PaymentService.verifyAndHandleWebhook(req.rawBody, signature);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Webhook processed",
    data: { id: event.id, type: event.type },
  });
});

export const PaymentController = {
  confirm,
  statusById,
  createCheckout,
  stripeSuccess,
  stripeCancel,
  webhook,
};
