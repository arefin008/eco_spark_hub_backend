import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CommentController } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = Router();

router.get("/idea/:ideaId", CommentController.listByIdea);
router.post(
  "/",
  checkAuth("MEMBER", "ADMIN"),
  validateRequest(CommentValidation.create),
  CommentController.create,
);
router.delete("/:id", checkAuth("MEMBER", "ADMIN"), CommentController.remove);

export const CommentRoutes = router;
