import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { IdeaController } from "./idea.controller";
import { IdeaValidation } from "./idea.validation";

const router = Router();

router.get("/", IdeaController.getAll);
router.get("/mine", checkAuth("MEMBER", "ADMIN"), IdeaController.getMine);
router.get("/:id", IdeaController.getById);
router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.create),
  IdeaController.create,
);
router.patch(
  "/:id",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(IdeaValidation.update),
  IdeaController.update,
);
router.delete("/:id", checkAuth("MEMBER", "ADMIN"), IdeaController.remove);
router.patch(
  "/:id/submit",
  checkAuth("MEMBER", "ADMIN"),
  IdeaController.submitForReview,
);
router.patch(
  "/:id/review",
  checkAuth("ADMIN"),
  validateRequest(IdeaValidation.review),
  IdeaController.review,
);

export const IdeaRoutes = router;
