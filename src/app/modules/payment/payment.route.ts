import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/confirm",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PaymentValidation.confirm),
  PaymentController.confirm,
);
router.get("/stripe/success", PaymentController.stripeSuccess);
router.get("/stripe/cancel", PaymentController.stripeCancel);
router.post(
  "/:purchaseId/checkout",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.createCheckout,
);
router.get(
  "/:purchaseId/status",
  checkAuth("MEMBER", "ADMIN"),
  PaymentController.statusById,
);
router.post("/webhook", PaymentController.webhook);

export const PaymentRoutes = router;
