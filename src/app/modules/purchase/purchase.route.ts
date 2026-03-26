import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PurchaseController } from "./purchase.controller";
import { PurchaseValidation } from "./purchase.validation";

const router = Router();

router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(PurchaseValidation.create),
  PurchaseController.create,
);
router.get("/me", checkAuth("MEMBER", "ADMIN"), PurchaseController.getMine);

export const PurchaseRoutes = router;
