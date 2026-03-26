import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { VoteController } from "./vote.controller";
import { VoteValidation } from "./vote.validation";

const router = Router();

router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.upsert),
  VoteController.upsert,
);
router.delete(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(VoteValidation.remove),
  VoteController.remove,
);

export const VoteRoutes = router;
