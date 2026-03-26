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
router.post("/webhook", PaymentController.webhook);

export const PaymentRoutes = router;
