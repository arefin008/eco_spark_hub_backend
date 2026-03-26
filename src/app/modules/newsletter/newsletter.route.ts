import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { NewsletterController } from "./newsletter.controller";
import { NewsletterValidation } from "./newsletter.validation";

const router = Router();

router.post(
  "/subscribe",
  validateRequest(NewsletterValidation.subscribe),
  NewsletterController.subscribe,
);
router.patch("/unsubscribe/:email", NewsletterController.unsubscribe);
router.get("/", checkAuth("ADMIN"), NewsletterController.getAll);

export const NewsletterRoutes = router;
